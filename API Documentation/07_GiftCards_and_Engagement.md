# Gift Cards, Loyalty & Engagement API

**Base Path:** `/api/v1/store/` (and `/store/`)  
**Authentication:** Public for purchasing gift cards and newsletter subscription; Authenticated for converting gift cards into VibeCoins and managing wishlists.

---

## Index

| # | Endpoint | Method | Who Can Use | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `gift-cards/denominations/` | GET | Public | Retrieve list of allowed gift card monetary values |
| 2 | `gift-cards/` | POST | Customer / Guest | Purchase a digital gift card with recipient email & amount |
| 3 | `gift-cards/redeem/` | POST | Customer | Redeem a 16-character code into customer VibeCoin rewards wallet |
| 4 | `gift-cards/` | GET | Staff Only | List all issued gift cards and their redemption status |
| 5 | `wishlist/` | GET | Customer | List authenticated customer's saved favorite products |
| 6 | `wishlist/toggle/` | POST / DELETE | Customer | Add or remove an item from personal wishlist |
| 7 | `subscribers/` | POST | Public | Subscribe email to newsletter ("Join the Club") with duplicate protection |

---

## 1. Digital Gift Card Denominations

### `GET /api/v1/store/gift-cards/denominations/`
Returns available gift card monetary options in Bangladeshi Taka.

* **Who Can Use:** Public

#### Success Response (`200 OK`):
```json
[
  { "price": 500, "title": "$500 Gift Card" },
  { "price": 1000, "title": "$1,000 Gift Card" },
  { "price": 1500, "title": "$1,500 Gift Card" },
  { "price": 2000, "title": "$2,000 Gift Card" },
  { "price": 2500, "title": "$2,500 Gift Card" },
  { "price": 3000, "title": "$3,000 Gift Card" }
]
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
Redeems an unused gift card directly into the customer's `vibe_coin` loyalty account. Validates that the logged-in user's email matches the gift card recipient email. Permanently sets `is_used = true`.

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
  "valid": true,
  "card_code": "VB89KM22P091A4ZQ",
  "price": "1000.00",
  "vibe_coins_added": "1000.00",
  "new_vibe_coin_balance": "2250.00",
  "expiry_date": "2027-09-03",
  "message": "Congratulations! Your gift card was successfully redeemed and 1000.00 VibeCoins have been added to your profile."
}
```

#### Error Responses:
* **`400 Bad Request`** (Already redeemed):
```json
{
  "error": "This gift card has already been redeemed.",
  "is_used": true
}
```
* **`400 Bad Request`** (Recipient email does not match logged-in customer):
```json
{
  "error": "Invalid gift card code. Please try again."
}
```
* **`404 Not Found`**:
```json
{
  "error": "Invalid gift card code. Please try again."
}
```

---

## 4. Customer Wishlist Management

### `GET /api/v1/store/wishlist/`
Lists all bookmarked items for the logged-in customer.

* **Who Can Use:** Authenticated Customer

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

---

### `POST /api/v1/store/wishlist/toggle/` (also supports `DELETE`)
Toggles wishlist status for a product (adds if absent, removes if already present).

* **Who Can Use:** Authenticated Customer

#### Request Body:
```json
{
  "product_id": 12
}
```

#### Success Response (`200 OK`):
```json
{
  "in_wishlist": true,
  "message": "Added to wishlist"
}
```
*(When removed: `{"in_wishlist": false, "message": "Removed from wishlist"}`)*

---

## 5. Newsletter Subscription ("Join the Club")

### `POST /api/v1/store/subscribers/`
Subscribes an email address to receive VIP promotional offers and discount vouchers. Enforces deduplication.

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
  "message": "The mail is added. We will reach you soon.",
  "data": {
    "id": 89,
    "email": "visitor@example.com",
    "created_at": "2026-09-03T12:25:00Z"
  }
}
```

#### Error Response (`400 Bad Request` - Already Subscribed):
```json
{
  "error": "We already have you! No duplicate entries allowed.",
  "is_duplicate": true
}
```
