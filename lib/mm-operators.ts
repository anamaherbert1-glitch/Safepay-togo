/** Cyenoo — opérateurs Mobile Money nationaux + logos / badges marque. */

export type CorridorCountry = "TG" | "BF" | "BJ" | "CI" | "SN" | "ML" | "NE";

export type MmBrand =
  | "mixx"
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
  short: string;
  /** Chemin public du logo (SVG). */
  logo: string;
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

const LOGO: Record<MmBrand, string> = {
  mixx: "/operators/mixx.svg",
  moov: "/operators/moov.svg",
  mtn: "/operators/mtn.svg",
  orange: "/operators/orange.svg",
  wave: "/operators/wave.svg",
  free: "/operators/free.svg",
  airtel: "/operators/airtel.svg",
};

export const MM_OPERATORS: MmOperator[] = [
  { code: "MIXX_TG", label: "Mixx by Yas", country: "TG", brand: "mixx", short: "MX", logo: LOGO.mixx },
  { code: "TMONEY", label: "T-Money", country: "TG", brand: "mixx", short: "TM", logo: LOGO.mixx },
  { code: "MOOV_TG", label: "Moov Money", country: "TG", brand: "moov", short: "MV", logo: LOGO.moov },
  { code: "ORANGE_BF", label: "Orange Money", country: "BF", brand: "orange", short: "OM", logo: LOGO.orange },
  { code: "MOOV_BF", label: "Moov Money", country: "BF", brand: "moov", short: "MV", logo: LOGO.moov },
  { code: "MTN_BJ", label: "MTN MoMo", country: "BJ", brand: "mtn", short: "MTN", logo: LOGO.mtn },
  { code: "MOOV_BJ", label: "Moov Money", country: "BJ", brand: "moov", short: "MV", logo: LOGO.moov },
  { code: "ORANGE_CI", label: "Orange Money", country: "CI", brand: "orange", short: "OM", logo: LOGO.orange },
  { code: "MTN_CI", label: "MTN MoMo", country: "CI", brand: "mtn", short: "MTN", logo: LOGO.mtn },
  { code: "MOOV_CI", label: "Moov Money", country: "CI", brand: "moov", short: "MV", logo: LOGO.moov },
  { code: "WAVE_CI", label: "Wave", country: "CI", brand: "wave", short: "WV", logo: LOGO.wave },
  { code: "ORANGE_SN", label: "Orange Money", country: "SN", brand: "orange", short: "OM", logo: LOGO.orange },
  { code: "FREE_SN", label: "Free Money", country: "SN", brand: "free", short: "FM", logo: LOGO.free },
  { code: "WAVE_SN", label: "Wave", country: "SN", brand: "wave", short: "WV", logo: LOGO.wave },
  { code: "ORANGE_ML", label: "Orange Money", country: "ML", brand: "orange", short: "OM", logo: LOGO.orange },
  { code: "MOOV_ML", label: "Moov Money", country: "ML", brand: "moov", short: "MV", logo: LOGO.moov },
  { code: "ORANGE_NE", label: "Orange Money", country: "NE", brand: "orange", short: "OM", logo: LOGO.orange },
  { code: "AIRTEL_NE", label: "Airtel Money", country: "NE", brand: "airtel", short: "AM", logo: LOGO.airtel },
];

export const MM_BRAND_STYLE: Record<
  MmBrand,
  { bg: string; fg: string; border: string; accent: string }
> = {
  mixx: { bg: "#E8F0FE", fg: "#1557B0", border: "#90CAF9", accent: "#1A73E8" },
  moov: { bg: "#FFF3E0", fg: "#BF360C", border: "#FFB74D", accent: "#E96805" },
  mtn: { bg: "#FFFDE7", fg: "#1A1A1A", border: "#FFE082", accent: "#FFCC00" },
  orange: { bg: "#FFF3E0", fg: "#E65100", border: "#FFB74D", accent: "#FF7900" },
  wave: { bg: "#E0F7FA", fg: "#006064", border: "#80DEEA", accent: "#1DC8FF" },
  free: { bg: "#FFEBEE", fg: "#B71C1C", border: "#EF9A9A", accent: "#E60000" },
  airtel: { bg: "#FFEBEE", fg: "#B71C1C", border: "#EF9A9A", accent: "#ED1C24" },
};

export function operatorsForCountry(country: CorridorCountry): MmOperator[] {
  const list = MM_OPERATORS.filter((o) => o.country === country);
  if (country === "TG") return list.filter((o) => o.code !== "TMONEY");
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
