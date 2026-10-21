"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function ScrollToTopButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <button
      type="button"
      className="btn primary scroll-top"
      aria-label="맨 위로"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      <span aria-hidden>↑</span>
    </button>,
    document.body,
  );
}
