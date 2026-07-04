import { ImageResponse } from "next/og";

// Social share card (OG + Twitter). Generated at build time; matches the
// Void/Amber brand system. Fraunces is fetched from Google Fonts at build —
// if that fetch fails we fall back to the default font rather than fail the
// build.

export const alt = "Lore — Your notes. Finally explained.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFraunces(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Fraunces:ital@1&display=swap",
      // A plain UA makes Google Fonts serve TTF, which satori can read.
      { headers: { "User-Agent": "curl/8.0" } },
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

// Deterministic waveform, same shape family as the landing hero.
const BARS = Array.from({ length: 32 }, (_, i) => {
  const base = 0.35 + 0.55 * Math.abs(Math.sin(i * 1.7));
  return 0.25 + base * 0.75;
});

export default async function OgImage() {
  const fraunces = await loadFraunces();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(212,147,60,0.22) 0%, #0c0b09 60%), #0c0b09",
          color: "#f4eee2",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            height: 72,
            marginBottom: 48,
          }}
        >
          {BARS.map((h, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: Math.round(h * 64),
                borderRadius: 3,
                background: "#d4933c",
                opacity: 0.3 + h * 0.6,
              }}
            />
          ))}
        </div>
        <div
          style={{
            fontSize: 96,
            fontStyle: fraunces ? "italic" : "normal",
            fontFamily: fraunces ? "Fraunces" : undefined,
            letterSpacing: "-0.02em",
          }}
        >
          Lore
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 34,
            color: "#8c7d68",
          }}
        >
          Your notes. Finally explained.
        </div>
        <div
          style={{
            marginTop: 44,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 22,
            color: "#d4933c",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              background: "#d4933c",
            }}
          />
          Voice-first AI study companion
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fraunces
        ? [{ name: "Fraunces", data: fraunces, style: "italic" as const }]
        : undefined,
    },
  );
}
