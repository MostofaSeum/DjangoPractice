"use client";

import { useState } from "react";
import { translateText, translateWordList } from "@/services/translationService";

interface AutoTranslateButtonProps {
  sourceText: string;
  onTranslated: (translatedText: string) => void;
  isWordList?: boolean;
  className?: string;
  buttonLabel?: string;
}

export default function AutoTranslateButton({
  sourceText,
  onTranslated,
  isWordList = false,
  className = "",
  buttonLabel,
}: AutoTranslateButtonProps) {
  const [translating, setTranslating] = useState(false);

  const handleTranslate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const textToTranslate = sourceText?.trim();
    if (!textToTranslate) return;

    setTranslating(true);
    try {
      const translated = isWordList
        ? await translateWordList(textToTranslate)
        : await translateText(textToTranslate);

      if (translated) {
        onTranslated(translated);
      }
    } catch (err) {
      console.error("AutoTranslateButton failed:", err);
    } finally {
      setTranslating(false);
    }
  };

  const isDisabled = !sourceText || !sourceText.trim() || translating;

  return (
    <button
      type="button"
      onClick={handleTranslate}
      disabled={isDisabled}
      title={
        !sourceText?.trim()
          ? "Type English text first to translate"
          : "Auto-translate English to Bangla with AI"
      }
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-tight transition-all duration-200 cursor-pointer select-none ${
        isDisabled
          ? "opacity-35 cursor-not-allowed text-foreground/50 bg-foreground/5"
          : "text-accent bg-accent/10 hover:bg-accent hover:text-white dark:hover:text-black shadow-xs active:scale-95"
      } ${className}`}
    >
      {translating ? (
        <>
          <svg
            className="animate-spin -ml-0.5 h-2.5 w-2.5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Translating...</span>
        </>
      ) : (
        <>
          <span className="text-[11px] leading-none">✨</span>
          <span>{buttonLabel || "Auto-Translate"}</span>
        </>
      )}
    </button>
  );
}
