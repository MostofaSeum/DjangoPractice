import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, sl = "en", tl = "bn" } = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ translatedText: "" });
    }

    const trimmed = text.trim();

    // Strategy 1: Google Translate public API
    try {
      const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
        sl
      )}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(trimmed)}`;

      const googleRes = await fetch(googleUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        next: { revalidate: 3600 },
      });

      if (googleRes.ok) {
        const textResp = await googleRes.text();
        if (!textResp.includes("<!DOCTYPE") && !textResp.includes("<html")) {
          const data = JSON.parse(textResp);
          if (Array.isArray(data?.[0])) {
            const translated = data[0]
              .map((segment: any) => (Array.isArray(segment) ? segment[0] || "" : ""))
              .join("");
            if (translated && translated.trim()) {
              return NextResponse.json({ translatedText: translated.trim() });
            }
          }
        }
      }
    } catch {
      // Continue to fallback
    }

    // Strategy 2: High-reliability translation fallback (MyMemory API)
    try {
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        trimmed
      )}&langpair=${encodeURIComponent(sl)}|${encodeURIComponent(tl)}`;

      const mmRes = await fetch(myMemoryUrl, {
        headers: {
          Accept: "application/json",
        },
      });

      if (mmRes.ok) {
        const mmData = await mmRes.json();
        const translated = mmData?.responseData?.translatedText;
        if (translated && typeof translated === "string" && translated.trim()) {
          // Clean up any html entity escapes e.g. &#39;
          const cleaned = translated
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">");

          return NextResponse.json({ translatedText: cleaned.trim() });
        }
      }
    } catch (mmErr: any) {
      console.error("MyMemory fallback error:", mmErr);
    }

    return NextResponse.json({ translatedText: trimmed });
  } catch (error: any) {
    console.error("Translation API Route error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to translate text." },
      { status: 500 }
    );
  }
}
