"use client";

export default function AuroraBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute w-[600px] h-[600px] bg-purple-500 opacity-30 blur-[120px] rounded-full top-[-200px] left-[-200px] animate-pulse" />
      <div className="absolute w-[500px] h-[500px] bg-blue-500 opacity-30 blur-[120px] rounded-full bottom-[-200px] right-[-200px] animate-pulse" />
      <div className="absolute w-[400px] h-[400px] bg-cyan-400 opacity-20 blur-[120px] rounded-full top-[40%] left-[30%]" />
    </div>
  );
}