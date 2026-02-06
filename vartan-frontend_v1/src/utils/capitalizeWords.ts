/**
 * Capitaliza la primera letra de cada palabra en un texto
 * @param text El texto a capitalizar
 * @returns El texto con cada palabra capitalizada
 */
export function capitalizeWords(text: string): string {
  if (!text) return '';

  return text
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

