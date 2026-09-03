# Logistics & Parcel Tracking API

**Base Path:** `/api/v1/store/` (and `/store/`)  
**Authentication:** Authenticated for tracking customer orders; Staff Only for dispatching parcels, updating fulfillment milestones, and managing courier provider gateways.

---

## Index

| # | Endpoint | Method | Who Can Use | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `orders/<id>/dispatch_courier/` | POST | Staff Only | Assign courier partner, set initial milestone, and record tracking code |
| 2 | `orders/<id>/update_tracking/` | PATCH | Staff Only | Update parcel delivery milestone and tracking code |
| 3 | `orders/<id>/` | GET | Customer / Staff | Customer retrieves parcel tracking status, milestone, and provider URL |
| 4 | `courier-providers/` | GET | Staff / Read | List all delivery partners (Steadfast, Pathao, RedX, Paperfly, Manual) |
| 5 | `courier-providers/` | POST | Staff Only | Register and configure a new delivery partner API |
| 6 | `courier-providers/<id>/` | PATCH / DELETE | Staff Only | Update provider API credentials or remove delivery partner |
| 7 | `courier-providers/<id>/test_connection/` | POST | Staff Only | Validate API credentials and live connection with courier gateway |

---

## 1. Dispatch Order to Courier

### `POST /api/v1/store/orders/{id}/dispatch_courier/`
Dispatches an order to an integrated courier partner or manual delivery runner. Auto-generates a formatted tracking code if left blank.

* **Who Can Use:** Staff Only (`IsAdminUser`)
* **Tracking Status Choices:** `pending`, `packed`, `in_transit`, `out_for_delivery`, `delivered`, `returned`

#### Request Body:
```json
{
  "courier_id": 1,                       // ID of active CourierProvider (or null for manual)
  "tracking_code": "STEAD-142-1725345",  // optional: leave empty to auto-generate
  "tracking_status": "in_transit"        // optional: defaults to 'in_transit'
}
```

#### Success Response (`200 OK`):
```json
{
  "id": 142,
  "customer_name": "rahim_uddin",
  "payment_status": "P",
  "delivery_charge": "60.00",
  "tracking_code": "STEAD-142-1725345",
  "tracking_status": "in_transit",
  "tracking_status_display": "Dispatched / In Transit",
  "courier_consignment_id": "STEAD-142-1725345",
  "courier_partner": 1,
  "courier_partner_details": {
    "id": 1,
    "name": "Steadfast Courier",
    "provider_code": "steadfast",
    "tracking_url_template": "https://steadfast.com.bd/t/{tracking_code}"
  },
  "courier_response": {
    "dispatched_at": "2026-09-03T12:05:00Z",
    "provider": "Steadfast Courier",
    "provider_code": "steadfast",
    "status": "Dispatched Successfully"
  }
}
```

#### Error Responses:
* **`400 Bad Request`** (Prepaid bKash/Nagad payment not marked Complete):
```json
{
  "error": "Cannot dispatch or track this order. bKash payment status must be marked as Complete first."
}
```
* **`404 Not Found`**:
```json
{
  "error": "Active courier partner not found."
}
```

---

## 2. Update Delivery Milestone

### `PATCH /api/v1/store/orders/{id}/update_tracking/`
Updates the fulfillment stage as the parcel moves through the courier network.

* **Who Can Use:** Staff Only

#### Request Body:
```json
{
  "tracking_status": "delivered",
  "tracking_code": "STEAD-142-1725345"
}
```

#### Success Response (`200 OK`):
```json
{
  "id": 142,
  "tracking_status": "delivered",
  "tracking_status_display": "Delivered"
}
```

---

## 3. List Courier Providers

### `GET /api/v1/store/courier-providers/`
Lists all courier partners configured in the merchant portal.

* **Who Can Use:** Authenticated Staff

#### Success Response (`200 OK`):
```json
[
  {
    "id": 1,
    "name": "Steadfast Courier",
    "provider_code": "steadfast",
    "provider_code_display": "Steadfast Courier",
    "api_key": "stf_live_8974****************",
    "secret_key": null,
    "client_id": null,
    "base_url": "https://portal.steadfast.com.bd/api/v1",
    "tracking_url_template": "https://steadfast.com.bd/t/{tracking_code}",
    "is_active": true,
    "is_sandbox": false,
    "notes": "Primary nationwide courier partner."
  },
  {
    "id": 2,
    "name": "Pathao Courier",
    "provider_code": "pathao",
    "provider_code_display": "Pathao Courier",
    "api_key": "pth_live_3829****************",
    "secret_key": "pth_sec_9918****************",
    "client_id": "merchant_48102",
    "base_url": "https://api-hermes.pathao.com",
    "tracking_url_template": "https://pathao.com/track/{tracking_code}",
    "is_active": true,
    "is_sandbox": false,
    "notes": "Express Inside Dhaka deliveries."
  }
]
```

---

## 4. Test Courier Gateway Connection

### `POST /api/v1/store/courier-providers/{id}/test_connection/`
Tests API credentials and validates gateway connectivity with the delivery provider.

* **Who Can Use:** Staff Only

#### Request Body:
*None (provider ID in URL)*

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "message": "Steadfast Courier API credentials validated successfully! Endpoint: https://portal.steadfast.com.bd/api/v1"
}
```

#### Error Response (`400 Bad Request`):
```json
{
  "success": false,
  "message": "API Key is missing for Steadfast Courier. Please enter your API Key."
}
```
