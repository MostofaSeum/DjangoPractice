# Admin, Settings & Store Operations API

**Base Path:** `/api/v1/store/` (and `/store/`)  
**Authentication:** Public for reading site branding and delivery rates; Staff Only for updates, notification clearing, and audit inspections.

---

## Index

| # | Endpoint | Method | Who Can Use | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `site-settings/` | GET | Public | Retrieve active store title, tagline, logo, currency, and footer links (EN & BN) |
| 2 | `site-settings/update_settings/` | POST / PUT | Staff Only | Update branding identity, currency code, contact info, hero & bento grid, or upload logo |
| 3 | `site-settings/remove_logo/` | POST / DELETE | Staff Only | Delete active store logo from media storage and reset to default |
| 4 | `delivery-settings/` | GET | Public | Retrieve base regional logistics rates (Inside & Outside Dhaka) |
| 5 | `delivery-settings/` | POST | Staff Only | Update default delivery fees and ETAs |
| 6 | `delivery-rules/` | GET / POST | Public / Staff | List or create automated conditional delivery rules (free shipping / flat discount) |
| 7 | `delivery-rules/<id>/` | GET / PATCH / DELETE | Public / Staff | Inspect, update, or remove a delivery rule |
| 8 | `payment-settings/` | GET | Public | Retrieve merchant bKash/Nagad wallet numbers and active gateway flags |
| 9 | `payment-settings/` | POST | Staff Only | Toggle payment methods or update wallet contact numbers |
| 10 | `notifications/` | GET | Staff Only | Retrieve unread count and latest 50 order/system notifications |
| 11 | `notifications/<id>/mark_read/` | POST / PATCH | Staff Only | Mark a single notification as read |
| 12 | `notifications/mark_all_read/` | POST | Staff Only | Clear all unread notification badges |
| 13 | `audit-logs/` | GET | Staff Only | View administrative system modification logs |
| 14 | `/api/translate` | POST | Internal / Admin | AI translation gateway (Google Gemini 3.6 Flash + fallback) to translate English to Bangla |

---

## 1. Storefront Branding & Identity Settings

### `GET /api/v1/store/site-settings/`
Retrieves store brand metadata, bilingual text fields, active currency code, and customer care details.

* **Who Can Use:** Public

#### Success Response (`200 OK`):
```json
{
  "id": 1,
  "site_title": "VibeMart",
  "site_title_bn": "ভাইবমার্ট",
  "tagline": "MAKE-UP STYLE",
  "tagline_bn": "মেক-আপ স্টাইল",
  "brand_description": "VibeMart is a recognized multi-category fashion and lifestyle store built on the principle of \"best price at the highest quality\". Our collections are curated with premium materials that are durable, stylish, and perfect for your vibe.",
  "brand_description_bn": "ভাইবমার্ট একটি ফ্যাশন ও লাইফস্টাইল ব্র্যান্ড যা সর্বোচ্চ মান এবং সাশ্রয়ী মূল্যের নিশ্চয়তা দেয়।",
  "logo": "/media/store/settings/logos/vibemart_logo.png",
  "theme_palette": "botanical_lilac", // Choices: 'botanical_lilac', 'velvet_plum', 'champagne_blush', 'monochrome_slate'
  "currency_code": "BDT", // Choices: 'BDT', 'USD', 'EUR', 'GBP', 'INR', 'SAR', 'AED', 'CAD'
  "support_phone": "+880 1700-000000",
  "support_email": "support@vibemart.com",
  "store_address": "Homestead Gulshan Link Tower, 99 Gulshan Badda Link Rd, Dhaka 1212",
  "store_address_bn": "হোমস্টেড গুলশান লিংক টাওয়ার, ৯৯ গুলশান বাড্ডা লিংক রোড, ঢাকা ১২১২",
  "working_hours": "Sat - Thu: 10:00 - 18:00",
  "working_hours_bn": "শনি - বৃহস্পতি: সকাল ১০:০০ - সন্ধ্যা ৬:০০",
  "facebook_url": "https://facebook.com/vibemart",
  "instagram_url": "https://instagram.com/vibemart",
  "youtube_url": "https://youtube.com/@vibemart",
  "whatsapp_number": "+8801700000000",
  "meta_pixel_id": "123456789012345",
  "google_analytics_id": "G-XXXXXXXXXX",
  "google_tag_manager_id": "GTM-XXXXXXX",
  "ai_chat_active": true,
  "ai_nudge_active": true,
  "ai_nudge_delay_seconds": 5,
  "ai_nudge_duration_seconds": 8,
  "ai_nudge_home_msg": "Welcome to VibeMart! Need any shopping help? Let's chat 👋",
  "ai_nudge_home_msg_bn": "স্বাগতম VibeMart-এ! কেনাকাটায় কোনো সাহায্য লাগবে? চ্যাট করুন 👋",
  "ai_nudge_product_msg": "Any confusion or questions? Just ask me",
  "ai_nudge_product_msg_bn": "কোনো প্রশ্ন বা দ্বিধা আছে? আমাকে জিজ্ঞেস করুন!",
  "footer_copyright": "© 2026 VIBEMART. ALL RIGHTS RESERVED.",
  "footer_copyright_bn": "© ২০২৬ ভাইবমার্ট। সর্বস্বত্ব সংরক্ষিত।",
  "top_banner_image": "/media/store/banners/top_banner.png",
  "top_banner_link": "/gift-cards",
  "top_banner_is_active": true,
  "hero_badge": "New Collection",
  "hero_badge_bn": "নতুন কালেকশন",
  "hero_title_prefix": "Elevate Your",
  "hero_title_prefix_bn": "বাড়িয়ে নিন আপনার",
  "hero_rotating_words": "Beauty, Glow, Look, Glam, Charm",
  "hero_rotating_words_bn": "সৌন্দর্য, উজ্জ্বলতা, লুক, গ্ল্যামার, আকর্ষণ",
  "hero_subtitle": "Experience the intersection of luxury cosmetics, skincare, and radiant beauty aesthetics.",
  "hero_subtitle_bn": "অভিজাত প্রসাধনী, ত্বকের যত্ন এবং দীপ্তিময় রূপচর্চার অপূর্ব মেলবন্ধন অনুভব করুন।",
  "hero_btn_text": "Explore Collection",
  "hero_btn_text_bn": "কালেকশন দেখুন",
  "hero_btn_link": "/collections",
  "discover_title": "Discover the Glam",
  "discover_title_bn": "গ্ল্যামার আবিষ্কার করুন",
  "discover_subtitle": "Collect exclusive beauty essentials and immerse yourself in the finest makeup shades.",
  "discover_subtitle_bn": "অনন্য বিউটি এসেনশিয়াল সংগ্রহ করুন এবং সেরা মেকআপ শেডের সাথে নিজেকে সাজান।",
  "discover_btn_text": "View Exclusives",
  "discover_btn_text_bn": "এক্সক্লুসিভ দেখুন",
  "discover_btn_link": "/products",
  "bento_tile_1_title": "LIPSTICKS",
  "bento_tile_1_title_bn": "লিপস্টিকস",
  "bento_tile_1_collection": 1,
  "bento_tile_1_image": "/media/store/bento/tile_1.png",
  "bento_tile_2_title": "SKINCARE",
  "bento_tile_2_title_bn": "স্কিনকেয়ার",
  "bento_tile_2_collection": 2,
  "bento_tile_2_image": "/media/store/bento/tile_2.png",
  "bento_tile_3_title": "EYE MAKEUP",
  "bento_tile_3_title_bn": "আই মেকআপ",
  "bento_tile_3_collection": 3,
  "bento_tile_3_image": "/media/store/bento/tile_3.png",
  "bento_tile_4_title": "FOUNDATION & GLOW",
  "bento_tile_4_title_bn": "ফাউন্ডেশন ও গ্লো",
  "bento_tile_4_collection": 4,
  "bento_tile_4_image": "/media/store/bento/tile_4.png",
  "bento_tile_247_title": "Customer Support",
  "bento_tile_247_title_bn": "২৪/৭ কাস্টমার সাপোর্ট",
  "bento_tile_247_image": "/media/store/bento/tile_247.png",
  "bento_tile_247_link": "/contact",
  "bento_tile_delivery_title": "Fast Delivery",
  "bento_tile_delivery_title_bn": "দ্রুত ডেলিভারি",
  "bento_tile_delivery_image": "/media/store/bento/tile_delivery.png",
  "bento_tile_delivery_link": "/shipping",
  "marquee_is_active": true,
  "marquee_items_json": "[{\"id\":\"1\",\"text\":\"100% Genuine Luxury Cosmetics\",\"text_bn\":\"১০০% আসল লাক্সারি প্রসাধনী\",\"icon\":\"Sparkles\",\"is_active\":true}]",
  "stats_is_active": true,
  "stats_items_json": "[{\"id\":\"1\",\"target\":15000,\"suffix\":\"+\",\"label\":\"Happy Beauties\",\"label_bn\":\"সন্তুষ্ট গ্রাহক\",\"is_active\":true}]",
  "why_us_is_active": true,
  "why_us_items_json": "[{\"id\":\"1\",\"icon\":\"ShieldCheck\",\"title\":\"100% Authentic Brands\",\"title_bn\":\"১০০% আসল ব্র্যান্ড\",\"is_active\":true}]",
  "last_updated": "2026-09-15T10:00:00Z"
}
```

---

### `POST /api/v1/store/site-settings/update_settings/`
Updates website brand settings or uploads media assets. Supports bilingual fields (English & Bangla) across general branding, hero typography, and bento tiles.

* **Who Can Use:** Staff Only (`IsAdminUser`)
* **Content-Type:** `multipart/form-data` or `application/json`

#### Form-Data / JSON Fields & Constraints:

| Field | Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `site_title` | String | Max 15 chars | Store brand name in English |
| `site_title_bn` | String | Max 25 chars | Store brand name in Bangla |
| `tagline` | String | Max 30 chars | Secondary brand tagline in English |
| `tagline_bn` | String | Max 45 chars | Secondary brand tagline in Bangla |
| `brand_description` | String | Max 70 words | Brand philosophy / overview in English |
| `brand_description_bn` | String | Max 70 words | Brand philosophy in Bangla |
| `currency_code` | String | Choice | Active currency (`BDT`, `USD`, `EUR`, `GBP`, `INR`, `SAR`, `AED`, `CAD`) |
| `support_phone` | String | Max 30 chars | Customer care phone number |
| `support_email` | String | Max 100 chars | Support email address |
| `store_address` | String | Max 200 chars | Physical outlet address in English |
| `store_address_bn` | String | Max 250 chars | Physical outlet address in Bangla |
| `working_hours` | String | Max 60 chars | Business operational hours in English |
| `working_hours_bn` | String | Max 80 chars | Business operational hours in Bangla |
| `facebook_url` | String | Max 255 chars | Facebook profile or page URL |
| `instagram_url` | String | Max 255 chars | Instagram account URL |
| `youtube_url` | String | Max 255 chars | YouTube channel URL |
| `whatsapp_number` | String | Max 50 chars | WhatsApp direct contact number |
| `footer_copyright` | String | Max 100 chars | Legal copyright notice in English |
| `footer_copyright_bn` | String | Max 120 chars | Legal copyright notice in Bangla |
| `logo` | File | Image upload | Transparent brand logo (PNG/WEBP/SVG) |
| `top_banner_image` | File | 1907 x 150 px | Top promotional announcement banner |
| `top_banner_link` | String | Max 500 chars | Banner click destination URL |
| `top_banner_is_active` | Boolean | True / False | Enable or disable announcement bar |
| `hero_badge` | String | Max 100 chars | Pill badge above hero title (English) |
| `hero_badge_bn` | String | Max 100 chars | Pill badge above hero title (Bangla) |
| `hero_title_prefix` | String | Max 100 chars | Static headline prefix (e.g. "Elevate Your") |
| `hero_title_prefix_bn` | String | Max 100 chars | Static headline prefix in Bangla |
| `hero_rotating_words` | String | Max 500 chars | Comma-separated dynamic animated keywords (EN) |
| `hero_rotating_words_bn`| String | Max 500 chars | Comma-separated dynamic animated keywords (BN) |
| `hero_subtitle` | String | Text | Hero descriptive narrative in English |
| `hero_subtitle_bn` | String | Text | Hero descriptive narrative in Bangla |
| `hero_btn_text` | String | Max 100 chars | Primary Hero CTA button text (English) |
| `hero_btn_text_bn` | String | Max 100 chars | Primary Hero CTA button text (Bangla) |
| `hero_btn_link` | String | Max 500 chars | Hero CTA destination URL |
| `discover_title` | String | Max 100 chars | Discover card headline in English |
| `discover_title_bn` | String | Max 100 chars | Discover card headline in Bangla |
| `discover_subtitle` | String | Text | Discover card description in English |
| `discover_subtitle_bn` | String | Text | Discover card description in Bangla |
| `discover_btn_text` | String | Max 100 chars | Discover button label in English |
| `discover_btn_text_bn`| String | Max 100 chars | Discover button label in Bangla |
| `discover_btn_link` | String | Max 500 chars | Discover button target URL |
| `bento_tile_1_title` to `bento_tile_4_title` | String | Max 100 chars | Bento category tile titles in English |
| `bento_tile_1_title_bn` to `bento_tile_4_title_bn` | String | Max 100 chars | Bento category tile titles in Bangla |
| `bento_tile_1_collection` to `bento_tile_4_collection` | Integer | Collection ID | Target category link for bento tiles |
| `bento_tile_1_image` to `bento_tile_4_image` | File | Image upload | Category card image assets |
| `bento_tile_247_title` / `bento_tile_247_title_bn` | String | Max 100 chars | 24/7 service slot title (EN & BN) |
| `bento_tile_247_image` | File | Image upload | 24/7 slot artwork |
| `bento_tile_247_link` | String | Max 500 chars | 24/7 slot destination link |
| `bento_tile_delivery_title` / `bento_tile_delivery_title_bn` | String | Max 100 chars | Express shipping slot title (EN & BN) |
| `bento_tile_delivery_image` | File | Image upload | Express delivery slot artwork |
| `bento_tile_delivery_link` | String | Max 500 chars | Express delivery slot destination link |
| `remove_logo` | Boolean | True / False | If true, purges existing logo |
| `remove_top_banner` | Boolean | True / False | If true, purges top promotional banner |
| `remove_bento_tile_{1..4}_image` | Boolean | True / False | If true, purges specific bento image |
| `remove_bento_tile_247_image` | Boolean | True / False | If true, purges 24/7 bento image |
| `remove_bento_tile_delivery_image` | Boolean | True / False | If true, purges delivery bento image |

#### Success Response (`200 OK`):
*Returns updated `SiteSetting` object.*

---

### `POST /api/translate`
Internal Next.js AI translation gateway powering the admin panel's inline and batch auto-translation buttons.

* **Who Can Use:** Staff / Internal Client
* **Engine:** Google Gemini 3.6 Flash AI with automatic MyMemory fallback
* **Authentication:** Handled server-side via `GEMINI_API_KEY` in environment

#### Request Body:
```json
{
  "text": "Experience the intersection of luxury cosmetics, skincare, and radiant beauty aesthetics.",
  "sl": "en", // Source language (default: "en")
  "tl": "bn"  // Target language (default: "bn")
}
```

#### Success Response (`200 OK`):
```json
{
  "translatedText": "অভিজাত প্রসাধনী, ত্বকের যত্ন এবং দীপ্তিময় রূপচর্চার অপূর্ব মেলবন্ধন অনুভব করুন।"
}
```

---

### `POST /api/v1/store/site-settings/remove_logo/`
Permanently deletes the uploaded logo file from server media storage.

* **Who Can Use:** Staff Only

#### Success Response (`200 OK`):
```json
{
  "id": 1,
  "logo": null,
  "message": "Logo removed successfully."
}
```

---

## 2. Base Regional Logistics & Dynamic Delivery Rules

### `GET /api/v1/store/delivery-settings/`
Returns default regional shipping charges and estimated delivery timelines.

* **Who Can Use:** Public

#### Success Response (`200 OK`):
```json
{
  "id": 1,
  "inside_dhaka_charge": "60.00",
  "outside_dhaka_charge": "130.00",
  "estimated_days_inside": "1-2 Days",
  "estimated_days_outside": "3-5 Days",
  "is_active": true
}
```

---

### `GET /api/v1/store/delivery-rules/`
Lists automated delivery discount rules (e.g. Free delivery on orders over ৳1500, or reduced delivery for specific collections/products).

* **Who Can Use:** Public

#### Success Response (`200 OK`):
```json
[
  {
    "id": 3,
    "title": "Beauty Collection Special Delivery Offer",
    "rule_type": "min_spend", // 'min_spend', 'min_qty', 'free_shipping'
    "discount_type": "fixed", // 'free', 'fixed', 'percentage'
    "discount_value": "30.00",
    "min_spend": "1000.00",
    "collection": 1,
    "collection_title": "Beauty",
    "products": [],
    "is_active": true
  }
]
```

### `POST /api/v1/store/delivery-rules/`
Create a conditional delivery rule.

* **Who Can Use:** Staff Only (`IsAdminOrReadOnly`)

---

## 3. Real-Time Admin Notification Hub

### `GET /api/v1/store/notifications/`
Returns latest operational notifications (new orders, stock warnings, return claims) with unread counter.

* **Who Can Use:** Staff Only

#### Success Response (`200 OK`):
```json
{
  "unread_count": 2,
  "notifications": [
    {
      "id": 45,
      "title": "New Return Request for Order #142",
      "message": "Customer @rahim requested a return for Order #142 (Amount: ৳765.00). Reason: Damaged Product.",
      "notification_type": "return", // 'order', 'stock', 'return', 'system'
      "target_id": "142",
      "is_read": false,
      "created_at": "2026-09-03T12:10:00Z"
    },
    {
      "id": 44,
      "title": "New Order #142 Received",
      "message": "Order #142 placed by rahim_uddin for ৳1,590.00.",
      "notification_type": "order",
      "target_id": "142",
      "is_read": true,
      "created_at": "2026-09-03T11:50:00Z"
    }
  ]
}
```

### `POST /api/v1/store/notifications/{id}/mark_read/`
Marks a specific notification as read.

#### Success Response (`200 OK`):
```json
{
  "id": 45,
  "is_read": true
}
```

### `POST /api/v1/store/notifications/mark_all_read/`
Clears all unread badges across the dashboard.

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "message": "All notifications marked as read."
}
```

---

## 4. Merchant Payment Gateways & Wallets

### `GET /api/v1/store/payment-settings/`
Retrieves the merchant's bKash and Nagad numbers and payment method activation flags (COD, bKash, Nagad, VibeCoin).

* **Who Can Use:** Public (Allows checkout page to render active payment methods)

#### Success Response (`200 OK`):
```json
{
  "id": 1,
  "bkash_number": "01712345678",
  "bkash_active": true,
  "nagad_number": "01812345678",
  "nagad_active": true,
  "cod_active": true,
  "vibecoin_active": true,
  "last_updated": "2026-09-03T10:00:00Z"
}
```

---

### `POST /api/v1/store/payment-settings/` (also supports `PUT` / `PATCH`)
Updates payment gateway settings or modifies merchant account numbers.

* **Who Can Use:** Staff Only (`IsAdminUser`)

#### Request Body:
```json
{
  "bkash_number": "01799887766",
  "bkash_active": true,
  "nagad_number": "01899887766",
  "nagad_active": true,
  "cod_active": true,
  "vibecoin_active": true
}
```

#### Success Response (`200 OK`):
*Returns updated `PaymentSetting` object.*

---

## 5. Audit Trail & Security Compliance Logs

### `GET /api/v1/store/audit-logs/`
Retrieves immutable administrative audit logs tracking order cancellations, site setting updates, and inventory changes.

* **Who Can Use:** Staff Only (`IsAdminUser`)
* **Security Rule:** Create, edit, and delete operations are strictly disabled (`405 Method Not Allowed`).
* **Search Fields:** `entity_name`, `entity_id`, `performed_by_name`, `action`
* **Ordering:** `-created_at` (default)

#### Success Response (`200 OK`):
```json
[
  {
    "id": 84,
    "entity_name": "Order",
    "entity_id": "142",
    "action": "UPDATE",
    "performed_by": 1,
    "performed_by_name": "Mostofa Seum",
    "changes": {
      "action": "order_cancelled",
      "order_id": 142,
      "reason": "Cancelled by customer",
      "restocked": true
    },
    "ip_address": "127.0.0.1",
    "created_at": "2026-09-03T12:05:00Z"
  }
]
```

---

### `GET /api/v1/store/audit-logs/{id}/`
Retrieves single audit log entry by ID.

#### Success Response (`200 OK`):
*Returns single `AuditLog` object.*

