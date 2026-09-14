/**
 * Translation service communicating with the internal /api/translate route
 */

export interface TranslateOptions {
  from?: string;
  to?: string;
}

/**
 * Translate a single string into target language (default: English to Bangla)
 */
export async function translateText(
  text: string,
  options: TranslateOptions = {}
): Promise<string> {
  const { from = "en", to = "bn" } = options;
  if (!text || !text.trim()) return "";

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text.trim(),
        sl: from,
        tl: to,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.translatedText || "";
  } catch (error) {
    console.error("translateText error:", error);
    return "";
  }
}

/**
 * Translate a comma-separated list of words (e.g. rotating hero words)
 */
export async function translateWordList(
  commaSeparatedWords: string,
  options: TranslateOptions = {}
): Promise<string> {
  if (!commaSeparatedWords || !commaSeparatedWords.trim()) return "";

  const words = commaSeparatedWords
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean);

  if (words.length === 0) return "";

  // Translate as a comma-separated sentence to preserve order and context
  const fullText = words.join(", ");
  const translated = await translateText(fullText, options);

  return translated;
}
