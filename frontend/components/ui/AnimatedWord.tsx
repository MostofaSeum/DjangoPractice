"use client";

import { useState, useEffect } from "react";

const WORDS = ["Vibe", "Style", "Look", "Life", "Space"];

export default function AnimatedWord() {
  const [wordIndex, setWordIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % WORDS.length);
        setFade(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`inline-block text-brand-accent transition-all duration-300 transform ${
        fade ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      {WORDS[wordIndex]}
    </span>
  );
}
