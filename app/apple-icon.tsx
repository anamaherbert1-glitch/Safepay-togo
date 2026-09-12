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
            width: 132,
            height: 48,
            borderRadius: "50%",
            border: "5px solid rgba(255,255,255,0.38)",
            transform: "rotate(-28deg)",
            top: 66,
            left: 24,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 108,
            height: 108,
            borderRadius: "50%",
            border: "18px solid #ffffff",
            borderRightColor: "transparent",
            borderBottomColor: "transparent",
            transform: "rotate(45deg)",
            top: 36,
            left: 28,
          }}
        />
        <div
          style={{
            position: "absolute",
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
            left: 88,
            top: 70,
            height: 56,
          }}
        >
          <div style={{ width: 12, height: 24, background: "#fff", borderRadius: 3 }} />
          <div style={{ width: 12, height: 38, background: "#fff", borderRadius: 3 }} />
          <div style={{ width: 12, height: 52, background: "#fff", borderRadius: 3 }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
