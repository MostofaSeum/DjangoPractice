import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, sl = "en", tl = "bn" } = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ translatedText: "" });
    }

    const trimmed = text.trim();
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      sl
    )}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(trimmed)}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Google Translate responded with HTTP ${res.status}`);
    }

    const data = await res.json();

    // Google Translate returns an array of segments: [[["translated", "source", ...], ...], ...]
    let translatedText = "";
    if (Array.isArray(data?.[0])) {
      translatedText = data[0]
        .map((segment: any) => (Array.isArray(segment) ? segment[0] || "" : ""))
        .join("");
    }

    return NextResponse.json({ translatedText });
  } catch (error: any) {
    console.error("Translation API Route error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to translate text." },
      { status: 500 }
    );
  }
}
