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
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 126,
            height: 46,
            borderRadius: "50%",
            border: "4px solid rgba(255,255,255,0.35)",
            transform: "rotate(-26deg)",
            top: 70,
            left: 27,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 22,
            top: 22,
            fontSize: 120,
            fontWeight: 800,
            color: "#fff",
            fontFamily: "Arial Black, Arial, Helvetica, sans-serif",
            lineHeight: 1,
            letterSpacing: "-0.06em",
          }}
        >
          C
        </div>
        <div
          style={{
            position: "absolute",
            left: 88,
            top: 66,
            height: 60,
            display: "flex",
            alignItems: "flex-end",
            gap: 5,
          }}
        >
          <div style={{ width: 11, height: 22, background: "#fff", borderRadius: 2 }} />
          <div style={{ width: 11, height: 36, background: "#fff", borderRadius: 2 }} />
          <div style={{ width: 11, height: 52, background: "#fff", borderRadius: 2 }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
