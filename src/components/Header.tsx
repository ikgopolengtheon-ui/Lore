"use client";

import { Logo } from "./Logo";
import { Icon } from "./Icon";

interface Props {
  onHome: () => void;
  right?: React.ReactNode;
  showBack?: boolean;
}

export function Header({ onHome, right, showBack }: Props) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-void/80 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={onHome}
            aria-label="Back to dashboard"
            className="grid h-9 w-9 place-items-center rounded-lg text-dusk hover:bg-carbon hover:text-cream"
          >
            <Icon name="back" size={20} />
          </button>
        )}
        <button
          onClick={onHome}
          className="rounded-lg focus-visible:outline focus-visible:outline-3 focus-visible:outline-amber"
          aria-label="Lore home"
        >
          <Logo />
        </button>
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </header>
  );
}
