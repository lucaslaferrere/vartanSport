export enum ColorEnum {
  BLANCO = 'Blanco',
  NEGRO = 'Negro',
  AZUL = 'Azul',
  ROJO = 'Rojo',
  VERDE = 'Verde',
  AMARILLO = 'Amarillo',
  GRIS = 'Gris',
  ROSA = 'Rosa',
  MORADO = 'Morado',
  NARANJA = 'Naranja'
}

export const COLORES_OPTIONS = Object.values(ColorEnum);

export const getColorLabel = (color: ColorEnum): string => {
  return color;
};
