# Catalog & Products API

**Base Path:** `/api/v1/store/` (and `/store/`)  
**Authentication:** Public for reading; Staff / Admin only for creation, modifications, and synchronization.

---

## Index

| # | Endpoint | Method | Who Can Use | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `products/` | GET | Public | List products with pagination, search, price filters, and sorting |
| 2 | `products/all/` | GET | Public / Staff | List unpaginated catalog items (for quick dropdowns & search suggestions) |
| 3 | `products/` | POST | Staff Only | Create a new product with base details |
| 4 | `products/<id>/` | GET | Public | Retrieve single product details with shade variants, reviews, and gallery |
| 5 | `products/<id>/` | PUT / PATCH | Staff Only | Update an existing product |
| 6 | `products/<id>/` | DELETE | Staff Only | Delete a product (protected if already ordered) |
| 7 | `products/export_csv/` | GET | Staff Only | Download full catalog as CSV spreadsheet |
| 8 | `products/bulk_import_csv/` | POST | Staff Only | Bulk upload and upsert products from CSV file |
| 9 | `products/get_saved_sheet_url/` | GET | Staff Only | Retrieve connected Google Sheet URL & sync metadata |
| 10 | `products/save_google_sheet_url/` | POST | Staff Only | Save or update Google Sheet link singleton |
| 11 | `products/delete_saved_sheet_url/`| DELETE | Staff Only | Disconnect saved Google Sheet link |
| 12 | `products/sync_google_sheet/` | POST | Staff Only | Fetch public Google Sheet CSV and batch upsert catalog |
| 13 | `products/<product_pk>/variants/` | GET / POST | Public / Staff | List or add cosmetics shade/size variants |
| 14 | `products/<product_pk>/variants/<id>/` | GET / PATCH / DELETE | Public / Staff | Inspect, edit, or delete a shade variant |
| 15 | `products/<product_pk>/images/` | GET / POST | Public / Staff | List gallery images or upload photo |
| 16 | `products/<product_pk>/images/<id>/` | DELETE | Staff Only | Delete image asset from media storage |
| 17 | `collections/` | GET / POST | Public / Staff | List collections or create new category |
| 18 | `collections/<id>/` | GET / PATCH / DELETE | Public / Staff | Get, edit, or delete collection |
| 19 | `reviews/` | GET / POST | Public / Auth | List verified reviews or submit feedback with photo |

---

## 1. List Products

### `GET /api/v1/store/products/`
Returns a paginated list of catalog products. Supports keyword search, price filtering, category filtering, and 7 sorting modes.

#### Query Filters:
| Filter | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `collection_id` | integer | `?collection_id=2` | Filter by category / collection |
| `search` | string | `?search=Lipstick` | Match product title or description |
| `unit_price__gt`| decimal | `?unit_price__gt=500` | Minimum price in Taka |
| `unit_price__lt`| decimal | `?unit_price__lt=2000`| Maximum price in Taka |
| `ordering` | string | `?ordering=-unit_price`| Sort option (see table below) |
| `page` | integer | `?page=2` | Page number (9 items per page) |

#### Sorting Modes (`ordering` param):
* `unit_price` (Price: Low to High)
* `-unit_price` (Price: High to Low)
* `id` (Product: Old First)
* `-id` (Product: New First / Default)
* `-popularity` (Popularity: Most Popular First)
* `popularity` (Popularity: Less Popular First)

#### Success Response (`200 OK`):
```json
{
  "count": 24,
  "next": "http://127.0.0.1:8000/api/v1/store/products/?page=2",
  "previous": null,
  "results": [
    {
      "id": 12,
      "title": "Velvet Matte Lipstick",
      "slug": "velvet-matte-lipstick",
      "short_description": "Long-lasting hydrating lipstick.",
      "description": "Rich pigmented color infused with vitamin E.",
      "unit_price": "850.00",
      "discount_percent": "10.00",
      "discounted_price": "765.00",
      "is_discount_active": true,
      "inventory": 45,
      "collection": 2,
      "collection_title": "Lip Care",
      "is_photos_published": true,
      "is_trending": true,
      "is_visible": true,
      "average_rating": 4.8,
      "review_count": 12,
      "images": [
        {
          "id": 1,
          "image": "/media/store/images/lipstick_red.jpg"
        }
      ],
      "variants": [
        {
          "id": 4,
          "name": "Shade 01 Ruby",
          "color_name": "Ruby Red",
          "color_code": "#D10024",
          "size": "3.5g",
          "price_override": null,
          "discounted_price": "765.00",
          "inventory": 20,
          "image": "/media/store/variants/ruby.jpg",
          "is_active": true
        }
      ]
    }
  ]
}
```

---

## 2. Create Product

### `POST /api/v1/store/products/`
Creates a new base product record.

* **Who Can Use:** Staff Only (`IsAdminUser`)

#### Request Body:
```json
{
  "title": "Hydra Glow Serum",
  "slug": "hydra-glow-serum",
  "collection": 1,
  "unit_price": 1250.00,
  "discount_percent": 0.00,
  "inventory": 50,
  "short_description": "Pure Hyaluronic acid moisture booster.",
  "description": "Deep hydrating serum for all skin types.",
  "is_trending": true,
  "is_visible": true
}
```

#### Success Response (`201 Created`):
*Returns full created product object.*

---

## 3. Single Product Details

### `GET /api/v1/store/products/{id}/`
Returns detailed information for a single product including all variants and customer reviews.

#### Success Response (`200 OK`):
```json
{
  "id": 12,
  "title": "Velvet Matte Lipstick",
  "slug": "velvet-matte-lipstick",
  "unit_price": "850.00",
  "discounted_price": "765.00",
  "inventory": 45,
  "images": [ ... ],
  "variants": [ ... ],
  "reviews": [ ... ]
}
```

---

## 4. Google Sheets & CSV Catalog Synchronization

### `POST /api/v1/store/products/sync_google_sheet/`
Parses and batch-upserts products, shade variants, and images directly from a live Google Sheet.

* **Who Can Use:** Staff Only

#### Request Body:
```json
{
  "sheet_url": "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing"
}
```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "message": "Successfully synchronized catalog! 15 products updated, 3 created.",
  "created_count": 3,
  "updated_count": 15,
  "last_synced_at": "2026-09-03T11:20:00Z"
}
```

### `GET /api/v1/store/products/get_saved_sheet_url/`
Returns the currently connected Google Sheet URL configuration singleton.

#### Success Response (`200 OK`):
```json
{
  "sheet_url": "https://docs.google.com/spreadsheets/d/...",
  "last_synced_at": "2026-09-03T11:20:00Z"
}
```

---

## 5. Shade & Size Variants

### `POST /api/v1/store/products/{product_pk}/variants/`
Adds a specific shade variant to an existing product.

* **Who Can Use:** Staff Only

#### Request Body:
```json
{
  "name": "Shade 04 Plum Berry",
  "color_name": "Plum",
  "color_code": "#581845",
  "size": "4ml",
  "price_override": 890.00,
  "inventory": 15,
  "is_active": true
}
```

#### Success Response (`201 Created`):
```json
{
  "id": 18,
  "product": 12,
  "name": "Shade 04 Plum Berry",
  "color_name": "Plum",
  "color_code": "#581845",
  "size": "4ml",
  "price_override": "890.00",
  "discounted_price": "890.00",
  "inventory": 15,
  "is_active": true
}
```

---

## 6. Collections & Categories

### `GET /api/v1/store/collections/`
Lists all cosmetics categories with item counts and banner images.

#### Success Response (`200 OK`):
```json
[
  {
    "id": 1,
    "title": "Skincare",
    "image": "/media/store/collections/images/skincare_banner.webp",
    "is_featured": true,
    "is_visible": true,
    "products_count": 32
  },
  {
    "id": 2,
    "title": "Lip Care",
    "image": "/media/store/collections/images/lips.webp",
    "is_featured": false,
    "is_visible": true,
    "products_count": 18
  }
]
```
