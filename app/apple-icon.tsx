import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — logo mark only */
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
          background: "#0052FF",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 120,
            height: 42,
            border: "6px solid rgba(255,255,255,0.45)",
            borderRadius: "50%",
            transform: "rotate(-26deg)",
            top: 78,
          }}
        />
        <div
          style={{
            position: "absolute",
            fontSize: 118,
            fontWeight: 800,
            color: "#FFFFFF",
            fontFamily: "Arial, Helvetica, sans-serif",
            lineHeight: 1,
            left: 24,
            top: 24,
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
            left: 78,
            top: 72,
            height: 52,
          }}
        >
          <div style={{ width: 10, height: 18, background: "#FFFFFF", borderRadius: 2 }} />
          <div style={{ width: 10, height: 26, background: "#FFFFFF", borderRadius: 2 }} />
          <div style={{ width: 10, height: 34, background: "#FFFFFF", borderRadius: 2 }} />
          <div style={{ width: 10, height: 44, background: "#FFFFFF", borderRadius: 2 }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
