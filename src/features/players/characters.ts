export interface CharacterCategory {
  id: string;
  emoji: string;
  label: string;
}

export interface Character {
  id: string;
  categoryId: string;
  illustration: number;
}

export const ALL_CHARACTERS_CATEGORY_ID = "all";

export const characterCategories: CharacterCategory[] = [
  { id: ALL_CHARACTERS_CATEGORY_ID, emoji: "✨", label: "Todos" },
  { id: "faces", emoji: "😊", label: "Caras" },
  { id: "warriors", emoji: "⚔️", label: "Guerreros" },
  { id: "fantasy", emoji: "🪄", label: "Fantasía" },
  { id: "animals", emoji: "🐻", label: "Animales" },
  { id: "food", emoji: "🍔", label: "Comida" },
  { id: "space", emoji: "🚀", label: "Espacio" },
  { id: "jobs", emoji: "💼", label: "Oficios" },
];

// Metro requires static, literal require() calls, so every file is listed
// explicitly instead of built dynamically from the folder contents.
export const characters: Character[] = [
  { id: "cool", categoryId: "faces", illustration: require("../../../assets/images/players_characters/cool.png") },
  { id: "curioso", categoryId: "faces", illustration: require("../../../assets/images/players_characters/curioso.png") },
  { id: "emocion", categoryId: "faces", illustration: require("../../../assets/images/players_characters/emocion.png") },
  { id: "feliz", categoryId: "faces", illustration: require("../../../assets/images/players_characters/feliz.png") },
  { id: "sonrisa", categoryId: "faces", illustration: require("../../../assets/images/players_characters/sonrisa.png") },
  { id: "triste", categoryId: "faces", illustration: require("../../../assets/images/players_characters/triste.png") },
  { id: "love", categoryId: "faces", illustration: require("../../../assets/images/players_characters/love.png") },
  { id: "dormido", categoryId: "faces", illustration: require("../../../assets/images/players_characters/dormido.png") },
  { id: "nerd", categoryId: "faces", illustration: require("../../../assets/images/players_characters/nerd.png") },

  { id: "guerrera", categoryId: "warriors", illustration: require("../../../assets/images/players_characters/guerrera.png") },
  { id: "samurai", categoryId: "warriors", illustration: require("../../../assets/images/players_characters/samurai.png") },
  { id: "ninja", categoryId: "warriors", illustration: require("../../../assets/images/players_characters/ninja.png") },
  { id: "pirata", categoryId: "warriors", illustration: require("../../../assets/images/players_characters/pirata.png") },
  { id: "vikingo", categoryId: "warriors", illustration: require("../../../assets/images/players_characters/vikingo.png") },
  { id: "vaquero", categoryId: "warriors", illustration: require("../../../assets/images/players_characters/vaquero.png") },
  { id: "heroe", categoryId: "warriors", illustration: require("../../../assets/images/players_characters/heroe.png") },

  { id: "wizard", categoryId: "fantasy", illustration: require("../../../assets/images/players_characters/wizard.png") },
  { id: "dragon", categoryId: "fantasy", illustration: require("../../../assets/images/players_characters/dragon.png") },
  { id: "ghost", categoryId: "fantasy", illustration: require("../../../assets/images/players_characters/ghost.png") },
  { id: "vamp", categoryId: "fantasy", illustration: require("../../../assets/images/players_characters/vamp.png") },
  { id: "slime", categoryId: "fantasy", illustration: require("../../../assets/images/players_characters/slime.png") },

  { id: "gato", categoryId: "animals", illustration: require("../../../assets/images/players_characters/gato.png") },
  { id: "gato-espacial", categoryId: "animals", illustration: require("../../../assets/images/players_characters/gato-espacial.png") },
  { id: "oso", categoryId: "animals", illustration: require("../../../assets/images/players_characters/oso.png") },
  { id: "panda", categoryId: "animals", illustration: require("../../../assets/images/players_characters/panda.png") },
  { id: "koala", categoryId: "animals", illustration: require("../../../assets/images/players_characters/koala.png") },
  { id: "rana", categoryId: "animals", illustration: require("../../../assets/images/players_characters/rana.png") },
  { id: "tigre", categoryId: "animals", illustration: require("../../../assets/images/players_characters/tigre.png") },
  { id: "zorro", categoryId: "animals", illustration: require("../../../assets/images/players_characters/zorro.png") },
  { id: "pinguino", categoryId: "animals", illustration: require("../../../assets/images/players_characters/pinguino.png") },

  { id: "aguacate", categoryId: "food", illustration: require("../../../assets/images/players_characters/aguacate.png") },
  { id: "dona", categoryId: "food", illustration: require("../../../assets/images/players_characters/dona.png") },
  { id: "fresa", categoryId: "food", illustration: require("../../../assets/images/players_characters/fresa.png") },
  { id: "galleta", categoryId: "food", illustration: require("../../../assets/images/players_characters/galleta.png") },
  { id: "hamburguesa", categoryId: "food", illustration: require("../../../assets/images/players_characters/hamburguesa.png") },
  { id: "helado", categoryId: "food", illustration: require("../../../assets/images/players_characters/helado.png") },
  { id: "sushi", categoryId: "food", illustration: require("../../../assets/images/players_characters/sushi.png") },

  { id: "ovni", categoryId: "space", illustration: require("../../../assets/images/players_characters/ovni.png") },
  { id: "planeta", categoryId: "space", illustration: require("../../../assets/images/players_characters/planeta.png") },
  { id: "space", categoryId: "space", illustration: require("../../../assets/images/players_characters/space.png") },
  { id: "robot", categoryId: "space", illustration: require("../../../assets/images/players_characters/robot.png") },

  { id: "detective", categoryId: "jobs", illustration: require("../../../assets/images/players_characters/detective.png") },
  { id: "fotografo", categoryId: "jobs", illustration: require("../../../assets/images/players_characters/fotografo.png") },
  { id: "profesor", categoryId: "jobs", illustration: require("../../../assets/images/players_characters/profesor.png") },
  { id: "exploradora", categoryId: "jobs", illustration: require("../../../assets/images/players_characters/exploradora.png") },
];

export function getCharacterById(id: string): Character | undefined {
  return characters.find((character) => character.id === id);
}

export function pickRandomCharacterId(excludeIds: string[]): string {
  const unused = characters.filter((character) => !excludeIds.includes(character.id));
  const pool = unused.length > 0 ? unused : characters;
  return pool[Math.floor(Math.random() * pool.length)].id;
}
