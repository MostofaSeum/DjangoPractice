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
| 6 | `products/<id>/` | DELETE | Staff Only | Delete a product (protected against deletion if already ordered) |
| 7 | `products/export_csv/` | GET | Staff Only | Download full catalog as CSV spreadsheet |
| 8 | `products/bulk_import_csv/` | POST | Staff Only | Bulk upload and upsert products from CSV file |
| 9 | `products/bulk_upload_zip/` | POST | Staff Only | Bulk upload product images via ZIP archive matched by folder name/slug |
| 10 | `products/get_saved_sheet_url/` | GET | Staff Only | Retrieve connected Google Sheet URL & sync metadata |
| 11 | `products/save_google_sheet_url/` | POST | Staff Only | Save or update Google Sheet link singleton |
| 12 | `products/delete_saved_sheet_url/`| DELETE | Staff Only | Disconnect saved Google Sheet link |
| 13 | `products/sync_google_sheet/` | POST | Staff Only | Fetch public Google Sheet CSV and batch upsert catalog |
| 14 | `products/<product_pk>/variants/` | GET / POST | Public / Staff | List or add cosmetics shade/size variants |
| 15 | `products/<product_pk>/variants/<id>/` | GET / PATCH / DELETE | Public / Staff | Inspect, edit, or delete a shade variant |
| 16 | `products/<product_pk>/images/` | GET / POST | Public / Staff | List gallery images or upload photo |
| 17 | `products/<product_pk>/images/<id>/` | DELETE | Staff Only | Delete image asset from media storage |
| 18 | `collections/` | GET / POST | Public / Staff | List collections or create new category |
| 19 | `collections/<id>/` | GET / PATCH / DELETE | Public / Staff | Get, edit, or delete collection (supports `?include_products=true`) |
| 20 | `reviews/` | GET / POST | Public / Auth | List verified reviews or submit feedback with photo |

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
      "total_inventory": 65, // Sum of active variant stocks if variants exist; otherwise base inventory
      "collection": 2,
      "collection_title": "Lip Care",
      "is_photos_published": true,
      "is_trending": true,
      "is_visible": true,
      "units_sold": 38, // Units sold across valid orders (automatically excludes cancelled & failed orders)
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

#### Error Responses:
* **`400 Bad Request`** (Validation failed):
```json
{
  "title": ["This field is required."],
  "unit_price": ["Ensure this value is greater than or equal to 1.00."],
  "inventory": ["Ensure this value is greater than or equal to 0."]
}
```
* **`400 Bad Request`** (Invalid collection reference):
```json
{
  "collection": ["Invalid pk \"99\" - object does not exist."]
}
```

---

## 3. Delete Product (Order Protection)

### `DELETE /api/v1/store/products/{id}/`
Deletes a product from the catalog. Protected if customers have already purchased it.

* **Who Can Use:** Staff Only

#### Success Response (`204 No Content`):
*No content returned.*

#### Error Response:
* **`405 Method Not Allowed`** (Associated with customer orders):
```json
{
  "error": "Product cannot be deleted because it is associated with an order item."
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

#### Error Responses:
* **`400 Bad Request`** (Invalid sheet URL):
```json
{
  "error": "Failed to extract Google Sheet ID. Please provide a valid shareable spreadsheet URL."
}
```
* **`400 Bad Request`** (Sheet sharing permission error):
```json
{
  "error": "Failed to fetch Google Sheet. Make sure the sheet sharing is set to 'Anyone with the link can view'."
}
```
* **`400 Bad Request`** (Missing required header column):
```json
{
  "error": "Sync failed: Invalid document structure: Missing required 'title' column in the header.",
  "details": [
    "Invalid document structure: Missing required 'title' column in the header."
  ]
}
```

---

### `POST /api/v1/store/products/bulk_import_csv/`
Uploads and imports catalog products and variants from a CSV file.

* **Who Can Use:** Staff Only
* **Content-Type:** `multipart/form-data`

#### Success Response (`200 OK`):
```json
{
  "created_count": 5,
  "updated_count": 12,
  "errors": []
}
```

#### Error Response:
* **`400 Bad Request`** (No file uploaded):
```json
{
  "error": "CSV file is required."
}
```

---

### `POST /api/v1/store/products/bulk_upload_zip/`
Uploads a ZIP archive containing folders of product photos, automatically mapping images to existing products by Folder Name / ID / Slug / Title. Supports up to 100MB ZIP files.

* **Who Can Use:** Staff Only (`IsAdminUser`)
* **Content-Type:** `multipart/form-data`
* **File Limit:** Up to 100MB archive (`DATA_UPLOAD_MAX_MEMORY_SIZE` & `FILE_UPLOAD_MAX_MEMORY_SIZE`)
* **Max Images Stored:** Up to 5 images per product (replaces or fills available slots)

#### Expected ZIP Folder Structure:
```
archive.zip
  ├── Nivea_Shea_Lotion/
  │     ├── photo1.jpg
  │     └── photo2.webp
  ├── 14/                          (Matched by product ID)
  │     └── swatch.png
  └── velvet-matte-lipstick/       (Matched by product slug)
        └── promo.jpg
```

#### Request Payload:
* `file`: Binary ZIP file

#### Success Response (`200 OK`):
```json
{
  "message": "Successfully uploaded 14 image(s) for 6 product(s).",
  "matched_products_count": 6,
  "total_images_uploaded": 14,
  "unmatched_folders": [],
  "details": [
    "Nivea Shea Lotion: 2 photo(s)",
    "Velvet Matte Lipstick: 3 photo(s)"
  ]
}
```

#### Error Responses:
* **`400 Bad Request`** (Missing file):
```json
{
  "error": "ZIP file is required."
}
```
* **`400 Bad Request`** (Not a .zip archive):
```json
{
  "error": "Uploaded file must be a .zip archive."
}
```
* **`400 Bad Request`** (No matching folders or valid images):
```json
{
  "error": "No valid product folders or image files found in the ZIP archive. Ensure images are inside folders named after your products (e.g., Nivea_Shea_Lotion/photo1.jpg)."
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

#### Error Response:
* **`400 Bad Request`** (Validation error):
```json
{
  "name": ["This field is required."],
  "inventory": ["Ensure this value is greater than or equal to 0."]
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

### `GET /api/v1/store/collections/{id}/`
Retrieves single collection metadata. When `?include_products=true` is passed, returns full product listings with images and shade variants for the collection showcase page.

* **Who Can Use:** Public (Hidden collections accessible only to Staff)
* **Query Parameters:**
  * `include_products`: boolean (`true` or `false`)

#### Success Response (`200 OK` with `?include_products=true`):
```json
{
  "id": 1,
  "title": "Beauty",
  "featured_product": null,
  "image": "/media/store/collections/images/beauty_banner.webp",
  "is_visible": true,
  "products": [
    {
      "id": 4,
      "title": "Velvet Matte Lipstick",
      "slug": "velvet-matte-lipstick",
      "unit_price": "850.00",
      "discount_percent": "10.00",
      "discounted_price": "765.00",
      "is_discount_active": true,
      "inventory": 45,
      "total_inventory": 65,
      "collection": 1,
      "collection_title": "Beauty",
      "is_photos_published": true,
      "is_trending": true,
      "is_visible": true,
      "images": [
        {
          "id": 12,
          "image": "/media/store/images/lipstick_red.jpg"
        }
      ],
      "variants": []
    }
  ]
}
```

### `DELETE /api/v1/store/collections/{id}/`
Deletes a collection. Protected if products are currently assigned to it.

* **Who Can Use:** Staff Only

#### Success Response (`204 No Content`):
*No content returned.*

#### Error Response:
* **`405 Method Not Allowed`** (Collection contains products):
```json
{
  "error": "Collection cannot be deleted because it includes one or more products."
}
```

---

## 8. Product Reviews & Ratings

### `GET /api/v1/store/reviews/` or `GET /api/v1/store/products/{product_pk}/reviews/`
Lists reviews for all products or scoped to a specific product. Supports filtering by rating star, search, and date/rating ordering.

* **Who Can Use:** Public
* **Query Parameters:**
  * `rating`: integer (`1` to `5`)
  * `search`: string (matches reviewer name, product title, or review text)
  * `ordering`: `-date`, `date`, `-rating`, `rating`

#### Success Response (`200 OK`):
```json
[
  {
    "id": 18,
    "user_id": 14,
    "product": 12,
    "product_title": "Velvet Matte Lipstick",
    "name": "Rahim Uddin",
    "rating": 5,
    "description": "Incredible texture and long-lasting pigmentation!",
    "image": "/media/store/reviews/swatch.jpg",
    "images": [
      { "id": 1, "image": "/media/store/reviews/swatch.jpg" }
    ],
    "date": "2026-09-02"
  }
]
```

---

### `POST /api/v1/store/products/{product_pk}/reviews/`
Submits a review for a specific product. Supports multi-image photo uploads (up to 5 images).

* **Who Can Use:** Public / Authenticated (If authenticated, automatically links to customer account)
* **Content-Type:** `multipart/form-data` or `application/json`

#### Form-Data / JSON Fields:
* `name`: String (Required, reviewer display name)
* `rating`: Integer (Required, `1` to `5`)
* `description`: String (Required, review text)
* `images`: File list (Optional, up to 5 image attachments)

#### Success Response (`201 Created`):
*Returns created `Review` object.*

---

### `PATCH /api/v1/store/reviews/{id}/`
Updates an existing review's rating, description, or modifies attached photos.

* **Who Can Use:** Author of the review or Staff (`IsAdminUser`)
* **Permission Check:** Users can only edit their own reviews.

#### Request Body:
```json
{
  "rating": 4,
  "description": "Updated review text.",
  "deleted_image_ids": [1]
}
```

#### Success Response (`200 OK`):
*Returns updated `Review` object.*

---

### `DELETE /api/v1/store/reviews/{id}/`
Deletes a review and removes attached images.

* **Who Can Use:** Author of the review or Staff (`IsAdminUser`)

#### Success Response:
`204 No Content`

---

## 9. Top-Level Product Variants Management

### `GET /api/v1/store/variants/`
Directly lists all product shade and size variants across the catalog.

* **Who Can Use:** Public / Staff

#### Success Response (`200 OK`):
```json
[
  {
    "id": 4,
    "product": 12,
    "product_title": "Velvet Matte Lipstick",
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
```

---

### `POST /api/v1/store/variants/`
Creates a variant directly.

* **Who Can Use:** Staff Only (`IsAdminUser`)

#### Request Body:
```json
{
  "product": 12,
  "name": "Shade 02 Berry",
  "color_name": "Deep Berry",
  "color_code": "#8B004F",
  "size": "3.5g",
  "inventory": 25,
  "is_active": true
}
```

#### Success Response (`201 Created`):
*Returns created `ProductVariant` object.*

---

### `PATCH /api/v1/store/variants/{id}/`
Updates inventory, color code, or price override of a variant.

#### Success Response (`200 OK`):
*Returns updated `ProductVariant` object.*

---

### `DELETE /api/v1/store/variants/{id}/`
Removes a variant.

#### Success Response:
`204 No Content`
