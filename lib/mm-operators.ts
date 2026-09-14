/** Cyenoo — opérateurs Mobile Money nationaux (même pays uniquement). */

export type CorridorCountry = "TG" | "BF" | "BJ" | "CI" | "SN" | "ML" | "NE";

export type MmOperator = {
  code: string;
  label: string;
  country: CorridorCountry;
};

export const CYENOO_CORRIDORS: { code: CorridorCountry; label: string }[] = [
  { code: "TG", label: "Togo" },
  { code: "BF", label: "Burkina Faso" },
  { code: "BJ", label: "Bénin" },
  { code: "CI", label: "Côte d'Ivoire" },
  { code: "SN", label: "Sénégal" },
  { code: "ML", label: "Mali" },
  { code: "NE", label: "Niger" },
];

export const MM_OPERATORS: MmOperator[] = [
  // Togo
  { code: "TMONEY", label: "T-Money", country: "TG" },
  { code: "MOOV_TG", label: "Moov Money", country: "TG" },
  // Burkina Faso
  { code: "ORANGE_BF", label: "Orange Money", country: "BF" },
  { code: "MOOV_BF", label: "Moov Money", country: "BF" },
  // Bénin
  { code: "MTN_BJ", label: "MTN MoMo", country: "BJ" },
  { code: "MOOV_BJ", label: "Moov Money", country: "BJ" },
  // Côte d'Ivoire
  { code: "ORANGE_CI", label: "Orange Money", country: "CI" },
  { code: "MTN_CI", label: "MTN MoMo", country: "CI" },
  { code: "MOOV_CI", label: "Moov Money", country: "CI" },
  { code: "WAVE_CI", label: "Wave", country: "CI" },
  // Sénégal
  { code: "ORANGE_SN", label: "Orange Money", country: "SN" },
  { code: "FREE_SN", label: "Free Money", country: "SN" },
  { code: "WAVE_SN", label: "Wave", country: "SN" },
  // Mali
  { code: "ORANGE_ML", label: "Orange Money", country: "ML" },
  { code: "MOOV_ML", label: "Moov Money", country: "ML" },
  // Niger
  { code: "ORANGE_NE", label: "Orange Money", country: "NE" },
  { code: "AIRTEL_NE", label: "Airtel Money", country: "NE" },
];

export function operatorsForCountry(country: CorridorCountry): MmOperator[] {
  return MM_OPERATORS.filter((o) => o.country === country);
}

/** Map profile / ISO country code → corridor MM (fallback TG). */
export function corridorFromCountryCode(code: string | null | undefined): CorridorCountry {
  const c = (code || "").toUpperCase();
  if (CYENOO_CORRIDORS.some((x) => x.code === c)) return c as CorridorCountry;
  // common aliases
  if (c === "IVORY COAST" || c === "COTE D'IVOIRE") return "CI";
  return "TG";
}

export type PaymentSource = "wallet" | "direct_mm";
