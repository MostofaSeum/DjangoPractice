# Analytics, GA4 Telemetry & AI Services API

**Base Path:** `/api/v1/store/` (Backend Django) and `/api/` (Frontend Next.js Edge)  
**Authentication:** Staff Only for GA4 server telemetry; Public / Authenticated for AI Assistant; Internal/Admin for AI Translation.

---

## Index

| # | Endpoint | Method | Service | Who Can Use | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `store/analytics/ga4-live/` | GET | Django Backend | Staff Only | Query live Google Analytics 4 (GA4) Data API via service account credentials, returning active users, acquisition channels, device breakdown, top pages, daily trends, event counts, city breakdown, hourly traffic, and e-commerce drop-off funnel |
| 2 | `/api/chat` | POST | Next.js API | Public / Customer | VibeBuddy 24/7 AI shopping assistant and beauty companion powered by Google Gemini, with live catalog injection, inventory checking, and authenticated customer order/wallet context |
| 3 | `/api/translate` | POST | Next.js API | Public / Staff | Bilingual AI translation service (Google Gemini 3.6 Flash + MyMemory fallback) for translating product titles, descriptions, and site copy from English to Bangla |

---

## 1. Google Analytics 4 (GA4) Live Telemetry & E-Commerce Funnel

### `GET /api/v1/store/analytics/ga4-live/`
Directly queries the Google Analytics Data API (`google.analytics.data_v1beta`) using a Google Cloud Service Account. Aggregates real-time active visitors (last 30 minutes), traffic channels, geographic breakdown, device categories, top pages, and the complete 4-stage e-commerce drop-off funnel.

* **Who Can Use:** Staff Only (`IsAdminUser`)
* **Base Path:** `/api/v1/store/analytics/ga4-live/` (also available via `/store/analytics/ga4-live/`)
* **Prerequisites:**
  - `GA4_PROPERTY_ID`: GA4 numeric property ID configured in environment variables.
  - `GA4_CREDENTIALS_JSON` or `GA4_CREDENTIALS_FILE`: Service account credentials key file with `Viewer` access on the GA4 property.

#### Query Parameters:
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `days` | integer | `7` | Timeframe in days (`1` for today, `7` for last 7 days, `30` for last 30 days) |

#### Success Response (`200 OK` — Configured):
```json
{
  "is_configured": true,
  "property_id": "123456789",
  "days": 7,
  "realtime_active_users": 14,
  "total_active_users": 1850,
  "total_sessions": 2420,
  "total_screen_page_views": 8940,
  "bounce_rate": 38.4,
  "avg_session_duration": 145.2,
  "views_per_session": 3.69,
  "channels": [
    { "channel": "Direct", "sessions": 1120, "percentage": 46.3 },
    { "channel": "Organic Social", "sessions": 780, "percentage": 32.2 },
    { "channel": "Organic Search", "sessions": 390, "percentage": 16.1 },
    { "channel": "Referral", "sessions": 130, "percentage": 5.4 }
  ],
  "devices": [
    { "category": "Mobile", "users": 1520, "percentage": 82.2 },
    { "category": "Desktop", "users": 310, "percentage": 16.8 },
    { "category": "Tablet", "users": 20, "percentage": 1.0 }
  ],
  "top_pages": [
    {
      "path": "/",
      "title": "VibeMart - Premium Cosmetics & Beauty Store",
      "views": 4120,
      "users": 1420
    },
    {
      "path": "/products",
      "title": "VibeMart Products - Luxury Cosmetics, Skincare & Beauty Catalog",
      "views": 2180,
      "users": 890
    },
    {
      "path": "/collections",
      "title": "VibeMart Collections - Curated Beauty, Makeup & Skincare Sets",
      "views": 940,
      "users": 410
    }
  ],
  "daily_trends": [
    { "date": "09/17", "users": 240, "views": 1120 },
    { "date": "09/18", "users": 285, "views": 1340 },
    { "date": "09/19", "users": 310, "views": 1490 }
  ],
  "event_counts": {
    "page_view": 8940,
    "user_engagement": 5620,
    "session_start": 2420,
    "view_item": 2150,
    "add_to_cart": 680,
    "begin_checkout": 340,
    "purchase": 145
  },
  "cities": [
    { "city": "Dhaka", "country": "Bangladesh", "users": 1320, "sessions": 1780, "percentage": 71.4 },
    { "city": "Chittagong", "country": "Bangladesh", "users": 280, "sessions": 360, "percentage": 15.1 },
    { "city": "Sylhet", "country": "Bangladesh", "users": 110, "sessions": 140, "percentage": 5.9 }
  ],
  "traffic_sources": [
    { "source_medium": "facebook / cpc", "sessions": 620, "users": 490, "percentage": 25.6 },
    { "source_medium": "google / organic", "sessions": 390, "users": 310, "percentage": 16.1 },
    { "source_medium": "(direct) / (none)", "sessions": 1120, "users": 920, "percentage": 46.3 }
  ],
  "hourly_traffic": [
    { "hour": "00", "label": "0:00", "users": 42, "sessions": 51 },
    { "hour": "21", "label": "21:00", "users": 215, "sessions": 260 }
  ],
  "funnel": {
    "steps": [
      {
        "step": "view_item",
        "label": "Product Views",
        "count": 2150,
        "conversion_rate": 100.0,
        "dropoff_rate": 0.0
      },
      {
        "step": "add_to_cart",
        "label": "Added to Cart",
        "count": 680,
        "conversion_rate": 31.6,
        "dropoff_rate": 68.4
      },
      {
        "step": "begin_checkout",
        "label": "Initiated Checkout",
        "count": 340,
        "conversion_rate": 50.0,
        "dropoff_rate": 50.0
      },
      {
        "step": "purchase",
        "label": "Completed Orders",
        "count": 145,
        "conversion_rate": 42.6,
        "dropoff_rate": 57.4
      }
    ],
    "overall_conversion_rate": 6.74
  }
}
```

#### Fallback Response (`200 OK` — Not Configured):
If Google credentials or package are not yet installed, the endpoint safely returns graceful status:
```json
{
  "is_configured": false,
  "error_type": "missing_credentials",
  "message": "GA4_PROPERTY_ID environment variable is not configured"
}
```

---

## 2. VibeBuddy AI Shopping Assistant & Chatbot

### `POST /api/chat`
Provides conversational AI shopping assistance powered by Google Gemini. The endpoint automatically injects real-time store catalog data (inventory status, unit prices, discount percent, shades/variants), delivery rules, return policies, gift cards, and VibeCoin guidelines.

* **Who Can Use:** Public / Logged-in Customer
* **Authentication:** Optional `Authorization: JWT <token>` header
  - **When provided:** Automatically queries buyer name, email, phone, live VibeCoin wallet balance, and recent 5 orders to answer personalized questions (e.g. *"What is my VibeCoin balance?"*, *"Where is my order #142?"*).
  - **When omitted:** Operates in Guest mode, providing general catalog and shopping guidance.
* **Model Hierarchy:** Tries `gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.6-flash`, and `gemini-flash-latest` with automatic failover.

#### Request Headers:
```http
Content-Type: application/json
Authorization: JWT eyJhbGciOi... (optional)
```

#### Request Body:
```json
{
  "message": "Do you have any matte red lipsticks in stock?",
  "history": [
    {
      "sender": "user",
      "text": "Hi there!"
    },
    {
      "sender": "bot",
      "text": "Hello! Welcome to VibeMart! How can I help your beauty routine today?"
    }
  ]
}
```

#### Success Response (`200 OK`):
```json
{
  "reply": "Yes! We have the Velvet Matte Lipstick available in Shade 01 Ruby for ৳765 (discounted from ৳850). It is currently in stock with 45 units available. You can view it here: /products/12"
}
```

#### Error Response (`400 Bad Request`):
```json
{
  "error": "Message is required."
}
```

---

## 3. Bilingual AI Translation Gateway

### `POST /api/translate`
Provides on-the-fly translation between English and Bengali (Bangla) optimized for e-commerce terminology, cosmetics shades, and store settings.

* **Who Can Use:** Internal Frontend / Admin Dashboard
* **Primary Engine:** Google Gemini 3.6 Flash (`temperature: 0.1` for deterministic, natural Bangla).
* **Fallback Engine:** MyMemory Translation API.

#### Request Body:
```json
{
  "text": "Luxury velvet lipstick with intense hydration and 12-hour wear.",
  "sl": "en",
  "tl": "bn"
}
```

#### Success Response (`200 OK`):
```json
{
  "translatedText": "তীব্র আর্দ্রতা এবং ১২ ঘণ্টার দীর্ঘস্থায়ী স্থায়িত্ব সহ বিলাসবহুল ভেলভেট লিপস্টিক।"
}
```
