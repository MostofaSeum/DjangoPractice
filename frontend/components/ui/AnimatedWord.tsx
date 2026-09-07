"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/store/LanguageContext";

const WORDS_EN = ["Beauty", "Glow", "Look", "Glam", "Charm"];
const WORDS_BN = ["সৌন্দর্য", "গ্লো", "লুক", "গ্ল্যাম", "রূপ"];

export default function AnimatedWord() {
  const { locale } = useLanguage();
  const [wordIndex, setWordIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const words = locale === "bn" ? WORDS_BN : WORDS_EN;

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % words.length);
        setFade(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span
      className={`inline-block text-accent transition-all duration-300 transform ${
        fade ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      {words[wordIndex % words.length]}
    </span>
  );
}
