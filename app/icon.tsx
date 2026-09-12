import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/**
 * Cyenoo app icon — high quality mark:
 * - Letter C (open on the right)
 * - 3 rising bars seated INSIDE the C opening
 * - Soft orbit ring
 * - Centered on solid brand blue
 */
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
        {/* Orbit ring — behind mark */}
        <div
          style={{
            position: "absolute",
            width: 380,
            height: 140,
            borderRadius: "50%",
            border: "14px solid rgba(255,255,255,0.38)",
            transform: "rotate(-28deg)",
            top: 186,
            left: 66,
          }}
        />

        {/* Letter C as thick arc using nested circles */}
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            border: "52px solid #ffffff",
            borderRightColor: "transparent",
            borderBottomColor: "transparent",
            transform: "rotate(45deg)",
            top: 106,
            left: 78,
            boxShadow: "0 12px 28px rgba(0,0,40,0.22)",
          }}
        />

        {/* 3 rising bars INSIDE the C opening */}
        <div
          style={{
            position: "absolute",
            display: "flex",
            alignItems: "flex-end",
            gap: 16,
            left: 248,
            top: 200,
            height: 160,
          }}
        >
          <div
            style={{
              width: 36,
              height: 70,
              background: "#ffffff",
              borderRadius: 8,
              boxShadow: "0 6px 14px rgba(0,0,40,0.18)",
            }}
          />
          <div
            style={{
              width: 36,
              height: 110,
              background: "#ffffff",
              borderRadius: 8,
              boxShadow: "0 6px 14px rgba(0,0,40,0.18)",
            }}
          />
          <div
            style={{
              width: 36,
              height: 150,
              background: "#ffffff",
              borderRadius: 8,
              boxShadow: "0 6px 14px rgba(0,0,40,0.18)",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
