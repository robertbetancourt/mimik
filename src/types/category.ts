export interface Word {
  id: string;
  texto: string;
  dificultad?: "facil" | "normal" | "dificil";
}

export interface Category {
  id: string;
  titulo: string;
  descripcion: string;
  version: number;
  idioma: string;
  ilustracion: string;
  palabras: Word[];
}
