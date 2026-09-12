import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** Temporary generated icon — replace with public/cyenoo-icon-512.png for pixel-exact logo */
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
            width: 300,
            height: 110,
            border: "14px solid rgba(255,255,255,0.5)",
            borderRadius: "50%",
            transform: "rotate(-28deg)",
            top: 220,
          }}
        />
        <div
          style={{
            fontSize: 300,
            fontWeight: 800,
            color: "#fff",
            fontFamily: "Arial, sans-serif",
            lineHeight: 1,
            marginLeft: -20,
          }}
        >
          C
        </div>
        <div
          style={{
            position: "absolute",
            display: "flex",
            alignItems: "flex-end",
            gap: 10,
            left: 230,
            top: 210,
            height: 130,
          }}
        >
          <div style={{ width: 24, height: 44, background: "#fff", borderRadius: 5 }} />
          <div style={{ width: 24, height: 66, background: "#fff", borderRadius: 5 }} />
          <div style={{ width: 24, height: 88, background: "#fff", borderRadius: 5 }} />
          <div style={{ width: 24, height: 114, background: "#fff", borderRadius: 5 }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
