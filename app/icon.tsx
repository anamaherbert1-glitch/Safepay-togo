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
        {/* Orbit ring */}
        <div
          style={{
            position: "absolute",
            width: 340,
            height: 120,
            borderRadius: "50%",
            border: "11px solid rgba(255,255,255,0.35)",
            transform: "rotate(-26deg)",
            top: 210,
            left: 86,
          }}
        />

        {/* Letter C — centered */}
        <div
          style={{
            position: "absolute",
            left: 88,
            top: 78,
            fontSize: 320,
            fontWeight: 800,
            color: "#ffffff",
            fontFamily: "Arial Black, Arial, Helvetica, sans-serif",
            lineHeight: 1,
            letterSpacing: "-0.08em",
            textShadow: "0 10px 24px rgba(0,0,40,0.25)",
          }}
        >
          C
        </div>

        {/* 3 signal bars nested INSIDE the open mouth of the C */}
        <div
          style={{
            position: "absolute",
            left: 218,
            top: 200,
            height: 150,
            display: "flex",
            alignItems: "flex-end",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 28,
              height: 56,
              background: "#ffffff",
              borderRadius: 6,
              boxShadow: "0 4px 10px rgba(0,0,40,0.2)",
            }}
          />
          <div
            style={{
              width: 28,
              height: 92,
              background: "#ffffff",
              borderRadius: 6,
              boxShadow: "0 4px 10px rgba(0,0,40,0.2)",
            }}
          />
          <div
            style={{
              width: 28,
              height: 130,
              background: "#ffffff",
              borderRadius: 6,
              boxShadow: "0 4px 10px rgba(0,0,40,0.2)",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
