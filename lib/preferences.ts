export type SafePayTheme = "light" | "dark";
export type SafePayLanguage = "fr" | "en";
export type SafePayDisplayCurrency = "XOF" | "EUR" | "USD";

const KEYS = {
  theme: "safepay-theme",
  language: "safepay-language",
  currency: "safepay-display-currency",
  notificationSound: "safepay-notification-sound",
  biometricCredential: "safepay-biometric-credential",
} as const;

function read(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  try { return window.localStorage.getItem(key) || fallback; } catch { return fallback; }
}

function write(key: string, value: string) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key, value); } catch {}
}

export function getTheme(): SafePayTheme {
  return read(KEYS.theme, "light") === "dark" ? "dark" : "light";
}

export function setTheme(theme: SafePayTheme) {
  write(KEYS.theme, theme);
  if (typeof document !== "undefined") document.documentElement.dataset.theme = theme;
}

export function getLanguage(): SafePayLanguage {
  return read(KEYS.language, "fr") === "en" ? "en" : "fr";
}

export function setLanguage(language: SafePayLanguage) {
  write(KEYS.language, language);
  if (typeof document !== "undefined") document.documentElement.lang = language;
  window.dispatchEvent(new CustomEvent("safepay-language-updated", { detail: { language } }));
}

export function getDisplayCurrency(): SafePayDisplayCurrency {
  const value = read(KEYS.currency, "XOF");
  return value === "EUR" || value === "USD" ? value : "XOF";
}

export function setDisplayCurrency(currency: SafePayDisplayCurrency) {
  write(KEYS.currency, currency);
  window.dispatchEvent(new CustomEvent("safepay-currency-updated", { detail: { currency } }));
}

export function getNotificationSoundEnabled() {
  return read(KEYS.notificationSound, "true") !== "false";
}

export function setNotificationSoundEnabled(enabled: boolean) {
  write(KEYS.notificationSound, enabled ? "true" : "false");
}

export function getBiometricCredentialId() {
  return read(KEYS.biometricCredential, "");
}

export function setBiometricCredentialId(id: string) {
  write(KEYS.biometricCredential, id);
}

export function removeBiometricCredentialId() {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(KEYS.biometricCredential); } catch {}
}
