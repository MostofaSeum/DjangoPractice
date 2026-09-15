import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, sl = "en", tl = "bn" } = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ translatedText: "" });
    }

    const trimmed = text.trim();
    const apiKey =
      process.env.GEMINI_API_KEY ||
      "";

    // Strategy 1: Google Gemini AI (State of the Art Translation)
    if (apiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
        const prompt = `Translate the following English text into natural, fluent, and elegant Bengali (Bangla) suitable for an e-commerce website.
Return ONLY the direct Bengali translation without quotation marks, bullet points, explanations, or notes.

Text: "${trimmed}"`;

        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.1,
            },
          }),
        });

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (translated && typeof translated === "string" && translated.trim()) {
            const cleaned = translated
              .trim()
              .replace(/^["'“”‘]+|["'“”’]+$/g, "")
              .trim();

            if (cleaned) {
              return NextResponse.json({ translatedText: cleaned });
            }
          }
        }
      } catch (geminiErr) {
        console.error("Gemini AI Translation error:", geminiErr);
      }
    }

    // Strategy 2: High-reliability translation fallback (MyMemory API)
    try {
      const memoryTl = tl === "bn" ? "bn-BD" : tl;
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        trimmed
      )}&langpair=${encodeURIComponent(sl)}|${encodeURIComponent(memoryTl)}`;

      const mmRes = await fetch(myMemoryUrl, {
        headers: {
          Accept: "application/json",
        },
      });

      if (mmRes.ok) {
        const mmData = await mmRes.json();
        const translated = mmData?.responseData?.translatedText;
        if (translated && typeof translated === "string" && translated.trim()) {
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
