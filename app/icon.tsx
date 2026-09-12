import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** App icon 512x512 — required for PWA install */
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
          background: "#0032C7",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 320,
            height: 118,
            border: "16px solid rgba(255,255,255,0.45)",
            borderRadius: "50%",
            transform: "rotate(-28deg)",
            top: 210,
          }}
        />
        <div
          style={{
            fontSize: 300,
            fontWeight: 800,
            color: "#FFFFFF",
            fontFamily: "Arial, Helvetica, sans-serif",
            lineHeight: 1,
            marginLeft: -24,
            textShadow: "0 10px 24px rgba(0,0,40,0.3)",
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
            left: 230,
            top: 200,
            height: 140,
          }}
        >
          <div style={{ width: 28, height: 48, background: "#fff", borderRadius: 6 }} />
          <div style={{ width: 28, height: 72, background: "#fff", borderRadius: 6 }} />
          <div style={{ width: 28, height: 96, background: "#fff", borderRadius: 6 }} />
          <div style={{ width: 28, height: 124, background: "#fff", borderRadius: 6 }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
