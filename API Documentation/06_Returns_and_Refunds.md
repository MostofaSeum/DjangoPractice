# Returns & Refunds API

**Base Path:** `/api/v1/store/return-requests/` (and `/store/return-requests/`)  
**Authentication:** Authenticated Customer for filing returns; Staff Only for reviewing claims, decisions, and processing refunds.

---

## Index

| # | Endpoint | Method | Who Can Use | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `return-requests/` | GET | Customer / Staff | List return claims (Customer sees their own; Staff sees all) |
| 2 | `return-requests/` | POST | Customer | Submit a new return request with proof photos and items |
| 3 | `return-requests/<id>/` | GET | Customer / Staff | Retrieve single return request details, photos, and item list |
| 4 | `return-requests/<id>/approve_return/` | POST | Staff Only | Approve claim: auto-restocks inventory, locks request, and auto-credits VibeCoin |
| 5 | `return-requests/<id>/reject_return/` | POST | Staff Only | Reject claim: locks request with staff reasoning note (max 200 words) |
| 6 | `return-requests/<id>/process_refund/` | POST | Staff Only | Record MFS refund disbursement (bKash/Nagad TrxID) and mark completed |

---

## 1. Submit a Return Request

### `POST /api/v1/store/return-requests/`
Submits an itemized return and refund claim for a delivered order. Supports multi-part photo uploads.

* **Who Can Use:** Authenticated Customer (`Authorization: JWT <token>`)
* **Eligibility Rule:** Order `tracking_status` must be `'delivered'`.
* **Constraint:** Exactly one active return request allowed per order.
* **Content-Type:** `multipart/form-data`

#### Form-Data Parameters:
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `order_id` | integer | Yes | ID of the delivered order |
| `reason` | string | Yes | `'damaged'`, `'wrong_item'`, `'not_as_described'`, `'missing_items'`, `'size_fit'`, `'other'` |
| `customer_note` | string | No | Explanation of the defect or issue |
| `refund_method` | string | Yes | `'vibecoin'` (Instant Store Credit), `'bkash'`, or `'nagad'` |
| `refund_account_number` | string | No | Required if refund method is `bkash` or `nagad` |
| `proof_image_1` | file | No | Primary proof photo attachment |
| `proof_image_2` | file | No | Second proof photo attachment |
| `proof_image_3` | file | No | Third proof photo attachment |
| `items` | JSON string | No | Array of objects: `[{"order_item_id": 204, "quantity": 1}]` (defaults to all order items if omitted) |

#### Success Response (`201 Created`):
```json
{
  "id": 8,
  "order": 142,
  "customer": 8,
  "customer_name": "rahim_uddin",
  "customer_phone": "+8801712345678",
  "status": "pending",
  "status_display": "Return Requested",
  "reason": "damaged",
  "reason_display": "Damaged / Defective Product",
  "customer_note": "Lipstick was broken on arrival.",
  "refund_method": "vibecoin",
  "refund_method_display": "VibeCoin Wallet (Instant Store Credit)",
  "refund_account_number": "",
  "refund_amount": "765.00",
  "admin_note": "",
  "refund_transaction_id": "",
  "proof_image_1": "/media/returns/proofs/proof1.jpg",
  "proof_image_2": null,
  "proof_image_3": null,
  "created_at": "2026-09-03T12:10:00Z",
  "items": [
    {
      "id": 14,
      "order_item_id": 204,
      "product_title": "Velvet Matte Lipstick",
      "variant_name": "Shade 01 Ruby",
      "quantity": 1,
      "unit_price": "765.00",
      "refund_amount": "765.00"
    }
  ]
}
```

#### Error Responses:
* **`400 Bad Request`** (Order not yet delivered):
```json
{
  "error": "Return requests can only be placed on delivered orders."
}
```
* **`400 Bad Request`** (Duplicate in-progress claim):
```json
{
  "error": "A return request is already in progress for this order."
}
```

---

## 2. Approve Return Request

### `POST /api/v1/store/return-requests/{id}/approve_return/`
Approves a customer return claim.
* **Side Effect 1:** Automatically restores inventory counts to both parent `Product` and specific `ProductVariant`.
* **Side Effect 2:** If `refund_method` is `vibecoin`, automatically credits the customer's wallet balance.
* **Side Effect 3:** **One-Way Decision Locking:** Permanently locks the claim against rejection.

* **Who Can Use:** Staff Only (`IsAdminUser`)
* **Validation:** `admin_note` is capped at 200 words max.

#### Request Body:
```json
{
  "admin_note": "Inspection photo confirmed broken lipstick. Return approved and scheduled for pickup."
}
```

#### Success Response (`200 OK`):
```json
{
  "id": 8,
  "status": "approved",
  "status_display": "Return Approved & Pickup Scheduled",
  "admin_note": "Inspection photo confirmed broken lipstick. Return approved and scheduled for pickup.",
  "refund_amount": "765.00"
}
```

#### Error Responses:
* **`400 Bad Request`** (Decision already locked):
```json
{
  "error": "This return request is already approved and cannot be approved again."
}
```
* **`400 Bad Request`** (Note exceeds 200 words):
```json
{
  "error": "Admin note cannot exceed 200 words. Current: 235"
}
```

---

## 3. Reject Return Request

### `POST /api/v1/store/return-requests/{id}/reject_return/`
Rejects a customer return claim with staff justification.
* **Side Effect:** Permanently locks the request against future approval.

* **Who Can Use:** Staff Only
* **Validation:** `admin_note` is capped at 200 words max.

#### Request Body:
```json
{
  "admin_note": "Item seal was broken and partially consumed. Ineligible for return per cosmetics hygiene policy."
}
```

#### Success Response (`200 OK`):
```json
{
  "id": 8,
  "status": "rejected",
  "status_display": "Return Rejected",
  "admin_note": "Item seal was broken and partially consumed. Ineligible for return per cosmetics hygiene policy."
}
```

---

## 4. Process MFS Refund

### `POST /api/v1/store/return-requests/{id}/process_refund/`
Records a completed mobile financial service (bKash/Nagad) refund transaction.

* **Who Can Use:** Staff Only

#### Request Body:
```json
{
  "refund_amount": 765.00,
  "refund_transaction_id": "BKASH-REF-8829104",
  "admin_note": "Disbursed refund via bKash merchant portal."
}
```

#### Success Response (`200 OK`):
```json
{
  "id": 8,
  "status": "refunded",
  "status_display": "Returned & Refund Completed",
  "refund_transaction_id": "BKASH-REF-8829104",
  "refund_amount": "765.00",
  "refunded_at": "2026-09-03T12:15:20Z"
}
```
