/** Cyenoo — opérateurs Mobile Money nationaux + badges marque. */

export type CorridorCountry = "TG" | "BF" | "BJ" | "CI" | "SN" | "ML" | "NE";

/** Clé de marque pour le style du badge (couleur / initiales). */
export type MmBrand =
  | "tmoney"
  | "moov"
  | "mtn"
  | "orange"
  | "wave"
  | "free"
  | "airtel";

export type MmOperator = {
  code: string;
  label: string;
  country: CorridorCountry;
  brand: MmBrand;
  /** Initiales affichées sur le badge */
  short: string;
};

export const CYENOO_CORRIDORS: { code: CorridorCountry; label: string; dial: string }[] = [
  { code: "TG", label: "Togo", dial: "+228" },
  { code: "BF", label: "Burkina Faso", dial: "+226" },
  { code: "BJ", label: "Bénin", dial: "+229" },
  { code: "CI", label: "Côte d'Ivoire", dial: "+225" },
  { code: "SN", label: "Sénégal", dial: "+221" },
  { code: "ML", label: "Mali", dial: "+223" },
  { code: "NE", label: "Niger", dial: "+227" },
];

export const MM_OPERATORS: MmOperator[] = [
  // Togo — T-Money + Moov Money
  { code: "TMONEY", label: "T-Money", country: "TG", brand: "tmoney", short: "TM" },
  { code: "MOOV_TG", label: "Moov Money", country: "TG", brand: "moov", short: "MV" },
  // Burkina Faso
  { code: "ORANGE_BF", label: "Orange Money", country: "BF", brand: "orange", short: "OM" },
  { code: "MOOV_BF", label: "Moov Money", country: "BF", brand: "moov", short: "MV" },
  // Bénin — MTN MoMo + Moov
  { code: "MTN_BJ", label: "MTN MoMo", country: "BJ", brand: "mtn", short: "MTN" },
  { code: "MOOV_BJ", label: "Moov Money", country: "BJ", brand: "moov", short: "MV" },
  // Côte d'Ivoire
  { code: "ORANGE_CI", label: "Orange Money", country: "CI", brand: "orange", short: "OM" },
  { code: "MTN_CI", label: "MTN MoMo", country: "CI", brand: "mtn", short: "MTN" },
  { code: "MOOV_CI", label: "Moov Money", country: "CI", brand: "moov", short: "MV" },
  { code: "WAVE_CI", label: "Wave", country: "CI", brand: "wave", short: "WV" },
  // Sénégal
  { code: "ORANGE_SN", label: "Orange Money", country: "SN", brand: "orange", short: "OM" },
  { code: "FREE_SN", label: "Free Money", country: "SN", brand: "free", short: "FM" },
  { code: "WAVE_SN", label: "Wave", country: "SN", brand: "wave", short: "WV" },
  // Mali
  { code: "ORANGE_ML", label: "Orange Money", country: "ML", brand: "orange", short: "OM" },
  { code: "MOOV_ML", label: "Moov Money", country: "ML", brand: "moov", short: "MV" },
  // Niger
  { code: "ORANGE_NE", label: "Orange Money", country: "NE", brand: "orange", short: "OM" },
  { code: "AIRTEL_NE", label: "Airtel Money", country: "NE", brand: "airtel", short: "AM" },
];

/** Couleurs badge par marque (fond / texte / bordure). */
export const MM_BRAND_STYLE: Record<
  MmBrand,
  { bg: string; fg: string; border: string; accent: string }
> = {
  tmoney: { bg: "#E8F5E9", fg: "#1B5E20", border: "#81C784", accent: "#2E7D32" },
  moov: { bg: "#E3F2FD", fg: "#0D47A1", border: "#64B5F6", accent: "#1565C0" },
  mtn: { bg: "#FFF8E1", fg: "#F57F17", border: "#FFD54F", accent: "#FFC107" },
  orange: { bg: "#FFF3E0", fg: "#E65100", border: "#FFB74D", accent: "#FF6D00" },
  wave: { bg: "#E8EAF6", fg: "#283593", border: "#7986CB", accent: "#3F51B5" },
  free: { bg: "#FCE4EC", fg: "#880E4F", border: "#F48FB1", accent: "#C2185B" },
  airtel: { bg: "#FFEBEE", fg: "#B71C1C", border: "#EF9A9A", accent: "#D32F2F" },
};

export function operatorsForCountry(country: CorridorCountry): MmOperator[] {
  return MM_OPERATORS.filter((o) => o.country === country);
}

export function getOperatorByCode(code: string): MmOperator | undefined {
  return MM_OPERATORS.find((o) => o.code === code);
}

export function corridorFromCountryCode(code: string | null | undefined): CorridorCountry {
  const c = (code || "").toUpperCase().trim();
  if (CYENOO_CORRIDORS.some((x) => x.code === c)) return c as CorridorCountry;
  if (c.includes("IVOIRE") || c === "IVORY COAST") return "CI";
  if (c.includes("BURKINA")) return "BF";
  if (c.includes("BENIN") || c.includes("BÉNIN")) return "BJ";
  if (c.includes("TOGO")) return "TG";
  if (c.includes("SENEGAL") || c.includes("SÉNÉGAL")) return "SN";
  if (c.includes("MALI")) return "ML";
  if (c.includes("NIGER")) return "NE";
  return "TG";
}

export type PaymentSource = "wallet" | "direct_mm";
