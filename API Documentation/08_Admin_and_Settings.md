# Admin, Settings & Store Operations API

**Base Path:** `/api/v1/store/` (and `/store/`)  
**Authentication:** Public for reading site branding and delivery rates; Staff Only for updates, notification clearing, and audit inspections.

---

## Index

| # | Endpoint | Method | Who Can Use | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `site-settings/` | GET | Public | Retrieve active store title, tagline, logo, currency, and footer links |
| 2 | `site-settings/update_settings/` | POST / PUT | Staff Only | Update branding identity, currency code, contact info, or upload logo |
| 3 | `site-settings/remove_logo/` | POST / DELETE | Staff Only | Delete active store logo from media storage and reset to default |
| 4 | `delivery-settings/` | GET | Public | Retrieve base regional logistics rates (Inside & Outside Dhaka) |
| 5 | `delivery-settings/` | POST | Staff Only | Update default delivery fees and ETAs |
| 6 | `payment-settings/` | GET | Public | Retrieve merchant bKash/Nagad wallet numbers and active gateway flags |
| 7 | `payment-settings/` | POST | Staff Only | Toggle payment methods or update wallet contact numbers |
| 8 | `notifications/` | GET | Staff Only | Retrieve unread count and latest 50 order/system notifications |
| 9 | `notifications/<id>/mark_read/` | POST / PATCH | Staff Only | Mark a single notification as read |
| 10 | `notifications/mark_all_read/` | POST | Staff Only | Clear all unread notification badges |
| 11 | `audit-logs/` | GET | Staff Only | View administrative system modification logs |

---

## 1. Storefront Branding & Identity Settings

### `GET /api/v1/store/site-settings/`
Retrieves store brand metadata, active currency code, and customer care details.

* **Who Can Use:** Public

#### Success Response (`200 OK`):
```json
{
  "id": 1,
  "site_title": "VibeMart",
  "tagline": "MAKE-UP STYLE",
  "brand_description": "Curated cosmetics and skincare for beauty enthusiasts.",
  "logo": "/media/store/settings/logos/vibemart_logo.png",
  "currency_code": "BDT", // Choices: 'BDT', 'USD', 'EUR', 'GBP', 'INR', 'SAR', 'AED', 'CAD'
  "support_phone": "+880 1700-000000",
  "support_email": "support@vibemart.com",
  "store_address": "Homestead Gulshan Link Tower, Dhaka",
  "working_hours": "Sat - Thu: 10:00 - 18:00",
  "facebook_url": "https://facebook.com/vibemart",
  "instagram_url": "https://instagram.com/vibemart",
  "youtube_url": "https://youtube.com/@vibemart",
  "whatsapp_number": "+8801700000000",
  "footer_copyright": "© 2026 VIBEMART. ALL RIGHTS RESERVED.",
  "last_updated": "2026-09-03T10:00:00Z"
}
```

---

### `POST /api/v1/store/site-settings/update_settings/`
Updates website brand settings or uploads a new transparent logo.

* **Who Can Use:** Staff Only (`IsAdminUser`)
* **Content-Type:** `multipart/form-data` or `application/json`

#### Form-Data / JSON Fields:
* `site_title`: String (Max 15 chars)
* `tagline`: String (Max 30 chars)
* `brand_description`: String (Max 70 words)
* `currency_code`: String (`BDT`, `USD`, `EUR`, `GBP`, `INR`, `SAR`, `AED`, `CAD`)
* `support_phone`: String
* `support_email`: String (valid email)
* `logo`: File (Image upload)

#### Success Response (`200 OK`):
*Returns updated `SiteSetting` object.*

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

## 2. Base Regional Logistics Settings

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
