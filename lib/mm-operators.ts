/** Cyenoo — opérateurs Mobile Money nationaux + badges marque (couleurs officielles). */

export type CorridorCountry = "TG" | "BF" | "BJ" | "CI" | "SN" | "ML" | "NE";

/** Clé de marque pour le style du badge. */
export type MmBrand =
  | "mixx" // Mixx by Yas (ex T-Money Togo)
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
  // Togo — Mixx by Yas (ex T-Money) + Moov Money
  { code: "MIXX_TG", label: "Mixx by Yas", country: "TG", brand: "mixx", short: "MX" },
  { code: "TMONEY", label: "T-Money", country: "TG", brand: "mixx", short: "TM" },
  { code: "MOOV_TG", label: "Moov Money", country: "TG", brand: "moov", short: "MV" },
  // Burkina Faso
  { code: "ORANGE_BF", label: "Orange Money", country: "BF", brand: "orange", short: "OM" },
  { code: "MOOV_BF", label: "Moov Money", country: "BF", brand: "moov", short: "MV" },
  // Bénin
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

/**
 * Couleurs badge alignées sur les chartes marques (sources publiques Brandfetch / guides).
 * - Mixx/Yas: bleu Yas #1A73E8 + jaune
 * - Moov Africa: orange #E96805 + bleu
 * - Orange Money: #FF7900
 * - MTN MoMo: jaune #FFCC00
 * - Wave: cyan #1DC8FF
 * - Free: rouge Free
 * - Airtel Money: rouge Airtel
 */
export const MM_BRAND_STYLE: Record<
  MmBrand,
  { bg: string; fg: string; border: string; accent: string }
> = {
  mixx: {
    bg: "#E8F0FE",
    fg: "#1557B0",
    border: "#90CAF9",
    accent: "#1A73E8", // Yas / Mixx by Yas
  },
  moov: {
    bg: "#FFF3E0",
    fg: "#BF360C",
    border: "#FFB74D",
    accent: "#E96805", // Moov Africa orange
  },
  mtn: {
    bg: "#FFFDE7",
    fg: "#1A1A1A",
    border: "#FFE082",
    accent: "#FFCC00", // MTN Y'ello
  },
  orange: {
    bg: "#FFF3E0",
    fg: "#E65100",
    border: "#FFB74D",
    accent: "#FF7900", // Orange Money
  },
  wave: {
    bg: "#E0F7FA",
    fg: "#006064",
    border: "#80DEEA",
    accent: "#1DC8FF", // Wave mobile money
  },
  free: {
    bg: "#FFEBEE",
    fg: "#B71C1C",
    border: "#EF9A9A",
    accent: "#E60000", // Free
  },
  airtel: {
    bg: "#FFEBEE",
    fg: "#B71C1C",
    border: "#EF9A9A",
    accent: "#ED1C24", // Airtel Money
  },
};

export function operatorsForCountry(country: CorridorCountry): MmOperator[] {
  // Togo: afficher Mixx + Moov (T-Money gardé en alias technique mais masqué si Mixx présent)
  const list = MM_OPERATORS.filter((o) => o.country === country);
  if (country === "TG") {
    return list.filter((o) => o.code !== "TMONEY"); // UI: Mixx by Yas + Moov
  }
  return list;
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
