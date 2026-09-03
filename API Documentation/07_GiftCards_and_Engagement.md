# Gift Cards, Loyalty & Engagement API

**Base Path:** `/api/v1/store/` (and `/store/`)  
**Authentication:** Public for purchasing gift cards and newsletter subscription; Authenticated for converting gift cards into VibeCoins and managing wishlists.

---

## Index

| # | Endpoint | Method | Who Can Use | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `gift-cards/denominations/` | GET | Public | Retrieve list of allowed gift card monetary values in Taka |
| 2 | `gift-cards/` | POST | Customer / Guest | Purchase a digital gift card with recipient email & message |
| 3 | `gift-cards/redeem/` | POST | Customer | Redeem a 16-character code into customer VibeCoin rewards wallet |
| 4 | `gift-cards/` | GET | Staff Only | List all issued gift cards and their redemption status |
| 5 | `wishlist/` | GET | Customer | List authenticated customer's saved favorite products |
| 6 | `wishlist/toggle/` | POST / DELETE | Customer | Add or remove an item from personal wishlist |
| 7 | `subscribers/` | POST | Public | Subscribe email to newsletter ("Join the Club") |

---

## 1. Digital Gift Card Denominations

### `GET /api/v1/store/gift-cards/denominations/`
Returns available gift card monetary options in Bangladeshi Taka.

#### Success Response (`200 OK`):
```json
{
  "denominations": [500, 1000, 1500, 2000, 2500, 3000]
}
```

---

## 2. Purchase Digital Gift Card

### `POST /api/v1/store/gift-cards/`
Issues a new digital gift card with a secret 16-character alphanumeric key valid for 365 days.

* **Who Can Use:** Public / Customer

#### Request Body:
```json
{
  "user_email": "friend@example.com",
  "price": 1000.00
}
```

#### Success Response (`201 Created`):
```json
{
  "id": "c1f7b889-1082-4fa1-8273-df26719bb442",
  "user_email": "friend@example.com",
  "card_code": "VB89KM22P091A4ZQ",
  "price": "1000.00",
  "created_at": "2026-09-03T12:20:00Z",
  "expiry_date": "2027-09-03T12:20:00Z",
  "is_used": false
}
```

---

## 3. Redeem Gift Card to VibeCoin Wallet

### `POST /api/v1/store/gift-cards/redeem/`
Redeems an unused gift card directly into the customer's `vibe_coin` loyalty account. Permanently sets `is_used = true`.

* **Who Can Use:** Authenticated Customer (`Authorization: JWT <token>`)

#### Request Body:
```json
{
  "card_code": "VB89KM22P091A4ZQ"
}
```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "message": "৳1000.00 added to your VibeCoin balance!",
  "vibe_coin_balance": "2250.00"
}
```

#### Error Responses:
* **`400 Bad Request`** (Already redeemed):
```json
{
  "error": "This gift card has already been redeemed."
}
```
* **`404 Not Found`**:
```json
{
  "error": "Invalid gift card code or card has expired."
}
```

---

## 4. Customer Wishlist Management

### `GET /api/v1/store/wishlist/`
Lists all bookmarked items for the logged-in customer.

#### Success Response (`200 OK`):
```json
[
  {
    "id": 14,
    "product": {
      "id": 12,
      "title": "Velvet Matte Lipstick",
      "unit_price": 850.0,
      "discounted_price": 765.0,
      "inventory": 45,
      "images": [
        { "image": "/media/store/images/lipstick_red.jpg" }
      ]
    },
    "created_at": "2026-09-01T12:00:00Z"
  }
]
```

### `POST /api/v1/store/wishlist/toggle/`
Toggles wishlist status for a product (adds if absent, removes if already present).

#### Request Body:
```json
{
  "product_id": 12
}
```

#### Success Response (`200 OK`):
```json
{
  "wishlisted": true,
  "message": "Product added to wishlist."
}
```

---

## 5. Newsletter Subscription ("Join the Club")

### `POST /api/v1/store/subscribers/`
Subscribes an email address to receive VIP promotional offers and discount vouchers.

* **Who Can Use:** Public

#### Request Body:
```json
{
  "email": "visitor@example.com"
}
```

#### Success Response (`201 Created`):
```json
{
  "id": 89,
  "email": "visitor@example.com",
  "created_at": "2026-09-03T12:25:00Z"
}
```

#### Error Response (`400 Bad Request`):
```json
{
  "email": ["subscriber with this email already exists."]
}
```
