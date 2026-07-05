// Shared marketing footer (landing, waitlist). Server component — the only
// client island inside is the WaitlistForm newsletter signup. Four zones:
// brand + socials, two link columns, newsletter, then a copyright bar.

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { WaitlistForm } from "./WaitlistForm";

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: "Product",
    links: [
      ["How it works", "/#how"],
      ["Features", "/#features"],
      ["Try the demo", "/app"],
    ],
  },
  {
    title: "Get started",
    links: [
      ["Join the waitlist", "/waitlist"],
      ["Log in", "/auth?mode=signin"],
      ["Create an account", "/auth?mode=signup"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-depth/40 px-5 pb-10 pt-16 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-x-16 gap-y-14 lg:grid-cols-[1.5fr_1fr]">
        {/* brand + newsletter */}
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-dusk">
            The teacher you never had — a calm voice that explains your own
            notes until they click.
          </p>
          <div className="mt-5 flex gap-2.5">
            <SocialLink label="X" href="#">
              <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z" />
            </SocialLink>
            <SocialLink label="Instagram" href="#" stroke>
              <rect x="2.2" y="2.2" width="19.6" height="19.6" rx="5.5" />
              <circle cx="12" cy="12" r="4.3" />
              <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" stroke="none" />
            </SocialLink>
            <SocialLink label="YouTube" href="#">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4L15.8 12l-6.2 3.6z" />
            </SocialLink>
            <SocialLink label="LinkedIn" href="#">
              <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.11 20.45H3.56V9h3.55v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0z" />
            </SocialLink>
          </div>

          <h3 className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-faint">
            Stay in the loop
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-dusk">
            One email when Lore opens. Nothing else, ever.
          </p>
          <div className="mt-4 max-w-md">
            <WaitlistForm />
          </div>
        </div>

        {/* link columns */}
        <div className="grid grid-cols-2 gap-8">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-faint">
                {col.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-dusk transition-colors hover:text-cream"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* copyright bar */}
      <div className="mx-auto mt-14 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-faint sm:flex-row">
        <p>© {new Date().getFullYear()} Lore. All rights reserved.</p>
        <p>Your notes. Finally explained.</p>
      </div>
    </footer>
  );
}

function SocialLink({
  label,
  href,
  stroke,
  children,
}: {
  label: string;
  href: string;
  stroke?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full border border-line-m text-dusk transition-colors hover:border-amber/50 hover:text-cream"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={stroke ? "none" : "currentColor"}
        stroke={stroke ? "currentColor" : "none"}
        strokeWidth={stroke ? 1.8 : 0}
        aria-hidden="true"
      >
        {children}
      </svg>
    </a>
  );
}
