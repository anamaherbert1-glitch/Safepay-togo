import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

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
          position: "relative",
        }}
      >
        {/* Orbit */}
        <div
          style={{
            position: "absolute",
            width: 360,
            height: 130,
            borderRadius: "50%",
            border: "12px solid rgba(255,255,255,0.35)",
            transform: "rotate(-26deg)",
            top: 200,
            left: 76,
          }}
        />

        {/* Letter C */}
        <div
          style={{
            position: "absolute",
            left: 70,
            top: 70,
            width: 320,
            height: 360,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            fontSize: 340,
            fontWeight: 800,
            color: "#ffffff",
            fontFamily: "Arial Black, Arial, Helvetica, sans-serif",
            lineHeight: 1,
            letterSpacing: "-0.06em",
            textShadow: "0 10px 24px rgba(0,0,40,0.25)",
          }}
        >
          C
        </div>

        {/* 3 bars INSIDE the C opening (right side of C) */}
        <div
          style={{
            position: "absolute",
            left: 250,
            top: 190,
            width: 140,
            height: 170,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-start",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 32,
              height: 64,
              background: "#ffffff",
              borderRadius: 7,
              boxShadow: "0 4px 10px rgba(0,0,40,0.2)",
            }}
          />
          <div
            style={{
              width: 32,
              height: 104,
              background: "#ffffff",
              borderRadius: 7,
              boxShadow: "0 4px 10px rgba(0,0,40,0.2)",
            }}
          />
          <div
            style={{
              width: 32,
              height: 148,
              background: "#ffffff",
              borderRadius: 7,
              boxShadow: "0 4px 10px rgba(0,0,40,0.2)",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
