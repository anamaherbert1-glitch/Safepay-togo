import { ICON_192_BASE64, ICON_VERSION } from "@/lib/icons";

export const runtime = "nodejs";

export function GET() {
  const buf = Buffer.from(ICON_192_BASE64, "base64");
  return new Response(buf, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, must-revalidate",
      ETag: `\"cyenoo-192-${ICON_VERSION}\"`,
    },
  });
}
