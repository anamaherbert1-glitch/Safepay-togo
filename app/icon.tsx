import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** Cyenoo app icon — logo mark only, no text (matches official 3D logo) */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0052FF",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: 210,
            background: "rgba(255,255,255,0.06)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 340,
            height: 120,
            border: "16px solid rgba(255,255,255,0.45)",
            borderRadius: "50%",
            transform: "rotate(-26deg)",
            top: 210,
          }}
        />
        <div
          style={{
            position: "absolute",
            fontSize: 320,
            fontWeight: 800,
            color: "#FFFFFF",
            fontFamily: "Arial, Helvetica, sans-serif",
            lineHeight: 1,
            letterSpacing: -8,
            left: 78,
            top: 78,
            textShadow: "0 12px 28px rgba(0,0,40,0.35)",
          }}
        >
          C
        </div>
        <div
          style={{
            position: "absolute",
            display: "flex",
            alignItems: "flex-end",
            gap: 12,
            left: 210,
            top: 200,
            height: 140,
          }}
        >
          <div style={{ width: 28, height: 48, background: "#FFFFFF", borderRadius: 6 }} />
          <div style={{ width: 28, height: 72, background: "#FFFFFF", borderRadius: 6 }} />
          <div style={{ width: 28, height: 96, background: "#FFFFFF", borderRadius: 6 }} />
          <div style={{ width: 28, height: 124, background: "#FFFFFF", borderRadius: 6 }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
