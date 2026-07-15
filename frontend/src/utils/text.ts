/**
 * Normaliza un texto eliminando acentos/diacríticos para búsquedas insensibles a tildes.
 * Ej: "Métodos Numéricos" → "metodos numericos"
 */
export const normalizar = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
