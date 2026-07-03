// Lore logo mark + wordmark (PRD §8.3 / brand identity).
// Mark: three-quarter open arc, filled amber centre dot, three radiating
// ticks — listening, signal, illumination.

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18 6C18 6 10 10 10 18C10 22.4 13.6 26 18 26C22.4 26 26 22.4 26 18"
        stroke="var(--amber)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="18" cy="18" r="3.5" fill="var(--amber)" fillOpacity="0.9" />
      <path
        d="M22 10L24 8M26 13L29 12M26 18H29"
        stroke="var(--amber)"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

export function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <span
      style={{ fontSize: size }}
      className="font-serif leading-none tracking-tight text-cream select-none"
    >
      L<span className="italic text-amber">or</span>e
    </span>
  );
}

export function Logo({
  markSize = 34,
  wordSize = 26,
}: {
  markSize?: number;
  wordSize?: number;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-[11px] border border-line-m bg-carbon">
        <LogoMark size={markSize - 12} />
      </span>
      <Wordmark size={wordSize} />
    </div>
  );
}
