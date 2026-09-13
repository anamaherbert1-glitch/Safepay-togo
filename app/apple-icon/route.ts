import { ICON_180_BASE64, ICON_VERSION } from "@/lib/cyenoo-icon-data";

export const runtime = "nodejs";
export const dynamic = "force-static";

export function GET() {
  const buf = Buffer.from(ICON_180_BASE64, "base64");
  return new Response(buf, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, must-revalidate",
      "X-Icon-Version": ICON_VERSION,
    },
  });
}
