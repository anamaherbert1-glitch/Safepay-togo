import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export type SupportedCountry = {
  code: CountryCode;
  name: string;
  flag: string;
  callingCode: string;
  currency: string;
};

export const SAFE_PAY_COUNTRIES: SupportedCountry[] = [
  { code: "TG", name: "Togo", flag: "🇹🇬", callingCode: "+228", currency: "XOF" },
  { code: "BJ", name: "Bénin", flag: "🇧🇯", callingCode: "+229", currency: "XOF" },
  { code: "CI", name: "Côte d’Ivoire", flag: "🇨🇮", callingCode: "+225", currency: "XOF" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", callingCode: "+226", currency: "XOF" },
  { code: "GH", name: "Ghana", flag: "🇬🇭", callingCode: "+233", currency: "GHS" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", callingCode: "+234", currency: "NGN" },
  { code: "FR", name: "France", flag: "🇫🇷", callingCode: "+33", currency: "EUR" }
];

export function validatePhone(country: CountryCode, localNumber: string) {
  const parsed = parsePhoneNumberFromString(localNumber.trim(), country);
  if (!parsed) return { valid: false as const, e164: "", reason: "Numéro de téléphone invalide." };
  if (!parsed.isValid()) return { valid: false as const, e164: "", reason: "Ce numéro ne respecte pas le plan de numérotation du pays sélectionné." };
  return { valid: true as const, e164: parsed.number, reason: "" };
}

export function onlyPhoneCharacters(value: string) {
  return value.replace(/[^0-9\s().-]/g, "");
}
