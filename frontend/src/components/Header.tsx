"use client";

import { Cpu } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-oai-border bg-oai-surface/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-oai-green flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-oai-text">
              ClaimIO
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-oai-text-muted font-mono">
            OpenAI Agents SDK • A2A • MCP
          </span>
          <div className="w-2 h-2 rounded-full bg-oai-green animate-pulse" />
        </div>
      </div>
    </header>
  );
}
