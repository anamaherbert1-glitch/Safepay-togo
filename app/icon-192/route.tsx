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
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 142,
            height: 52,
            borderRadius: "50%",
            border: "5px solid rgba(255,255,255,0.38)",
            transform: "rotate(-28deg)",
            top: 70,
            left: 25,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 114,
            height: 114,
            borderRadius: "50%",
            border: "20px solid #ffffff",
            borderRightColor: "transparent",
            borderBottomColor: "transparent",
            transform: "rotate(45deg)",
            top: 39,
            left: 29,
          }}
        />
        <div
          style={{
            position: "absolute",
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
            left: 92,
            top: 74,
            height: 60,
          }}
        >
          <div style={{ width: 13, height: 26, background: "#fff", borderRadius: 3 }} />
          <div style={{ width: 13, height: 40, background: "#fff", borderRadius: 3 }} />
          <div style={{ width: 13, height: 56, background: "#fff", borderRadius: 3 }} />
        </div>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
