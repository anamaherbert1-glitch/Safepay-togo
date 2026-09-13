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
        <svg width="140" height="140" viewBox="0 0 360 360" style={{ position: "absolute" }}>
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
            fontSize: "90px",
            fontWeight: 800,
            color: "#ffffff",
            fontFamily: "system-ui, -apple-system, sans-serif",
            lineHeight: 1,
            marginLeft: "-4px",
            textShadow: "0 3px 10px rgba(0,0,0,0.3)",
            letterSpacing: "-3px",
          }}
        >
          C
        </div>
        <div
          style={{
            position: "absolute",
            display: "flex",
            alignItems: "flex-end",
            gap: "3px",
            left: "46%",
            top: "40%",
            height: "32px",
          }}
        >
          <div style={{ width: "6px", height: "12px", background: "#fff", borderRadius: "1px" }} />
          <div style={{ width: "6px", height: "20px", background: "#fff", borderRadius: "1px" }} />
          <div style={{ width: "6px", height: "28px", background: "#fff", borderRadius: "1px" }} />
        </div>
      </div>
    ),
    {
      width: 192,
      height: 192,
      headers: {
        "Cache-Control": "public, max-age=3600, must-revalidate",
        "X-Icon-Version": "20260913clean",
      },
    }
  );
}
