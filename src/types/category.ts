export interface Word {
  id: string;
  texto: string;
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
