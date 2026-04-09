"use client";

export function AuroraBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div className="absolute -left-1/4 top-[-20%] h-[480px] w-[480px] animate-pulse rounded-full bg-purple-500/25 blur-[120px]" />
      <div
        className="absolute left-1/3 top-1/4 h-[420px] w-[420px] animate-pulse rounded-full bg-blue-600/20 blur-[110px]"
        style={{ animationDelay: "1.2s" }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] h-[520px] w-[520px] animate-pulse rounded-full bg-cyan-400/15 blur-[130px]"
        style={{ animationDelay: "0.6s" }}
      />
    </div>
  );
}
