import { ICON_512_BASE64, ICON_VERSION } from "@/lib/cyenoo-icon-data";

export const runtime = "nodejs";

export function GET() {
  const buf = Buffer.from(ICON_512_BASE64, "base64");
  return new Response(buf, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, must-revalidate",
      ETag: `\"cyenoo-icon-${ICON_VERSION}\"`,
    },
  });
}
