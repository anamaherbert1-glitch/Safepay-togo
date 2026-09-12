import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon for iOS home screen */
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
          background: "linear-gradient(160deg, #0B1F3A 0%, #123A6B 55%, #1A4F8C 100%)",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
            marginLeft: 8,
          }}
        >
          <div style={{ width: 14, height: 36, background: "#fff", borderRadius: 4 }} />
          <div style={{ width: 14, height: 50, background: "#fff", borderRadius: 4 }} />
          <div style={{ width: 14, height: 64, background: "#fff", borderRadius: 4 }} />
          <div style={{ width: 14, height: 78, background: "#fff", borderRadius: 4 }} />
        </div>
        <div
          style={{
            position: "absolute",
            fontSize: 110,
            fontWeight: 800,
            color: "rgba(255,255,255,0.95)",
            fontFamily: "system-ui, sans-serif",
            left: 22,
            top: 28,
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
