export type CyenooTheme = "system" | "light" | "dark";
export type CyenooLanguage = "fr" | "en";
export type CyenooDisplayCurrency = "XOF" | "EUR" | "USD";

/** Alias de compatibilité Safepay → Cyenoo */
export type SafePayTheme = CyenooTheme;
export type SafePayLanguage = CyenooLanguage;
export type SafePayDisplayCurrency = CyenooDisplayCurrency;

const KEYS = {
  theme: "cyenoo-theme",
  language: "cyenoo-language",
  currency: "cyenoo-display-currency",
  notificationSound: "cyenoo-notification-sound",
  biometricCredential: "cyenoo-biometric-credential",
} as const;

function read(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

export function getTheme(): CyenooTheme {
  const value = read(KEYS.theme, "system");
  return value === "dark" || value === "light" || value === "system" ? value : "system";
}
export function setTheme(theme: CyenooTheme) {
  write(KEYS.theme, theme);
  if (typeof document !== "undefined") {
    if (theme === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent("cyenoo-theme-updated", { detail: { theme } }));
}
export function getLanguage(): CyenooLanguage {
  return read(KEYS.language, "fr") === "en" ? "en" : "fr";
}
export function setLanguage(language: CyenooLanguage) {
  write(KEYS.language, language);
  if (typeof document !== "undefined") document.documentElement.lang = language;
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent("cyenoo-language-updated", { detail: { language } }));
}
export function getDisplayCurrency(): CyenooDisplayCurrency {
  const value = read(KEYS.currency, "XOF");
  return value === "EUR" || value === "USD" ? value : "XOF";
}
export function setDisplayCurrency(currency: CyenooDisplayCurrency) {
  write(KEYS.currency, currency);
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent("cyenoo-currency-updated", { detail: { currency } }));
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
  try {
    window.localStorage.removeItem(KEYS.biometricCredential);
  } catch {}
}
