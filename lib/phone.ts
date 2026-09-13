import { parsePhoneNumberFromString } from "libphonenumber-js";

export type CyenooCountry = {
  code: string;
  name: string;
  callingCode: string;
  flag: string;
  currency: string;
};

export const CYENOO_COUNTRIES: CyenooCountry[] = [
  { code: "TG", name: "Togo", callingCode: "+228", flag: "🇹🇬", currency: "XOF" },
  { code: "BJ", name: "Bénin", callingCode: "+229", flag: "🇧🇯", currency: "XOF" },
  { code: "CI", name: "Côte d'Ivoire", callingCode: "+225", flag: "🇨🇮", currency: "XOF" },
  { code: "BF", name: "Burkina Faso", callingCode: "+226", flag: "🇧🇫", currency: "XOF" },
  { code: "GH", name: "Ghana", callingCode: "+233", flag: "🇬🇭", currency: "GHS" },
  { code: "NG", name: "Nigeria", callingCode: "+234", flag: "🇳🇬", currency: "NGN" },
  { code: "FR", name: "France", callingCode: "+33", flag: "🇫🇷", currency: "EUR" },
];

export function onlyPhoneCharacters(value: string) {
  return value.replace(/[^\d\s+()-]/g, "");
}

export function validatePhone(countryCode: string, local: string): { valid: true; e164: string } | { valid: false; reason: string } {
  const country = CYENOO_COUNTRIES.find((c) => c.code === countryCode);
  if (!country) return { valid: false, reason: "Pays non supporté." };
  const raw = local.trim();
  if (!raw) return { valid: false, reason: "Entrez votre numéro de téléphone." };
  const parsed = parsePhoneNumberFromString(raw, countryCode as any);
  if (!parsed || !parsed.isValid()) {
    return { valid: false, reason: `Numéro invalide pour ${country.name}.` };
  }
  return { valid: true, e164: parsed.format("E.164") };
}
