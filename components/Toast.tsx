"use client";

import { useEffect } from "react";

export default function Toast({
  message,
  onDone,
}: {
  message: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [message, onDone]);

  return (
    <div className="animate-toast no-print fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-emerald-500 bg-emerald-600 px-4 py-2.5 text-sm font-medium text-[#ffffff] shadow-lg">
      {message}
    </div>
  );
}
