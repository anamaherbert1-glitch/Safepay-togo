import { ImageResponse } from "next/og";

export const runtime = "edge";

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
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 120,
            height: 44,
            border: "6px solid rgba(255,255,255,0.45)",
            borderRadius: "50%",
            transform: "rotate(-28deg)",
            top: 80,
          }}
        />
        <div
          style={{
            fontSize: 112,
            fontWeight: 800,
            color: "#fff",
            fontFamily: "Arial, Helvetica, sans-serif",
            lineHeight: 1,
            marginLeft: -8,
          }}
        >
          C
        </div>
        <div
          style={{
            position: "absolute",
            display: "flex",
            alignItems: "flex-end",
            gap: 4,
            left: 84,
            top: 74,
            height: 52,
          }}
        >
          <div style={{ width: 10, height: 18, background: "#fff", borderRadius: 2 }} />
          <div style={{ width: 10, height: 26, background: "#fff", borderRadius: 2 }} />
          <div style={{ width: 10, height: 34, background: "#fff", borderRadius: 2 }} />
          <div style={{ width: 10, height: 44, background: "#fff", borderRadius: 2 }} />
        </div>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
