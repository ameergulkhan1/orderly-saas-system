"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AIChatModal } from "./AIChatModal";

export function AIChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group fixed bottom-4 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95"
        aria-label="Open AI Assistant"
      >
        <Sparkles className="h-6 w-6" />
        {/* Notification dot */}
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
          AI
        </span>
      </button>

      <AIChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}