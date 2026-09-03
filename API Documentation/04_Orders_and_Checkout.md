# Orders, Checkout & Address Book API

**Base Path:** `/api/v1/store/` (and `/store/`)  
**Authentication:** Authenticated for customer orders and addresses; Staff Only for administrative order management and order modifications.

---

## Index

| # | Endpoint | Method | Who Can Use | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `orders/` | GET | Customer / Staff | List customer orders (Staff sees all orders across system) |
| 2 | `orders/` | POST | Customer | Place an express order from cart (COD, bKash, Nagad, VibeCoin) |
| 3 | `orders/<id>/` | GET | Customer / Staff | Retrieve single order details, items, courier status, and return history |
| 4 | `orders/<id>/` | PATCH | Staff Only | Update payment status or perform live order modifications |
| 5 | `orders/<id>/` | DELETE | Staff Only | Cancel or remove an order record |
| 6 | `addresses/` | GET / POST | Customer | List up to 5 saved delivery addresses or create a new address |
| 7 | `addresses/<id>/` | PUT / PATCH / DELETE | Customer | Update details or remove a saved delivery address |
| 8 | `addresses/<id>/set_default/`| POST | Customer | Set a specific address as primary default |
| 9 | `customers/me/` | GET / PUT | Customer | Retrieve current buyer profile and active VibeCoin rewards balance |
| 10 | `customers/<id>/history/` | GET | Staff Only | View full lifetime order history and spend metrics for a customer |

---

## 1. Place an Order (Checkout)

### `POST /api/v1/store/orders/`
Converts an active cart into a confirmed customer order. Automatically decrements inventory, applies conditional delivery discounts, records MFS transaction identifiers, or deducts customer VibeCoins.

* **Who Can Use:** Authenticated Customer (`Authorization: JWT <token>`)

#### Request Body:
```json
{
  "cart_id": "e8d47228-3e9a-4712-bf23-8cfb8a07c391",
  "shipping_address": "House 12, Road 5, Block C, Banani",
  "phone": "+8801712345678",
  "delivery_area": "inside_dhaka", // 'inside_dhaka' or 'outside_dhaka'
  "delivery_charge": 60.00,
  "payment_method": "B",           // 'C' (COD), 'B' (bKash), 'N' (Nagad), 'V' (VibeCoin), 'O' (Online)
  "transaction_id": "9H4K78LL2",   // required if payment_method is 'B' or 'N'
  "transaction_phone_no": "01712345678", // required if payment_method is 'B' or 'N'
  "coupon_code": "SUMMER20"        // optional
}
```

#### Success Response (`201 Created`):
```json
{
  "id": 142,
  "customer": 8,
  "customer_name": "rahim_uddin",
  "placed_at": "2026-09-03T11:50:00Z",
  "payment_status": "P",           // 'P' (Pending), 'C' (Complete), 'F' (Failed)
  "payment_method": "B",
  "transaction_id": "9H4K78LL2",
  "delivery_area": "inside_dhaka",
  "delivery_charge": "60.00",
  "coupon_code": "SUMMER20",
  "is_edited_by_admin": false,
  "items": [
    {
      "id": 204,
      "product": {
        "id": 12,
        "title": "Velvet Matte Lipstick"
      },
      "variant_title": "Shade 01 Ruby",
      "quantity": 2,
      "unit_price": "765.00"
    }
  ]
}
```

---

## 2. Admin Live Order Modification

### `PATCH /api/v1/store/orders/{id}/`
Allows merchant staff to modify item quantities, change variants, adjust delivery charges, or update delivery addresses on live COD customer orders.

* **Who Can Use:** Staff Only
* **System Enforcement:** Sets `is_edited_by_admin = true` and records `edited_at` timestamp.

#### Request Body:
```json
{
  "shipping_address": "House 14 (Updated), Road 5, Banani",
  "phone": "+8801712345678",
  "delivery_area": "inside_dhaka",
  "delivery_charge": 60.00,
  "items": [
    {
      "product_id": 12,
      "variant_id": 4,
      "quantity": 3,
      "unit_price": 765.00
    }
  ]
}
```

#### Success Response (`200 OK`):
```json
{
  "id": 142,
  "is_edited_by_admin": true,
  "edited_at": "2026-09-03T12:00:15Z",
  "shipping_address": "House 14 (Updated), Road 5, Banani",
  "items": [ ... ]
}
```

---

## 3. Customer Address Book Management

### `GET /api/v1/store/addresses/`
Lists all saved shipping addresses for the authenticated customer (capped at 5 addresses).

#### Success Response (`200 OK`):
```json
[
  {
    "id": 5,
    "title": "Home",
    "street": "House 12, Road 4, Sector 3, Uttara",
    "city": "Dhaka",
    "is_default": true,
    "created_at": "2026-09-01T10:00:00Z"
  },
  {
    "id": 6,
    "title": "Office",
    "street": "Level 8, Concord Tower, Mohakhali",
    "city": "Dhaka",
    "is_default": false,
    "created_at": "2026-09-02T14:30:00Z"
  }
]
```

### `POST /api/v1/store/addresses/`
Adds a new address to the customer's profile.

#### Request Body:
```json
{
  "title": "Studio",
  "street": "House 88, Road 11, Banani",
  "city": "Dhaka",
  "is_default": false
}
```

### `POST /api/v1/store/addresses/{id}/set_default/`
Marks a saved address as default. Automatically unsets any previous default address.

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "message": "Address marked as default successfully."
}
```

---

## 4. Customer Profile & Rewards Balance

### `GET /api/v1/store/customers/me/`
Returns the authenticated customer profile, tier, and VibeCoin rewards balance.

#### Success Response (`200 OK`):
```json
{
  "id": 8,
  "user_id": 14,
  "phone": "+8801712345678",
  "birth_date": "1998-05-15",
  "membership": "G", // 'B' (Bronze), 'S' (Silver), 'G' (Gold)
  "vibe_coin": "1250.00"
}
```
