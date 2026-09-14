import { ImageResponse } from "next/og";

export const runtime = "edge";
export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0032C7",
          borderRadius: "22%",
          position: "relative",
        }}
      >
        <svg width="360" height="360" viewBox="0 0 360 360" style={{ position: "absolute" }}>
          <ellipse
            cx="180"
            cy="180"
            rx="150"
            ry="62"
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="16"
            transform="rotate(-28 180 180)"
          />
        </svg>
        <div
          style={{
            fontSize: "240px",
            fontWeight: 800,
            color: "#ffffff",
            fontFamily: "system-ui, -apple-system, sans-serif",
            lineHeight: 1,
            marginLeft: "-12px",
            textShadow: "0 6px 20px rgba(0,0,0,0.3)",
            letterSpacing: "-8px",
          }}
        >
          C
        </div>
        <div
          style={{
            position: "absolute",
            display: "flex",
            alignItems: "flex-end",
            gap: "9px",
            left: "46%",
            top: "40%",
            height: "85px",
          }}
        >
          <div style={{ width: "16px", height: "32px", background: "#fff", borderRadius: "3px" }} />
          <div style={{ width: "16px", height: "52px", background: "#fff", borderRadius: "3px" }} />
          <div style={{ width: "16px", height: "72px", background: "#fff", borderRadius: "3px" }} />
        </div>
      </div>
    ),
    {
      width: 512,
      height: 512,
      headers: {
        "Cache-Control": "public, max-age=3600, must-revalidate",
        "X-Icon-Version": "20260914clean",
      },
    }
  );
}
