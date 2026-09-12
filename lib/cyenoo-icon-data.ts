import { IP0 } from "./cyenoo-icon-ip0";
import { IP1 } from "./cyenoo-icon-ip1";
import { IP2 } from "./cyenoo-icon-ip2";

/** Bump this string whenever the icon art changes — forces phones to reload the icon. */
export const ICON_VERSION = "20260912e";

function padB64(s: string) {
  const m = s.length % 4;
  return m ? s + "=".repeat(4 - m) : s;
}

export const ICON_512_BASE64 = padB64(IP0 + IP1 + IP2);
export const ICON_180_BASE64 = ICON_512_BASE64;
