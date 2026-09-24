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

  // 2. Fetch live product catalog & active coupons
  let couponsText = "";
  try {
    const [prodRes, collRes, couponRes] = await Promise.all([
      fetch(`${apiBase}/store/products/?page_size=100`, { next: { revalidate: 60 } }),
      fetch(`${apiBase}/store/collections/`, { next: { revalidate: 60 } }),
      fetch(`${apiBase}/store/coupons/`, { next: { revalidate: 60 } }),
    ]);

    const collectionMap: Record<number, string> = {};
    if (collRes.ok) {
      const collData = await collRes.json();
      const collArray = Array.isArray(collData) ? collData : collData.results || [];
      collArray.forEach((c: any) => {
        if (c.id && c.title) collectionMap[c.id] = c.title;
      });
    }

    if (couponRes.ok) {
      const couponData = await couponRes.json();
      const rawCoupons = Array.isArray(couponData) ? couponData : couponData.results || [];
      const nowDate = new Date();

      const activeCoupons = rawCoupons.filter((cp: any) => {
        if (!cp.is_active) return false;
        if (cp.valid_from && new Date(cp.valid_from) > nowDate) return false;
        if (cp.valid_to && new Date(cp.valid_to) < nowDate) return false;
        return true;
      });

      if (activeCoupons.length > 0) {
        const cLines = activeCoupons.map((cp: any) => {
          let appliesTo = "Entire store / all eligible products";
          if (cp.target_type === "collection" && cp.collection_title) {
            appliesTo = `Specific Collection: "${cp.collection_title}"`;
          } else if (cp.target_type === "product" && Array.isArray(cp.products_details) && cp.products_details.length > 0) {
            const pTitles = cp.products_details.map((pd: any) => pd.title).join(", ");
            appliesTo = `Specific Products: ${pTitles}`;
          }

          const expiryStr = cp.valid_to
            ? new Date(cp.valid_to).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "No expiry";

          return `• CODE: "${cp.code}" | Discount: ${cp.discount_percent}% OFF | Applies To: ${appliesTo} | Valid Until: ${expiryStr}`;
        });

        couponsText = `
ACTIVE STORE COUPONS & PROMO CODES:
${cLines.join("\n")}
`;
      } else {
        couponsText = `
ACTIVE STORE COUPONS & PROMO CODES:
None currently available.
`;
      }
    }

    if (prodRes.ok) {
      const data = await prodRes.json();
      const products = Array.isArray(data) ? data : data.results || [];
      const lines = products.map((p: any) => {
        const price = p.discounted_price || p.unit_price;
        const stock = p.total_inventory ?? p.inventory ?? 0;
        const stockStatus = stock > 0 ? `In Stock (${stock} available)` : "Out of Stock";
        const category = collectionMap[p.collection] || "General Beauty & Cosmetics";

        // Clean description snippet for skin type & benefits matching
        const rawDesc = (p.short_description || p.description || "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        const descSnippet = rawDesc ? rawDesc.slice(0, 180) : "Authentic premium cosmetics product.";

        // Format variants (shades, sizes, options)
        let variantsInfo = "None";
        if (Array.isArray(p.variants) && p.variants.length > 0) {
          variantsInfo = p.variants
            .map((v: any) => {
              const opt = [v.name, v.size, v.color_name].filter(Boolean).join(" - ");
              const vPrice = v.discounted_price || v.effective_price || v.price_override || price;
              return `[Variant ID: ${v.id}] ${opt || "Option"} (৳${vPrice}, Stock: ${v.inventory ?? 0})`;
            })
            .join("; ");
        }

        return `- Product ID: ${p.id} | Title: "${p.title}" | Category: ${category} | Price: ৳${price} (Original: ৳${p.unit_price}) | Status: ${stockStatus} | Variants: [${variantsInfo}] | Highlights: "${descSnippet}" | URL: /products/${p.id}`;
      });

      productsText = `
CURRENT INVENTORY & PRODUCT CATALOG (LIVE STORE PRODUCTS):
${lines.join("\n")}
`;
    }
  } catch (err) {
    console.error("Failed to fetch products context for AI chat:", err);
  }

  cachedContext = `${settingsText}\n${couponsText}\n${productsText}`.trim();
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

    // Check for logged-in user Authorization token
    let userContext = `
USER STATUS: Guest / Not Logged In.
(If the user asks about their orders, balance, or profile, gently invite them to log in to VibeMart first).
`;
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("JWT ")) {
      const apiBase = getApiBaseUrl();
      try {
        const [userRes, custRes, ordersRes] = await Promise.all([
          fetch(`${apiBase}/auth/users/me/`, { headers: { Authorization: authHeader } }),
          fetch(`${apiBase}/store/customers/me/`, { headers: { Authorization: authHeader } }),
          fetch(`${apiBase}/store/orders/`, { headers: { Authorization: authHeader } }),
        ]);

        let userName = "Valued Customer";
        let email = "";
        let phone = "Not set";
        let vibeCoin = 0;
        let ordersList: string[] = [];

        if (userRes.ok) {
          const u = await userRes.json();
          userName = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || "Customer";
          email = u.email || "";
        }

        if (custRes.ok) {
          const c = await custRes.json();
          vibeCoin = c.vibe_coin ?? 0;
          if (c.phone) phone = c.phone;
        }

        if (ordersRes.ok) {
          const ord = await ordersRes.json();
          const ordersArray = Array.isArray(ord) ? ord : ord.results || [];
          ordersList = ordersArray.slice(0, 5).map((o: any) => {
            const itemsSummary = o.items
              ? o.items
                  .map((it: any) => `${it.product?.title || "Item"} x${it.quantity}`)
                  .join(", ")
              : "Items";
            const tracking = o.tracking_status_display || o.tracking_status || "Processing";
            const date = o.placed_at ? new Date(o.placed_at).toLocaleDateString() : "";
            return `- Order #${o.id}: Status "${tracking}" | Items: [${itemsSummary}] | Date: ${date} | Courier: ${o.courier_partner_details?.name || "In-House"}`;
          });
        }

        userContext = `
CURRENT LOGGED-IN CUSTOMER PROFILE (ACTIVE SESSION):
- Customer Name: ${userName}
- Email: ${email}
- Phone: ${phone}
- VibeCoin Wallet Balance: ${vibeCoin} VC (৳${vibeCoin})
- Recent Order History (${ordersList.length} recent orders):
${ordersList.length > 0 ? ordersList.join("\n") : "No previous orders placed yet."}
`;
      } catch (err) {
        console.error("Failed to fetch customer profile context for AI chat:", err);
      }
    }

    // Construct system instructions
    const systemPrompt = `You are VibeBuddy, the official 24/7 AI shopping assistant and expert beauty & skincare consultant for "VibeMart" (Bangladesh's premier cosmetics, skincare, and fashion storefront).

YOUR MISSION:
Deliver exceptional, expert, and highly personalized shopping and beauty consultations. You do not just answer simple questions—you act like a knowledgeable, warm, and attentive beauty specialist who helps customers find the exact products that match their unique skin, style, age, and beauty goals.

INTELLIGENT BEAUTY & PRODUCT CONSULTATION PROTOCOL:
When a customer asks for a recommendation, suggestion, or advice (e.g. "suggest me a product", "what cream should I use?", "suggest lipstick", "help me choose skincare"):
1. INTAKE & DIAGNOSTIC QUESTIONS:
   - Do NOT just spit out random products without understanding their needs.
   - Warmly ask 3-4 concise, targeted questions to tailor the recommendation perfectly:
     • Age & Gender (or who the product is for).
     • Skin Type / Concerns (e.g., Oily, Dry, Combination, Sensitive, Acne-prone, Pigmentation, Aging, Dullness).
     • Desired Category & Finish (e.g., Daily Moisturizer, Matte Lipstick, Sunscreen, Anti-aging Serum, Full Coverage Foundation).
     • Budget or Preference (if applicable).
   - Keep the tone encouraging, warm, and professional (in English or Bengali depending on customer language).

2. MATCHING & TAILORED RECOMMENDATIONS:
   - Once the customer provides their details (or if they already provided enough specific details in their query):
     • Thoroughly analyze the "CURRENT INVENTORY & PRODUCT CATALOG (LIVE STORE PRODUCTS)" below.
     • Check the category, title, variants, and product highlights (benefits, ingredients, formula).
     • Recommend the 1 to 3 best-fitted products from our catalog that directly address their skin concern or beauty preference.
     • Explain WHY this specific product suits their age, skin type, or concern. Mention the exact price in ৳ (BDT) and whether it is "In Stock" or "Out of Stock" (DO NOT mention the specific inventory/stock count unless the user explicitly asks how many units are available or in stock).
     • Highlight the direct link in standard markdown format (e.g. [View Product](/products/123)).

3. ADDING TO CART & ORDERING DIRECTLY FROM CHAT:
   - When the user expresses intent to buy, order, or add a product to cart (e.g. "add to cart", "buy this", "order this product", "আমি এটা কিনতে চাই", "কার্টে এড করে দাও", "order lipstick", "ব্যাগ এ নাও", "i want to purchase this"):
     • Identify the exact Product ID (and Variant ID if specified) from the catalog.
     • Immediately trigger the add-to-cart action by appending this EXACT action tag at the bottom of your response:
       [[ADD_TO_CART:productId:variantIdOr0:quantity]]
       Example: [[ADD_TO_CART:42:0:1]] or if variant #5 was selected [[ADD_TO_CART:42:5:1]]. If multiple products are requested, output multiple action tags.
     • Warmly inform the customer that you have added the item(s) to their cart!
     • Direct them to complete the order manually on the Cart page: remind them that on the cart page they can apply discount coupons/promo codes, review delivery charges, and choose their preferred payment method (COD, bKash, Nagad, VibeCoin).
     • Always include the direct link in markdown: [Go to Cart](/cart).

4. ADDING TO WISHLIST DIRECTLY FROM CHAT:
   - When the user expresses intent to save, favorite, or add a product to their wishlist (e.g. "add to wishlist", "save for later", "উইশলিস্টে রাখো", "পছন্দের তালিকায় রাখো", "favorite this product", "add to favorites"):
     • Identify the exact Product ID from the catalog.
     • Immediately trigger the wishlist action by appending this EXACT action tag at the bottom of your response:
       [[ADD_TO_WISHLIST:productId]]
       Example: [[ADD_TO_WISHLIST:42]]
     • Warmly let them know that the item has been added to their wishlist!
     • If they are a guest / not logged in, remind them that signing in helps keep their wishlist synced across all devices.
     • Always provide the direct link in markdown: [View Wishlist](/wishlist).

5. HANDLING OUT OF STOCK OR UNAVAILABLE PRODUCTS:
   - If the user asks for or needs a specific product, shade, or skincare solution that is currently NOT in our catalog or marked Out of Stock:
     • GENTLE & COURTEOUS NOTIFICATION: Gently acknowledge their exact requirement and explain that while they definitely need this type of product, it is currently out of stock or not yet available in our store.
     • SMART ALTERNATIVE: Suggest the closest available alternative in our catalog that delivers similar benefits (if available).
     • WHATSAPP PRE-ORDER / SOURCING: Invite them to message our team on WhatsApp if they'd like our team to source or restock it for them.

6. ACTIVE COUPONS & PROMO CODES:
   - When the user asks about discounts, offers, coupons, or promo codes (e.g., "any coupon available?", "what coupons do you have?", "কোন কুপন আছে?", "discount code", "offers"):
     • Consult the "ACTIVE STORE COUPONS & PROMO CODES" section below.
     • If active coupons exist: List EVERY active coupon code clearly with its discount percentage, what it applies to (all items, specific collection, or specific products), and its expiry date.
     • Tell the user how to use it: "You can apply this code on the Cart (/cart) or Checkout (/checkout) page to get your discount!"
     • If no coupons are currently active: Warmly inform them that there are no active coupon codes right now, but encourage them to check back soon or use VibeCoin wallet points.

GENERAL GUIDELINES & STORE DATA:
7. ALWAYS rely on the real-time store information, delivery policies, customer profile data, and live product catalog provided below.
8. INVENTORY & STOCK COUNT POLICY:
   - By default, state whether a product or variant is simply "In Stock" or "Out of Stock".
   - DO NOT reveal the exact inventory number/amount (e.g., "5 available", "12 in stock") during general product recommendations or regular chat.
   - ONLY tell the exact remaining inventory/stock number if the user specifically and explicitly asks (e.g., "How many are left?", "How many in stock?", "কয়টা স্টক আছে?", "How many can I order?").
9. If the user asks about THEIR OWN ACCOUNT (orders, VibeCoin balance, past purchases):
   - Check the "CURRENT LOGGED-IN CUSTOMER PROFILE" below.
   - If logged in, address them by their name, cite their exact VibeCoin balance, or detail their recent orders and tracking statuses.
   - If NOT logged in, politely invite them to log in to VibeMart first.
10. If a customer asks about product variants (shades, sizes), look up the Variants field and specify the available options, prices, and whether they are in stock (only give exact variant inventory counts if explicitly asked).
11. Delivery rules:
   - Inside Dhaka: 1-2 Days (৳60)
   - Outside Dhaka: 3-5 Days (৳130)
   - Free shipping if applicable or promo applied.
12. Language Adaptability:
   - English inquiries -> Respond in natural, warm, polished English.
   - Bengali (বাংলা) inquiries -> Respond in respectful, natural, fluent Bengali (বাংলা).
   - Banglish inquiries (e.g., "amar skin oily, ki use korbo?") -> Respond in fluent Bengali or friendly Banglish.
13. CRITICAL FORMATTING RULES:
   - NEVER use asterisks (*) for formatting, bullet points, bolding, or italics.
   - For bullet lists, use the clean bullet dot symbol (•) or numbers (1., 2.).
   - Do NOT write * *Heading:* or *Note*. Just write plain text like "Highlights: ..." or "(Note: ...)".
   - Keep markdown links intact in standard format [Product Title](/products/ID) without surrounding them in asterisks.

${userContext}

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

    // Extract any structured actions such as [[ADD_TO_CART:productId:variantId:qty]] or [[ADD_TO_WISHLIST:productId]]
    const actions: Array<
      | { type: "ADD_TO_CART"; productId: number; variantId?: number | null; quantity: number }
      | { type: "ADD_TO_WISHLIST"; productId: number }
    > = [];

    const actionRegex = /\[\[ADD_TO_CART:(\d+):(\d+):(\d+)\]\]/g;
    let actionMatch;
    while ((actionMatch = actionRegex.exec(candidateText)) !== null) {
      const pId = parseInt(actionMatch[1], 10);
      const vId = parseInt(actionMatch[2], 10);
      const qty = parseInt(actionMatch[3], 10) || 1;
      if (pId) {
        actions.push({
          type: "ADD_TO_CART",
          productId: pId,
          variantId: vId > 0 ? vId : null,
          quantity: qty,
        });
      }
    }

    const wishlistRegex = /\[\[ADD_TO_WISHLIST:(\d+)\]\]/g;
    let wishlistMatch;
    while ((wishlistMatch = wishlistRegex.exec(candidateText)) !== null) {
      const pId = parseInt(wishlistMatch[1], 10);
      if (pId) {
        actions.push({
          type: "ADD_TO_WISHLIST",
          productId: pId,
        });
      }
    }

    // Strip action tags from visible message text
    let cleanedReply = candidateText
      .replace(/\[\[ADD_TO_CART:\d+:\d+:\d+\]\]/g, "")
      .replace(/\[\[ADD_TO_WISHLIST:\d+\]\]/g, "");

    // Sanitize any remaining markdown asterisks from LLM response while preserving product markdown links
    cleanedReply = cleanedReply
      // Replace list bullet patterns like "* *", "* ", "- " at start of line with "• "
      .replace(/^[\s]*[\*\-]\s*[\*\-]?\s*/gm, "• ")
      // Clean patterns like "* *Word:*" or "**Word:**" into "Word:"
      .replace(/\*+\s*([^*\n]+?)\s*\*+/g, "$1")
      // Remove any lingering isolated asterisks
      .replace(/\*/g, "")
      .trim();

    return NextResponse.json({ reply: cleanedReply, actions });
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
