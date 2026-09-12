import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** Cyenoo app icon — shown on phone home screen when installed */
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
          background: "linear-gradient(160deg, #0B1F3A 0%, #123A6B 55%, #1A4F8C 100%)",
          borderRadius: 96,
        }}
      >
        {/* Orbit ring */}
        <div
          style={{
            position: "absolute",
            width: 380,
            height: 140,
            border: "14px solid rgba(255,255,255,0.28)",
            borderRadius: "50%",
            transform: "rotate(-28deg)",
            top: 200,
          }}
        />
        {/* C arc approximation with bars */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 14,
            marginLeft: 20,
          }}
        >
          <div style={{ width: 36, height: 90, background: "#fff", borderRadius: 10 }} />
          <div style={{ width: 36, height: 130, background: "#fff", borderRadius: 10 }} />
          <div style={{ width: 36, height: 170, background: "#fff", borderRadius: 10 }} />
          <div style={{ width: 36, height: 210, background: "#fff", borderRadius: 10 }} />
        </div>
        {/* Simple C letter overlay feel */}
        <div
          style={{
            position: "absolute",
            fontSize: 280,
            fontWeight: 800,
            color: "rgba(255,255,255,0.95)",
            fontFamily: "system-ui, sans-serif",
            left: 70,
            top: 90,
            lineHeight: 1,
          }}
        >
          C
        </div>
      </div>
    ),
    { ...size }
  );
}
