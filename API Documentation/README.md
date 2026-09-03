# VibeMart E-Commerce Platform — API Documentation
**Base URL:** `http://127.0.0.1:8000/api/v1/` (or legacy `/` routes)  
**Version:** `v1.0.0 (Production / MVP Release)`  
**Protocol:** `RESTful JSON over HTTPS`  
**Authentication Scheme:** `JWT (JSON Web Token)` passed in `Authorization: JWT <token>` header or automatic HttpOnly cookie credentials (`access_token`, `refresh_token`).

---

## Architecture & General Guidelines

### 1. Base URL & Versioning
All public storefront and administrative API endpoints are versioned under:
```
/api/v1/
```
*Backward-compatibility alias:* Endpoints are also mirrored without `/api/v1/` (e.g. `/store/products/`, `/auth/jwt/create/`) to ensure existing clients continue operating without interruption.

### 2. Authentication & Authorization
* **Public Endpoints:** Require no authorization header (e.g. browsing catalog, validating coupons, newsletter subscription, cart session).
* **Customer Endpoints:** Require `Authorization: JWT <access_token>` or active session cookie (e.g. order history, saving addresses, submitting return claims, redeeming gift cards).
* **Staff / Admin Endpoints:** Require an authenticated user with `is_staff = true` (e.g. dispatching orders, catalog CRUD, reviewing returns, bulk syncing).

### 3. Standard Response Format & Error Codes
* **`200 OK`**: Successful `GET`, `PUT`, or `PATCH` operation.
* **`201 Created`**: Successful `POST` entity creation.
* **`204 No Content`**: Successful `DELETE` operation.
* **`400 Bad Request`**: Validation error, missing required payload fields, or business rule violation.
* **`401 Unauthorized`**: Token missing, expired, or invalid.
* **`403 Forbidden`**: Authenticated user lacks necessary permissions (e.g., non-staff accessing admin portal).
* **`404 Not Found`**: Resource does not exist.
* **`429 Too Many Requests`**: Rate limit exceeded (10 req/min for auth endpoints, 100 req/min for anonymous users, 1,000 req/min for authenticated users).

---

## Module Index

| # | Module Documentation | File Name | Description |
| :--- | :--- | :--- | :--- |
| **01** | [Authentication & User Management](file:///d:/Brainicon%20Technology/storefront/API%20Documentation/01_Authentication.md) | `01_Authentication.md` | Email OTP registration, JWT login/refresh/logout, password reset, and user profile management. |
| **02** | [Catalog & Products](file:///d:/Brainicon%20Technology/storefront/API%20Documentation/02_Catalog_and_Products.md) | `02_Catalog_and_Products.md` | Product catalog, multi-option sorting, shade/size variants, galleries, reviews, Google Sheets & CSV bulk sync. |
| **03** | [Cart & Promotions](file:///d:/Brainicon%20Technology/storefront/API%20Documentation/03_Cart_and_Promotions.md) | `03_Cart_and_Promotions.md` | Guest/customer cart drawers, cart items, promotional coupon codes, and conditional delivery rules. |
| **04** | [Orders, Checkout & Addresses](file:///d:/Brainicon%20Technology/storefront/API%20Documentation/04_Orders_and_Checkout.md) | `04_Orders_and_Checkout.md` | Order placement, customer saved address book, MFS transaction auditing, and admin live order editing. |
| **05** | [Logistics & Parcel Tracking](file:///d:/Brainicon%20Technology/storefront/API%20Documentation/05_Logistics_and_Tracking.md) | `05_Logistics_and_Tracking.md` | Courier partner dispatch (Steadfast, Pathao, RedX, Paperfly, Manual), live customer milestone tracking, and provider connectivity test. |
| **06** | [Returns & Refunds](file:///d:/Brainicon%20Technology/storefront/API%20Documentation/06_Returns_and_Refunds.md) | `06_Returns_and_Refunds.md` | Customer return claim submission with photo proofs, refund channel selection, admin 1-way decision lock, and automated restock/VibeCoin credit. |
| **07** | [Gift Cards, Loyalty & Engagement](file:///d:/Brainicon%20Technology/storefront/API%20Documentation/07_GiftCards_and_Engagement.md) | `07_GiftCards_and_Engagement.md` | 16-character digital gift cards, redemption directly into customer VibeCoin wallets, wishlist bookmarks, and newsletter subscribers. |
| **08** | [Admin, Settings & Operations](file:///d:/Brainicon%20Technology/storefront/API%20Documentation/08_Admin_and_Settings.md) | `08_Admin_and_Settings.md` | Store identity branding & logo upload/delete, multi-currency Forex config, notification hub, base regional shipping rates, and audit logs. |
