export enum TalleEnum {
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
