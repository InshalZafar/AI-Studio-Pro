import { EqBars } from "@/components/ui/eq-bars";

export function AuthBrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-canvas-raised border-r border-canvas-border p-12">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, transparent, transparent 39px, currentColor 39px, currentColor 40px)",
          color: "#7C6CF6",
        }}
      />
      <div className="relative flex items-center gap-2.5">
        <EqBars className="text-signal" />
        <span className="font-display font-bold text-lg tracking-tight">AI Studio</span>
      </div>

      <div className="relative">
        <p className="font-display text-3xl font-semibold leading-[1.15] mb-4 max-w-md">
          Six channels. One board.
          <br />
          <span className="text-signal">Your own keys.</span>
        </p>
        <p className="text-ink-muted text-sm max-w-sm leading-relaxed">
          General chat, document Q&A, CSV analytics, recipes, and sports — each
          module runs on the provider and model you choose, with your own API key.
        </p>
      </div>

      <div className="relative flex items-center gap-6 text-xs font-mono text-ink-faint">
        <span>01 GENERAL</span>
        <span>02 DOCUMENT</span>
        <span>03 CSV</span>
        <span>04 RECIPE</span>
        <span>05 SPORTS</span>
      </div>
    </div>
  );
}
