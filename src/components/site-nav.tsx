import Link from "next/link";
import { cn } from "@/lib/utils";
import { LocalModeControls } from "@/components/local-mode";

const links = [
  { href: "/templates", label: "模板中心" },
  { href: "/editor", label: "在线编辑" },
  { href: "/#ai", label: "AI 智写", ai: true },
];

function AiSparkle() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ai-sparkle"
    >
      <path d="M12 3l1.9 5.8L20 10l-5 3.6L16.5 20 12 16.5 7.5 20 9 13.6 4 10l6.1-1.2L12 3z" />
    </svg>
  );
}

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand font-sans text-lg font-bold text-white">
            T
          </span>
          <span className="text-[1.05rem] font-bold tracking-tight">
            Telos<span className="text-brand"> 简历</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) =>
            l.ai ? (
              <Link
                key={l.label}
                href={l.href}
                className="ai-badge group relative isolate inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-brand-line bg-brand-soft/60 px-3 py-1 text-[0.82rem] font-medium text-brand-deep transition-all hover:border-brand hover:bg-brand-soft"
              >
                <span className="ai-glow" />
                <span className="ai-shine" />
                <AiSparkle />
                {l.label}
                <span className="ml-0.5 rounded bg-brand px-1.5 py-px text-[0.58rem] font-bold leading-none text-white">
                  NEW
                </span>
              </Link>
            ) : (
              <Link
                key={l.label}
                href={l.href}
                className={cn(
                  "text-[0.86rem] text-ink-2 transition-colors hover:text-ink",
                )}
              >
                {l.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-3.5">
          <LocalModeControls />
          <Link
            href="/editor"
            className="rounded-[9px] bg-brand px-4 py-2 text-sm font-semibold text-white shadow-[inset_0_-1px_0_var(--color-brand-deep)] transition hover:bg-brand-deep"
          >
            免费制作简历
          </Link>
        </div>
      </div>

      <style>{`
        .ai-glow {
          position: absolute;
          inset: -1px;
          border-radius: 9999px;
          background: linear-gradient(90deg, oklch(0.56 0.195 255), oklch(0.6 0.2 300));
          opacity: 0;
          filter: blur(6px);
          transition: opacity 0.3s;
          z-index: -1;
        }
        .group:hover .ai-glow { opacity: 0.5; }
        .ai-shine {
          position: absolute;
          top: 0;
          left: -60%;
          width: 40%;
          height: 100%;
          background: linear-gradient(100deg, transparent, rgba(255,255,255,0.7), transparent);
          transform: skewX(-20deg);
          animation: ai-sweep 3s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes ai-sweep {
          0%, 60% { left: -60%; }
          80%, 100% { left: 120%; }
        }
        .ai-sparkle {
          animation: sparkle-rotate 4s linear infinite;
        }
        .ai-badge {
          animation: ai-wiggle 2.5s ease-in-out infinite;
        }
        @keyframes ai-wiggle {
          0%, 85%, 100% { transform: rotate(0deg) translateY(0); }
          87% { transform: rotate(-6deg) translateY(-1px); }
          89% { transform: rotate(5deg) translateY(0); }
          91% { transform: rotate(-4deg) translateY(-1px); }
          93% { transform: rotate(3deg) translateY(0); }
          95% { transform: rotate(-2deg); }
        }
        @keyframes sparkle-rotate {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ai-sparkle, .ai-badge, .ai-shine { animation: none; }
          .ai-glow, .ai-shine { display: none; }
        }
      `}</style>
    </header>
  );
}
