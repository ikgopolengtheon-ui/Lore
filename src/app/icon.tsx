import { ImageResponse } from "next/og";

// Favicon: the Lore waveform mark, amber on void. Font-independent so it
// renders identically at build time with no network fetch.

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

const BARS = [0.45, 0.8, 1, 0.62, 0.35];

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
          gap: 4,
          background: "#0c0b09",
          borderRadius: 14,
        }}
      >
        {BARS.map((h, i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: Math.round(h * 40),
              borderRadius: 3,
              background: "#d4933c",
            }}
          />
        ))}
      </div>
    ),
    size,
  );
}
