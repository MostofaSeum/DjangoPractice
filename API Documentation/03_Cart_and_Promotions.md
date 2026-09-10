# Cart, Promotions, Coupons & Delivery Rules API

**Base Path:** `/api/v1/store/` (and `/store/`)  
**Authentication:** Public for cart drawer, coupon validation, and delivery rules; Authenticated for cart syncing; Staff Only for creating promotions, coupon codes, and delivery rules.

---

## Index

| # | Endpoint | Method | Who Can Use | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `carts/` | POST | Public / Guest | Initialize a new shopping cart instance (returns UUID token) |
| 2 | `carts/<id>/` | GET | Public / Guest | Retrieve cart subtotal, item list, and calculated line item prices |
| 3 | `carts/<id>/` | DELETE | Public / Guest | Clear or delete an active cart session |
| 4 | `carts/sync/` | GET / POST | Authenticated | Synchronize guest cart into authenticated customer profile upon login |
| 5 | `carts/<cart_pk>/items/` | GET | Public | List all items inside a specific cart |
| 6 | `carts/<cart_pk>/items/` | POST | Public | Add a product or specific cosmetic shade variant to cart |
| 7 | `carts/<cart_pk>/items/<id>/` | PATCH | Public | Update quantity of a cart item |
| 8 | `carts/<cart_pk>/items/<id>/` | DELETE | Public | Remove an item from the cart |
| 9 | `promotions/` | GET / POST | Public / Staff | List active campaign promotions or create a promotion record |
| 10 | `promotions/<id>/` | GET / PUT / PATCH / DELETE | Public / Staff | Retrieve, edit, or delete a campaign promotion |
| 11 | `promotions/apply/` | POST | Public / Staff | Bulk apply discount percentage to specific products or collection |
| 12 | `promotions/remove/` | POST | Public / Staff | Bulk remove active discounts from `'all'`, `'collection'`, or `'product'` |
| 13 | `coupons/` | GET / POST | Public / Staff | List all coupons or create a new coupon promo code |
| 14 | `coupons/<id>/` | GET / PUT / PATCH / DELETE | Public / Staff | Inspect, update, or delete a coupon |
| 15 | `coupons/validate/` | POST | Public | Validate promotional coupon code and calculate discount on cart |
| 16 | `delivery-rules/` | GET / POST | Public / Staff | List or configure conditional free/reduced shipping rules |
| 17 | `delivery-rules/<id>/` | GET / PUT / PATCH / DELETE | Public / Staff | Inspect, edit, or delete a conditional delivery rule |

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

## 3. Synchronize Guest Cart on Login

### `POST /api/v1/store/carts/sync/` (also supports `GET`)
Transfers and merges items from an anonymous/guest cart session into the logged-in customer's persistent cart. If the user already has items in their cart, matching items have their quantities combined.

* **Who Can Use:** Authenticated Customer (`Authorization: JWT <token>`)

#### Request Body (or query parameter `?cart_id=`):
```json
{
  "cart_id": "e8d47228-3e9a-4712-bf23-8cfb8a07c391"
}
```

#### Success Response (`200 OK`):
```json
{
  "id": "a3b19402-9844-4321-bf99-8cfb8a07c999",
  "items": [
    {
      "id": 102,
      "product": {
        "id": 12,
        "title": "Velvet Matte Lipstick",
        "unit_price": 850.0,
        "discount_percent": 10.0,
        "discounted_price": 765.0
      },
      "variant": {
        "id": 4,
        "name": "Shade 01 Ruby"
      },
      "quantity": 3,
      "total_price": 2295.0
    }
  ],
  "total_price": 2295.0
}
```

---

## 4. Add Item to Cart

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

## 5. Update Cart Item Quantity

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

## 6. Delete Cart Item

### `DELETE /api/v1/store/carts/{cart_pk}/items/{id}/`
Removes an item completely from the cart.

#### Success Response:
`204 No Content`

---

## 7. Bulk Promotions Management

### `GET /api/v1/store/promotions/`
Lists all campaign promotion banners and discount records.

* **Who Can Use:** Public / Staff

#### Success Response (`200 OK`):
```json
[
  {
    "id": 1,
    "description": "Eid Mega Sale (20% OFF)",
    "discount": "20.00",
    "valid_until": "2026-12-31T23:59:59Z",
    "created_at": "2026-09-01T10:00:00Z"
  }
]
```

---

### `POST /api/v1/store/promotions/apply/`
Bulk applies discount percentages to a category (`collection`) or targeted list of products (`product_ids`). Automatically updates product pricing and records a promotion log.

* **Who Can Use:** Staff / Admin

#### Request Body (Collection Discount):
```json
{
  "target_type": "collection",
  "collection_id": 2,
  "discount_percent": 15,
  "valid_until": "2026-12-31T23:59:59Z",
  "description": "15% off all Lip Care products"
}
```

#### Request Body (Selected Products Discount):
```json
{
  "target_type": "products",
  "product_ids": [12, 14, 18],
  "discount_percent": 20,
  "valid_until": "2026-12-31T23:59:59Z",
  "description": "Summer Skincare Glow Promo"
}
```

#### Success Response (`200 OK`):
```json
{
  "message": "Successfully applied 20% discount to 3 product(s).",
  "promotion": {
    "id": 2,
    "description": "Summer Skincare Glow Promo",
    "discount": "20.00",
    "valid_until": "2026-12-31T23:59:59Z",
    "created_at": "2026-09-10T12:00:00Z"
  },
  "updated_count": 3
}
```

---

### `POST /api/v1/store/promotions/remove/`
Bulk resets and removes active discounts.

* **Who Can Use:** Staff / Admin

#### Request Body Choices:
* **Remove all discounts from the entire store:**
  ```json
  { "target_type": "all" }
  ```
* **Remove discount from a collection:**
  ```json
  { "target_type": "collection", "collection_id": 2 }
  ```
* **Remove discount from a single product:**
  ```json
  { "target_type": "product", "product_id": 12 }
  ```

#### Success Response (`200 OK`):
```json
{
  "message": "Successfully removed all active promotions from 18 product(s).",
  "updated_count": 18
}
```

---

## 8. Coupons Management

### `GET /api/v1/store/coupons/`
Lists all promotional coupon discount codes.

* **Who Can Use:** Staff Only (`IsAdminUser`)

#### Success Response (`200 OK`):
```json
[
  {
    "id": 1,
    "code": "SUMMER20",
    "discount_percent": 20.0,
    "valid_from": "2026-06-01T00:00:00Z",
    "valid_to": "2026-12-31T23:59:59Z",
    "target_type": "all",
    "collection": null,
    "collection_title": null,
    "product_count": 0,
    "products_details": [],
    "is_active": true,
    "created_at": "2026-06-01T00:00:00Z"
  }
]
```

---

### `POST /api/v1/store/coupons/`
Creates a new coupon code with targeting (`all`, `collection`, or `product`).

* **Who Can Use:** Staff Only (`IsAdminUser`)

#### Request Body:
```json
{
  "code": "GLAM15",
  "discount_percent": 15.0,
  "valid_from": "2026-09-01T00:00:00Z",
  "valid_to": "2026-12-31T23:59:59Z",
  "target_type": "collection",
  "collection": 2,
  "is_active": true
}
```

#### Success Response (`201 Created`):
*Returns created `Coupon` object.*

---

## 9. Validate Promotional Coupon

### `POST /api/v1/store/coupons/validate/`
Verifies if a coupon promo code is active, checks eligibility against cart items, and calculates the monetary discount in Taka.

* **Who Can Use:** Public

#### Request Body:
```json
{
  "code": "SUMMER20",
  "cart_items": [
    {
      "product_id": 12,
      "quantity": 2
    }
  ]
}
```

#### Success Response (`200 OK`):
```json
{
  "valid": true,
  "code": "SUMMER20",
  "discount_percent": 20.0,
  "target_type": "all",
  "applicable_product_ids": [12],
  "message": "Coupon \"SUMMER20\" applied! 20% discount applied on eligible item(s)."
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
* **`400 Bad Request`** (Ineligible items):
```json
{
  "valid": false,
  "error": "Coupon \"GLAM15\" is only valid for items in the \"Lip Care\" collection."
}
```

---

## 10. Conditional Delivery Rules

### `GET /api/v1/store/delivery-rules/`
Lists all automated delivery rules that trigger Free or Reduced shipping based on spend or item quantity.

* **Who Can Use:** Public / Staff

#### Success Response (`200 OK`):
```json
[
  {
    "id": 1,
    "title": "Free Delivery on Orders Over ৳1500",
    "target_type": "order_total",
    "rule_type": "free",
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

---

### `POST /api/v1/store/delivery-rules/`
Creates a new dynamic delivery rule promotion.

* **Who Can Use:** Staff Only (`IsAdminUser`)

#### Request Body:
```json
{
  "title": "Free Nationwide Shipping for Skincare",
  "target_type": "collection",
  "collection": 1,
  "rule_type": "free",
  "inside_dhaka_charge": 0.00,
  "outside_dhaka_charge": 0.00,
  "min_quantity": 2,
  "is_active": true
}
```

#### Success Response (`201 Created`):
*Returns created `DeliveryRule` object.*

---

### `PATCH /api/v1/store/delivery-rules/{id}/`
Updates an existing delivery rule.

#### Request Body:
```json
{
  "is_active": false
}
```

#### Success Response (`200 OK`):
*Returns updated `DeliveryRule` object.*

---

### `DELETE /api/v1/store/delivery-rules/{id}/`
Removes a delivery rule.

#### Success Response:
`204 No Content`
