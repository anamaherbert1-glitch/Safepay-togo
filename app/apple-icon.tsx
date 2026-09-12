import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
            width: 105,
            height: 38,
            border: "5px solid rgba(255,255,255,0.5)",
            borderRadius: "50%",
            transform: "rotate(-28deg)",
            top: 78,
          }}
        />
        <div style={{ fontSize: 105, fontWeight: 800, color: "#fff", fontFamily: "Arial, sans-serif", lineHeight: 1, marginLeft: -8 }}>
          C
        </div>
        <div style={{ position: "absolute", display: "flex", alignItems: "flex-end", gap: 4, left: 82, top: 72, height: 48 }}>
          <div style={{ width: 9, height: 16, background: "#fff", borderRadius: 2 }} />
          <div style={{ width: 9, height: 24, background: "#fff", borderRadius: 2 }} />
          <div style={{ width: 9, height: 32, background: "#fff", borderRadius: 2 }} />
          <div style={{ width: 9, height: 42, background: "#fff", borderRadius: 2 }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
