# Cart, Coupons & Delivery Rules API

**Base Path:** `/api/v1/store/` (and `/store/`)  
**Authentication:** Public for cart drawer and coupon validation; Staff Only for creating marketing campaigns and delivery rules.

---

## Index

| # | Endpoint | Method | Who Can Use | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `carts/` | POST | Public / Guest | Initialize a new shopping cart instance (returns UUID token) |
| 2 | `carts/<id>/` | GET | Public / Guest | Retrieve cart subtotal, item list, and active promotional discounts |
| 3 | `carts/<id>/` | DELETE | Public / Guest | Clear or delete an active cart session |
| 4 | `carts/<cart_pk>/items/` | GET | Public | List all items inside a specific cart |
| 5 | `carts/<cart_pk>/items/` | POST | Public | Add a product or specific cosmetic shade variant to cart |
| 6 | `carts/<cart_pk>/items/<id>/` | PATCH | Public | Update quantity of a cart item |
| 7 | `carts/<cart_pk>/items/<id>/` | DELETE | Public | Remove an item from the cart |
| 8 | `coupons/validate/` | POST | Public | Validate promotional coupon code and calculate discount |
| 9 | `coupons/` | GET / POST | Staff Only | List or create promo discount coupons |
| 10 | `coupons/<id>/` | PATCH / DELETE | Staff Only | Edit or deactivate promo coupons |
| 11 | `delivery-rules/` | GET / POST | Public / Staff | List or configure conditional free/reduced shipping rules |
| 12 | `delivery-rules/<id>/` | PATCH / DELETE | Staff Only | Edit or delete a conditional delivery rule |

---

## 1. Initialize Cart

### `POST /api/v1/store/carts/`
Creates a new stateless cart session identified by a unique UUID4 token.

* **Who Can Use:** Public / Guest / Customer

#### Request Body:
*None (or empty `{}`)*

#### Success Response (`201 Created`):
```json
{
  "id": "e8d47228-3e9a-4712-bf23-8cfb8a07c391",
  "items": [],
  "total_price": 0.0,
  "created_at": "2026-09-03T11:45:00Z"
}
```

---

## 2. Retrieve Cart Contents

### `GET /api/v1/store/carts/{id}/`
Returns the complete cart drawer breakdown with calculated unit prices and subtotals.

#### Success Response (`200 OK`):
```json
{
  "id": "e8d47228-3e9a-4712-bf23-8cfb8a07c391",
  "items": [
    {
      "id": 102,
      "product": {
        "id": 12,
        "title": "Velvet Matte Lipstick",
        "unit_price": 850.0,
        "discount_percent": 10.0,
        "discounted_price": 765.0,
        "images": [
          { "image": "/media/store/images/lipstick_red.jpg" }
        ]
      },
      "variant": {
        "id": 4,
        "name": "Shade 01 Ruby",
        "color_code": "#D10024",
        "price_override": null,
        "discounted_price": 765.0
      },
      "quantity": 2,
      "total_price": 1530.0
    }
  ],
  "total_price": 1530.0
}
```

---

## 3. Add Item to Cart

### `POST /api/v1/store/carts/{cart_pk}/items/`
Adds a product or shade variant to the designated cart session. If the item already exists in the cart, its quantity is incremented.

* **Who Can Use:** Public

#### Request Body:
```json
{
  "product_id": 12,
  "variant_id": 4,   // optional: omit if base product has no shades
  "quantity": 2
}
```

#### Success Response (`201 Created`):
```json
{
  "id": 102,
  "product_id": 12,
  "variant_id": 4,
  "quantity": 2
}
```

#### Error Responses:
* **`400 Bad Request`** (Insufficient stock):
```json
{
  "error": "Only 1 units available in inventory for this shade."
}
```

---

## 4. Update Cart Item Quantity

### `PATCH /api/v1/store/carts/{cart_pk}/items/{id}/`
Updates the purchased unit quantity for an existing cart item.

#### Request Body:
```json
{
  "quantity": 3
}
```

#### Success Response (`200 OK`):
```json
{
  "id": 102,
  "quantity": 3
}
```

---

## 5. Validate Promotional Coupon

### `POST /api/v1/store/coupons/validate/`
Verifies if a coupon promo code is active and calculates the monetary discount in Taka.

* **Who Can Use:** Public

#### Request Body:
```json
{
  "code": "SUMMER20",
  "cart_id": "e8d47228-3e9a-4712-bf23-8cfb8a07c391"
}
```

#### Success Response (`200 OK`):
```json
{
  "valid": true,
  "code": "SUMMER20",
  "discount_percent": 20.0,
  "discount_amount": 306.0,
  "message": "Coupon applied! 20% discount added to your cart."
}
```

#### Error Responses:
* **`400 Bad Request`** (Expired or invalid code):
```json
{
  "valid": false,
  "error": "Coupon code is invalid or has expired."
}
```

---

## 6. Conditional Delivery Rules

### `GET /api/v1/store/delivery-rules/`
Lists all automated delivery rules that trigger Free or Reduced shipping based on spend or item quantity.

* **Who Can Use:** Public / Staff

#### Success Response (`200 OK`):
```json
[
  {
    "id": 1,
    "title": "Free Delivery on Orders Over ৳1500",
    "target_type": "order_total", // 'product', 'collection', 'order_total'
    "rule_type": "free",          // 'free' (৳0) or 'reduced'
    "inside_dhaka_charge": "0.00",
    "outside_dhaka_charge": "0.00",
    "min_order_amount": "1500.00",
    "min_quantity": 1,
    "is_active": true
  },
  {
    "id": 2,
    "title": "Buy 3 Lipsticks for ৳30 Shipping",
    "target_type": "collection",
    "collection": 2,
    "rule_type": "reduced",
    "inside_dhaka_charge": "30.00",
    "outside_dhaka_charge": "50.00",
    "min_quantity": 3,
    "is_active": true
  }
]
```

### `POST /api/v1/store/delivery-rules/`
Creates a new dynamic delivery rule promotion.

* **Who Can Use:** Staff Only (`IsAdminUser`)
