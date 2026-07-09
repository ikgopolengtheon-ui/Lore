// FAQ accordion (ref: stacked rounded rows, chevron toggle). Native
// <details>/<summary> — accessible and zero client JS.

import { Icon } from "@/components/Icon";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Where do Lore's answers come from?",
    a: "Only from the material you upload. Lore is grounded in your own notes, slides, and textbooks — never the open web — so it can't contradict your course. If something isn't in your document, Lore says so instead of guessing.",
  },
  {
    q: "What can I upload?",
    a: "PDFs, Word documents, PowerPoint slides, plain text files, and photos of handwritten or printed notes. Lore reads them all — including your handwriting — and indexes everything for the session.",
  },
  {
    q: "Do I have to type my questions?",
    a: "No — Lore is voice-first. Hold the mic, ask out loud like you would a tutor, and Lore answers in a calm spoken voice. For maths and science it also writes the steps out on a whiteboard while it explains.",
  },
  {
    q: "Can I try Lore before paying?",
    a: "Yes — create a free account and you get a sample exchange to feel how it works. Studying needs an account and a plan, though: there's no anonymous use and no unlimited free tier, which is what keeps the voice quality high.",
  },
  {
    q: "What happens when my premium voice hours run out?",
    a: "Nothing dramatic. Lore switches to the standard voice and keeps teaching — no hard cut-offs mid-session. If you're deep in exam prep and want the premium voice back, you can top up without changing plans.",
  },
  {
    q: "How do quizzes work?",
    a: "Pick any chat and Lore turns its material into active-recall practice: it asks, you answer aloud, and it tells you what you nailed and what needs another pass — with a score for the session.",
  },
  {
    q: "Is my study material private?",
    a: "Your documents stay yours. They're used only to answer your questions, they're never used to train models, and deleting a chat deletes its indexed content too.",
  },
  {
    q: "What do I need to run it?",
    a: "Just a modern browser and a microphone — Lore is a web app, nothing to install. Sign in and your chats, documents, and whiteboards follow you to any device.",
  },
];

export function Faq() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      {FAQS.map((item) => (
        <details key={item.q} className="lore-card group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 text-left [&::-webkit-details-marker]:hidden">
            <span className="font-serif text-lg text-cream">{item.q}</span>
            <span className="shrink-0 text-dusk transition-transform duration-300 group-open:rotate-180">
              <Icon name="chevron" size={18} />
            </span>
          </summary>
          <p className="px-6 pb-6 text-sm leading-relaxed text-dusk">
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}
