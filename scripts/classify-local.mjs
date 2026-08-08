import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Words (or substrings) that are generally very easy for kids
const FACIL_KEYWORDS = [
  // Animals
  "perro", "gato", "conejo", "vaca", "cerdo", "caballo", "oso", "león", "leon", "pato", "tigre", "mono", "elefante", "jirafa",
  "dog", "cat", "rabbit", "cow", "pig", "horse", "bear", "lion", "duck", "tiger", "monkey", "elephant", "giraffe",
  // Colors/Shapes/Basic
  "rojo", "azul", "verde", "red", "blue", "green", "circle", "círculo",
  // Foods
  "manzana", "banana", "pizza", "hamburguesa", "agua", "leche", "pan", "queso",
  "apple", "pizza", "burger", "hamburger", "water", "milk", "bread", "cheese",
  // Movies/Heroes
  "spiderman", "spider-man", "batman", "superman", "peppa", "paw patrol", "mario", "sonic", "pikachu", "bob esponja", "spongebob",
  "frozen", "toy story", "lion king", "rey león", "shrek", "nemo",
  // Games
  "minecraft", "roblox", "fortnite",
  // Daily life
  "casa", "cama", "mesa", "silla", "house", "bed", "table", "chair"
];

// Words that require specific enthusiast knowledge or are obscure
const DIFICIL_KEYWORDS = [
  // Animals
  "ajolote", "ñu", "yak", "ornitorrinco", "axolotl", "platypus", "wildebeest", "pangolín", "pangolin", "okapi", "tardígrado", "tardigrade",
  // Movies/Series
  "pulp fiction", "godfather", "padrino", "sopranos", "wire", "fargo", "blade runner", "matrix",
  // Celebrities (Classic/older or niche)
  "marlon brando", "chaplin", "marilyn monroe", "elvis", "beatles", "sinatra",
  // Geography/World
  "kyrgyzstan", "uzbekistán", "tayikistán", "liechtenstein", "andorra",
  // Food
  "caviar", "foie gras", "escargot", "trufa", "truffle"
];

function classifyWord(text, index, total) {
  const lower = text.toLowerCase();
  
  // 1. Explicit keyword matching
  if (FACIL_KEYWORDS.some(k => lower.includes(k))) return "facil";
  if (DIFICIL_KEYWORDS.some(k => lower.includes(k))) return "dificil";

  // 2. Position-based heuristic (as the arrays are generally ordered by popularity)
  // First 35% are usually the most common examples of the category
  const ratio = index / total;
  if (ratio < 0.35) return "facil";
  // Last 25% are usually the most obscure examples
  if (ratio > 0.75) return "dificil";
  
  return "normal";
}

function processDirectory(lang) {
  const dir = join(ROOT, "data", "categories", lang);
  const files = readdirSync(dir).filter(f => f.endsWith(".json"));
  
  let totalUpdated = 0;
  for (const file of files) {
    const filePath = join(dir, file);
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    
    const totalWords = data.palabras.length;
    data.palabras = data.palabras.map((w, index) => {
      return {
        ...w,
        dificultad: classifyWord(w.texto, index, totalWords)
      };
    });
    
    writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
    totalUpdated += totalWords;
    console.log(`✅ ${file}: Classified ${totalWords} words.`);
  }
  return totalUpdated;
}

console.log("Starting local classification (heuristic based)...");
const esUpdated = processDirectory("ES");
const enUpdated = processDirectory("EN");
console.log(`\nDone! Classified ${esUpdated + enUpdated} words across both languages.`);
