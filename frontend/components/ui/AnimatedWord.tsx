"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/store/LanguageContext";

const WORDS_EN = ["Beauty", "Glow", "Look", "Glam", "Charm"];
const WORDS_BN = ["সৌন্দর্য", "গ্লো", "লুক", "গ্ল্যাম", "রূপ"];

interface AnimatedWordProps {
  customWords?: string[];
}

export default function AnimatedWord({ customWords }: AnimatedWordProps = {}) {
  const { locale } = useLanguage();
  const [wordIndex, setWordIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const defaultWords = locale === "bn" ? WORDS_BN : WORDS_EN;
  const words = customWords && customWords.length > 0 ? customWords : defaultWords;

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % words.length);
        setFade(true);
      }, 500);
    }, 3500);

    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span
      className={`inline-block text-accent transition-all duration-700 ease-in-out transform will-change-transform ${
        fade
          ? "opacity-100 translate-y-0 filter blur-0 scale-100"
          : "opacity-0 -translate-y-3 filter blur-[2px] scale-95"
      }`}
    >
      {words[wordIndex % words.length]}
    </span>
  );
}
