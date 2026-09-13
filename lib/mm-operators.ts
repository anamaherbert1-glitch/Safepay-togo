/** Cyenoo V1 — opérateurs Mobile Money nationaux (pas de carte, pas de cross-border). */

export type CorridorCountry = "TG" | "BF";

export type MmOperator = {
  code: string;
  label: string;
  country: CorridorCountry;
};

export const CYENOO_CORRIDORS: { code: CorridorCountry; label: string }[] = [
  { code: "TG", label: "Togo" },
  { code: "BF", label: "Burkina Faso" },
];

export const MM_OPERATORS: MmOperator[] = [
  { code: "TMONEY", label: "T-Money", country: "TG" },
  { code: "MOOV_TG", label: "Moov Money", country: "TG" },
  { code: "ORANGE_BF", label: "Orange Money", country: "BF" },
  { code: "MOOV_BF", label: "Moov Money", country: "BF" },
];

export function operatorsForCountry(country: CorridorCountry): MmOperator[] {
  return MM_OPERATORS.filter((o) => o.country === country);
}

export type PaymentSource = "wallet" | "direct_mm";
