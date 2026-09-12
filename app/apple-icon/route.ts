import { ICON_180_BASE64 } from "@/lib/cyenoo-icon-data";

export const runtime = "nodejs";

export function GET() {
  const buf = Buffer.from(ICON_180_BASE64, "base64");
  return new Response(buf, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
