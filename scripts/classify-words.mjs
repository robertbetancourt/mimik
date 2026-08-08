/**
 * classify-words.mjs
 *
 * Classifies every word in the Mimik category JSON files as "facil", "normal"
 * or "dificil" using the Gemini API, then writes the result back in-place.
 *
 * Usage:
 *   $env:GEMINI_API_KEY="your_key"; node scripts/classify-words.mjs
 *
 * Flags:
 *   --dry-run   Print what would change without writing files
 *   --lang ES   Only process ES files (default: both ES and EN)
 *   --lang EN   Only process EN files
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_DIR = join(ROOT, "data", "categories");

const API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const DRY_RUN = process.argv.includes("--dry-run");
const LANG_FLAG = process.argv.indexOf("--lang");
const ONLY_LANG = LANG_FLAG !== -1 ? process.argv[LANG_FLAG + 1]?.toUpperCase() : null;

const BATCH_SIZE = 60;
const DELAY_MS = 600;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function classifyBatch(words, categoryTitle, lang) {
  const langNote = lang === "EN" ? "in English" : "in Spanish";
  const wordList = words.map((w, i) => `${i + 1}. ${w.texto}`).join("\n");

  const prompt = `You are classifying words from the board game category "${categoryTitle}" ${langNote}.
Classify each word as one of: facil, normal, dificil

Criteria:
- facil: A child of 8-10 years old would know this word immediately. Very common, visual, everyday.
- normal: An average adult knows it. Common cultural knowledge, not specialized.
- dificil: Requires specific knowledge, uncommon, or known only to enthusiasts/experts.

Return ONLY a JSON array with objects {id, dificultad} where id is the 1-based index.
No explanations, no markdown, no extra text. Example: [{"id":1,"dificultad":"facil"},{"id":2,"dificultad":"normal"}]

Words to classify:
${wordList}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
  };

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) parsed = JSON.parse(match[0]);
    else throw new Error(`Could not parse Gemini response: ${raw.slice(0, 200)}`);
  }

  return parsed;
}

async function processFile({ path, name, lang }) {
  const raw = readFileSync(path, "utf-8");
  const data = JSON.parse(raw);
  const words = data.palabras;
  const categoryTitle = data.titulo;

  console.log(`\n📂 ${lang}/${name}  (${words.length} words)`);

  const reportLines = [`## ${categoryTitle} (${lang})\n`];
  let changed = 0;

  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(words.length / BATCH_SIZE);

    process.stdout.write(`  Batch ${batchNum}/${totalBatches}...`);

    let results;
    try {
      results = await classifyBatch(batch, categoryTitle, lang);
    } catch (err) {
      console.error(`\n  Error in batch ${batchNum}: ${err.message}`);
      await sleep(DELAY_MS * 2);
      continue;
    }

    for (const result of results) {
      const wordIndex = i + result.id - 1;
      const word = words[wordIndex];
      if (!word) continue;
      if (word.dificultad !== result.dificultad) {
        word.dificultad = result.dificultad;
        changed++;
      }
      reportLines.push(`- ${result.dificultad.padEnd(7)} ${word.texto}`);
    }

    console.log(` OK (${results.length} words)`);
    await sleep(DELAY_MS);
  }

  console.log(`  => ${changed} words updated`);

  if (!DRY_RUN && changed > 0) {
    writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
    console.log(`  Saved ${name}`);
  } else if (DRY_RUN) {
    console.log(`  [DRY RUN] Would have saved ${name}`);
  }

  return reportLines;
}

async function main() {
  if (!API_KEY) {
    console.error("Missing GEMINI_API_KEY environment variable.");
    console.error("Get one free at: https://aistudio.google.com/app/apikey");
    console.error("Then run: $env:GEMINI_API_KEY='your_key'; node scripts/classify-words.mjs");
    process.exit(1);
  }

  const langs = ONLY_LANG ? [ONLY_LANG] : ["ES", "EN"];
  const files = [];
  for (const lang of langs) {
    const dir = join(DATA_DIR, lang);
    let names;
    try {
      names = readdirSync(dir).filter((f) => f.endsWith(".json"));
    } catch {
      console.warn(`Directory not found: ${dir}`);
      continue;
    }
    for (const name of names) {
      files.push({ lang, path: join(dir, name), name });
    }
  }

  if (files.length === 0) {
    console.error("No JSON files found in data/categories/");
    process.exit(1);
  }

  console.log("Mimik Word Classifier");
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  console.log(`Files: ${files.length} | Batch: ${BATCH_SIZE} words`);

  const allReportLines = [
    "# Word Classification Report",
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`,
    "\n---\n",
  ];

  for (const file of files) {
    const lines = await processFile(file);
    allReportLines.push(...lines, "");
  }

  mkdirSync(join(ROOT, "scripts"), { recursive: true });
  const reportPath = join(ROOT, "scripts", "classify-report.md");
  writeFileSync(reportPath, allReportLines.join("\n"), "utf-8");
  console.log(`\nReport saved to scripts/classify-report.md`);
  console.log(`Done! ${DRY_RUN ? "(DRY RUN - no files modified)" : "All files updated."}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
