export enum TalleEnum {
  // Talles niños
  T6 = '6',
  T8 = '8',
  T10 = '10',
  T12 = '12',
  T14 = '14',
  T16 = '16',
  // Talles adultos
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL'
}

export const TALLES_OPTIONS = Object.values(TalleEnum);

export const getTalleLabel = (talle: TalleEnum): string => {
  return talle;
};