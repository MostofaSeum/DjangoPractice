import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/config/siteConfig";

export const dynamic = "force-dynamic";

// Simple in-memory cache for live store catalog & settings (60s TTL)
let cachedContext = "";
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000;

async function getLiveStoreContext(): Promise<string> {
  const now = Date.now();
  if (cachedContext && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedContext;
  }

  const apiBase = getApiBaseUrl();
  let settingsText = "";
  let productsText = "";

  // 1. Fetch site settings & delivery policies
  try {
    const [settingsRes, deliveryRes] = await Promise.all([
      fetch(`${apiBase}/store/site-settings/`, { next: { revalidate: 60 } }),
      fetch(`${apiBase}/store/delivery-settings/`, { next: { revalidate: 60 } }),
    ]);

    if (settingsRes.ok) {
      const s = await settingsRes.json();
      settingsText = `
STORE INFORMATION:
- Store Name: ${s.site_title || "VibeMart"}
- Tagline: ${s.tagline || "MAKE-UP STYLE"}
- Support Phone: ${s.support_phone || "+880 1700-000000"}
- WhatsApp Number: ${s.whatsapp_number || "+880 1700-000000"}
- Support Email: ${s.support_email || "support@vibemart.com"}
- Store Address: ${s.store_address || "Homestead Gulshan Link Tower, Dhaka"}
- Working Hours: ${s.working_hours || "Sat - Thu: 10:00 - 18:00"}
- Currency: ${s.currency_code || "BDT"} (৳)
- Return Policy: Customers can submit return/exchange requests within 7 days from their Profile -> Orders page.
- Payment Methods: Cash on Delivery (COD), bKash, Nagad, and VibeCoin Wallet.

WEBSITE FEATURES & USER HOW-TO GUIDE:
1. GIFT CARDS (/gift-cards):
   - How to Buy: Go to the "Gift Cards" tab from the navbar or header banner, pick a tier (৳500 Bronze, ৳1000 Silver, ৳1500 Gold, ৳2000 Platinum, ৳2500 Diamond, ৳3000 VIP Elite), choose payment (bKash/Nagad), and complete checkout. A 16-digit code is generated and saved to your profile.
   - How to Redeem: Go to /gift-cards page, click the "Redeem Gift Card" button at the top, enter the 16-digit code, and click Submit. The balance is instantly credited to your VibeCoin profile wallet!
   - Gifting: You can share the 16-digit code with friends and family to give them shopping credits across Bangladesh.

2. VIBECOIN LOYALTY SYSTEM (1 VC = ৳1):
   - What is VibeCoin: VibeMart's internal wallet & store credit currency.
   - How to Earn / Top-Up: Currently, users can obtain/earn VibeCoins exclusively by purchasing and redeeming Gift Cards (from /gift-cards). When a 16-digit gift card is redeemed, the full card amount is credited into your VibeCoin balance.
   - How to Use/Spend: At Checkout (/checkout), select "VibeCoin" as your payment method. If you have enough coins to cover the order total, it deducts automatically from your balance with 0 extra fees.
   - Check Balance: View your live VibeCoin balance anytime on your Profile page (/profile).

3. HOW TO ORDER & CHECKOUT (/checkout):
   - Browse products -> Select shade/variant & quantity -> Click "Add to Cart".
   - Open Cart drawer/page -> Click "Proceed to Checkout".
   - Enter your delivery address & contact number.
   - Choose payment method (Cash on Delivery, bKash, Nagad, or VibeCoin).
   - Apply discount coupon code if you have one.
   - Click "Place Order".

4. ORDER TRACKING & HISTORY (/profile or /orders):
   - Logged-in users can check real-time order status (Pending, Processing, Shipped, Delivered) directly from their Profile under "My Orders".
   - You can view full item breakdowns, invoices, and delivery timeline estimates.

5. RETURNS & REFUNDS:
   - Eligible within 7 days of delivery.
   - Go to Profile -> Orders -> Click "Request Return/Exchange" on the delivered order.
   - Refunds can be credited instantly to VibeCoin wallet or refunded back via bKash/Nagad.

6. WISHLIST & FAVORITES (/wishlist):
   - Tap the heart icon on any product card or detail page to save items to your personal Wishlist.
   - Access saved items anytime from the header heart icon.

7. LANGUAGE & DARK MODE:
   - Switch between English and Bengali (বাংলা) anytime from the top-left language toggle in the header.
   - Toggle between sleek Dark Mode and warm Light Mode using the sun/moon icon.
`;
    }

    if (deliveryRes.ok) {
      const d = await deliveryRes.json();
      settingsText += `
DELIVERY CHARGES & TIMELINE:
- Inside Dhaka: ৳${d.inside_dhaka_charge ?? 60} (${d.estimated_days_inside || "1-2 Days"})
- Outside Dhaka: ৳${d.outside_dhaka_charge ?? 130} (${d.estimated_days_outside || "3-5 Days"})
`;
    }
  } catch (err) {
    console.error("Failed to fetch settings context for AI chat:", err);
  }

  // 2. Fetch live product catalog
  try {
    const prodRes = await fetch(`${apiBase}/store/products/?page_size=50`, {
      next: { revalidate: 60 },
    });
    if (prodRes.ok) {
      const data = await prodRes.json();
      const products = Array.isArray(data) ? data : data.results || [];
      const lines = products.map((p: any) => {
        const price = p.discounted_price || p.unit_price;
        const stock = p.total_inventory ?? p.inventory ?? 0;
        const stockStatus = stock > 0 ? `In Stock (${stock} available)` : "Out of Stock";

        // Format variants (shades, sizes, options)
        let variantsInfo = "None";
        if (Array.isArray(p.variants) && p.variants.length > 0) {
          variantsInfo = p.variants
            .map((v: any) => {
              const opt = [v.name, v.size, v.color_name].filter(Boolean).join(" - ");
              const vPrice = v.discounted_price || v.effective_price || v.price_override || price;
              return `${opt || "Variant"} (৳${vPrice}, Stock: ${v.inventory ?? 0})`;
            })
            .join("; ");
        }

        return `- Product #${p.id}: "${p.title}" | Price: ৳${price} (Original: ৳${p.unit_price}) | Status: ${stockStatus} | Variants: [${variantsInfo}] | URL: /products/${p.id}`;
      });

      productsText = `
CURRENT INVENTORY & PRODUCT CATALOG:
${lines.slice(0, 40).join("\n")}
`;
    }
  } catch (err) {
    console.error("Failed to fetch products context for AI chat:", err);
  }

  cachedContext = `${settingsText}\n${productsText}`.trim();
  cacheTimestamp = now;
  return cachedContext;
}

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          reply:
            "I am currently offline as the Gemini AI key is not configured. Please message us on WhatsApp for immediate support!",
        },
        { status: 200 }
      );
    }

    // Load dynamic real-time store context
    const storeContext = await getLiveStoreContext();

    // Construct system instructions
    const systemPrompt = `You are VibeBuddy, the official 24/7 AI shopping assistant and beauty companion for "VibeMart" (a premium cosmetics, fashion, and beauty storefront in Bangladesh).

YOUR GOAL:
Provide warm, courteous, highly accurate, and helpful customer support to shoppers inquiring about products, prices, stock, delivery charges, ordering, policies, and ALL website features (Gift Cards, VibeCoin, Order Tracking, Returns, etc.).

GUIDELINES & CONSTRAINTS:
1. ALWAYS rely STRICTLY on the real-time store information, feature how-to guides, and live product catalog provided below.
2. If a customer asks about a product in the catalog, specify the exact price in ৳ (BDT), whether it is in stock, and its available variants/options (such as sizes, shades, or colors) from the catalog data.
3. If a customer asks about variants (e.g. "does this have sizes or shades?"), check the Variants field for that product:
   - If variants are listed, clearly name each size/shade, its price, and availability.
   - If Variants says "None", accurately explain that it only comes in a single standard size/version.
4. If a product is out of stock, politely inform the customer.
5. If an item is NOT in the catalog, honestly state that we don't currently have it in stock and recommend browsing our Shop or contacting our team on WhatsApp.
6. If a customer asks HOW TO USE ANY WEBSITE FEATURE (e.g. "how to buy or redeem gift cards", "what is VibeCoin", "how to track order", "how to return an item"):
   - Clearly explain the step-by-step process based on the "WEBSITE FEATURES & USER HOW-TO GUIDE" below.
   - Mention the relevant page link (e.g. /gift-cards, /checkout, /profile, /wishlist).
7. If the user writes in Bengali (Bangla), reply in natural, polite Bengali.
8. If the user writes in English, reply in friendly, professional English.
9. If the user writes in Banglish (e.g. "gift card kivabe redeem korbo?", "delivery charge koto?"), reply in fluent Bengali or friendly Banglish.
10. Keep your responses friendly, helpful, and concise (2-4 clear sentences or short numbered bullet points).
11. DO NOT use heavy markdown formatting like double asterisks (**) for bolding or backticks (\`) for words. Keep formatting natural and clean for chat bubbles.
12. For complex order cancellations, payment disputes, or issues requiring a human agent, warmly invite them to click the "Chat on WhatsApp" button in the header.

LIVE STORE CONTEXT:
${storeContext}
`;

    // Map conversation history to Gemini format
    const formattedContents: any[] = [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nUnderstood? Start as the assistant.` }],
      },
      {
        role: "model",
        parts: [
          {
            text: "Understood! I am VibeBuddy, ready to assist VibeMart customers with live inventory, accurate prices, delivery charges, gift cards, VibeCoins, and website navigation.",
          },
        ],
      },
    ];

    // Append previous dialogue (limited to last 6 messages to keep context concise)
    const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
    for (const item of recentHistory) {
      if (item.sender === "user" && item.text) {
        formattedContents.push({
          role: "user",
          parts: [{ text: String(item.text).slice(0, 500) }],
        });
      } else if (item.sender === "bot" && item.text) {
        formattedContents.push({
          role: "model",
          parts: [{ text: String(item.text).slice(0, 500) }],
        });
      }
    }

    // Append latest user message
    formattedContents.push({
      role: "user",
      parts: [{ text: message.trim().slice(0, 500) }],
    });

    const candidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.6-flash",
      "gemini-flash-latest",
    ];

    let candidateText = "";

    for (const modelName of candidateModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: formattedContents,
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 500,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          candidateText =
            data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
          if (candidateText) {
            break;
          }
        } else {
          console.warn(`Gemini model ${modelName} returned status:`, res.status);
        }
      } catch (callErr) {
        console.warn(`Error calling model ${modelName}:`, callErr);
      }
    }

    if (!candidateText) {
      return NextResponse.json({
        reply:
          "Hello! How can I help you today with VibeMart's collections, delivery, or pricing?",
      });
    }

    return NextResponse.json({ reply: candidateText });
  } catch (error: any) {
    console.error("AI Chatbot Route Error:", error);
    return NextResponse.json(
      {
        reply:
          "Our AI assistant is temporarily unavailable. Please reach out to us via WhatsApp for instant assistance!",
      },
      { status: 500 }
    );
  }
}
