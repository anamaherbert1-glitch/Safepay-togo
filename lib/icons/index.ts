import { B0 } from "@/lib/icons/b0";
import { B1 } from "@/lib/icons/b1";
import { B2 } from "@/lib/icons/b2";
import { B3 } from "@/lib/icons/b3";

function pad(s: string) {
  const m = s.length % 4;
  return m ? s + "=".repeat(4 - m) : s;
}

export const ICON_VERSION = "20260912exact";
export const ICON_192_BASE64 = pad(B0 + B1 + B2 + B3);
export const ICON_512_BASE64 = ICON_192_BASE64;
