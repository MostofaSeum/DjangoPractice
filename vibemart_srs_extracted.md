1. Document Information

Product Name: VibeMart

Document Name: Software Requirements Specification (SRS)

Version: 1.0 (MVP Release)

Author: Brainicon Technology

Date: August 20, 2026

Status: In Development

2. Introduction

2.1 Purpose

This Software Requirements Specification (SRS) defines the complete functional and non-functional requirements for VibeMart. It establishes an authoritative technical reference for developers, designers, project managers, and stakeholders to ensure seamless product delivery.

2.2 Product Overview

VibeMart is a specialized, e-commerce platform built for beauty, skincare, and cosmetics businesses. It provides a full-featured online storefront with dynamic cosmetics shade variants, an automated digital gift card engine, multi-channel payment integration (COD, bKash, Nagad, VibeCoin), flexible delivery rules, and an administrative portal for real-time operations and analytics.

2.3 Objectives

Eliminate Social Commerce Friction: Transition Facebook and Instagram (F-Commerce) cosmetics vendors into an automated, branded web storefront.

Streamline Shade Selection: Prevent customer confusion and shade mismatch errors through visual color selectors and real-time variant stock management.

Drive Upfront Revenue: Offer instant digital gift cards to eliminate the gifting dilemma in cosmetics purchases.

Accelerate Checkout: Deliver an express, sub-60-second mobile order flow with localized Bangladeshi payment and shipping methods.

Centralize Operations: Replace manual Excel spreadsheets with an all-in-one management dashboard for products, orders, collections, coupons, and analytics.

3. Scope Definition

3.1 In-Scope (Phase 1: MVP)

Customer Storefront:

User registration via Email OTP verification and secure Username/Password login with JWT tokens.

Product browsing with collections, keyword search, price range filtering.

Cosmetics-specific visual shade selection (HEX colors, names, volume/size, and shade-specific photos).

Wishlist management for available and out-of-stock items.

Digital gift card purchase, unique 16-character alphanumeric code generation, and checkout redemption.

Cart drawer with instant coupon application and automated delivery rule calculation (Free / Reduced delivery charge).

Express single-page checkout supporting Cash on Delivery (COD), bKash, Nagad (with transaction ID), and VibeCoin.

Order status tracking by Phone Number / Order ID.

Merchant Administration Portal:

Order pipeline management with manual status updates (Pending, Cmplete, Failed).

Full catalog CRUD: products, images, shade variants, and collections.

Promotions and coupons lifecycle management with one-click enable/disable toggles.

Delivery settings configuration (Inside Dhaka / Outside Dhaka charges) and conditional delivery rules.

Payment methods configuration (toggling COD, bKash, Nagad, VibeCoin numbers and statuses).

Customer directory with lifetime order history and spend in Taka.

Sales and revenue performance analytics.

3.2 Out-of-Scope (Phase 2: Future Roadmap)

Native mobile applications (iOS / Android).

Augmented Reality (AR) live camera virtual try-on and AI skin-tone diagnostic .

Automated courier API dispatch integration (Pathao / Steadfast automated webhook sync).

AI-powered auto-copywriting for product titles and SEO descriptions.

Visual photo-based search and voice-activated product search.

Physical gift cards with barcode scanning.

International multi-currency support and Split/Buy-Now-Pay-Later (BNPL) payments.

4. User Roles and Permissions

Role

Description

Permissions & Access Scope

Super Admin

System Owner / Technical Lead

Full system access, database administration, Store admin administration.

Store Admin / Staff

Merchant Operations Team

Access to the VibeMart Admin Dashboard (/admin): Product CRUD, Collection management, Order status updates, Coupon/Promotion toggles, Customer directory oversight, and Analytics view.

Registered Customer

Verified Buyer with Account

Profile management, Email OTP verification, login, full shopping experience, Rating product, Wishlist saving, VibeCoin balance accumulation and usage, Order history lookup. 

Guest Customer

Unregistered Social Shopper

Product and collection discovery, search/sort/filter, cart management, can subscribe in join the club feature to get exclusive offers. Explore gift card section. 

5. System Overview

5.1 Architecture

VibeMart uses a decoupled 3-Tier Architecture:

Frontend (Presentation): Next.js & React handles responsive UI rendering and user interactions.

Backend (Application): Django REST Framework (DRF) processes business logic, routing, and stateless JSON APIs.

Database & Workers (Data/Async): PostgreSQL/SQLite stores data, while Redis and Celery handle async tasks (such as OTP emails).

5.2 Technology Stack

Frontend: Next.js, React, TypeScript, Tailwind CSS, Recharts (Analytics), SweetAlert2.

Backend: Python, Django, Django REST Framework (DRF), Djoser & SimpleJWT.

Database: PostgreSQL (Production) / SQLite (Development).

Async & Cache: Celery, Redis.

DevOps: Docker & Docker Compose.

5.3 Integrations

Email / SMTP: Automated sending of 6-digit OTP verification codes via Celery.

Payment Methods: Support for Cash on Delivery (COD), bKash, Nagad (Transaction ID verification), and VibeCoin.

JWT Authentication: Stateless user authentication using secure JSON Web Tokens.

6. Functional Requirements

Feature ID

Feature Name & Description

User Role

Priority

Key Requirements

Acceptance Criteria

FR-AUTH-001

Email OTP Account RegistrationRegister new user accounts verified via 6-digit email OTP.

Guest / New Customer

High

1. Capture username, email, password, and contact details.2. Generate and dispatch a 6-digit numeric OTP to the provided email.3. Verify submitted OTP to activate the user account.

Unverified accounts cannot authenticate; valid OTP submission successfully activates and creates the customer account.

FR-AUTH-002

Username & Password LoginAuthenticate registered users and issue secure JWT session tokens.

Registered Customer, Store Admin

High

1. Validate credentials against encrypted database records.2. Return JWT access and refresh token pair upon success.

Valid credentials redirect user to the homepage/dashboard; invalid attempts display precise error messages.

FR-GIFT-001

Purchase Digital Gift CardEnable customers to buy digital gift cards in fixed Taka denominations.

Customer

High

1. Select denomination (500 Taka, 1000 Taka, 2500 Taka, or 5000 Taka).2. Capture recipient email, phone number, and optional personal message.3. Generate a unique 16-character alphanumeric code with 365-day validity.

Gift card record is stored with is_used=False and a unique encrypted code is generated.

FR-GIFT-002

Gift Card Checkout RedemptionApply gift card code balance to deduct order totals in real-time.

Customer

High

1. Validate card code, expiration, and active status.2. If Order Total  \le  Card Value: Order balance becomes 0 Taka; card balance remains for future use.3. If Order Total  >  Card Value: Full card balance is deducted; remaining amount payable via COD/bKash/Nagad.

Order accurately reflects balance deduction; card balance and usage flag update atomically upon purchase.

FR-GIFT-003

Redeem unused digital gift cards directly into customer VibeCoin balance.

Registered Customer

High

1. Input 16-character alphanumeric gift card code in user profile.2. Validate code existence, validity, and ensure is_used=False.3. Convert gift card value to VibeCoins and credit customer account.4. Mark gift card is_used=True.

Gift card balance is permanently added to user's vibe_coin balance and the gift card cannot be reused.

FR-CAT-001

Visual Shade & Variant SelectorSelect cosmetic shades, skin tones, and product sizes.

Customer

High

1. Display color swatches with HEX codes and shade titles (e.g., Shade 04 Berry).2. Dynamically swap product gallery images to match selected shade variant.3. Display stock status and disable out-of-stock shades with "Sold Out" state.

Selecting a shade updates the SKU, price override (if applicable), and variant preview image.

FR-CAT-002

Search, Price Range Filter & Multi-Option SortingDiscover products via keyword search, custom price ranges, and 7 sorting modes.

Customer

High

1. Match search keywords against product title, shade name, and descriptions.2. Filter products by custom Min and Max price inputs in Taka.3. Sort products by: Default sorting, Price: Low to High, Price: High to Low, Product: Old First, Product: New First, Popularity: Most Popular First, Popularity: Less Popular First.

Product grid updates asynchronously without full page reload.

FR-CAT-003

Wishlist ManagementSave favorite products to personal wishlist for future purchases.

Registered Customer

Medium

1. Toggle wishlist status on any product card or detail page.2. Allow adding items that are currently out of stock.3. Provide dedicated Wishlist view with quick "Move to Cart" action.

Wishlist items persist across user login sessions in the database.

FR-CHK-001

Cart Coupon Application & Conditional Delivery RulesApply promo coupons and evaluate automated free/reduced delivery rules.

Customer

High

1. Allow entering promotional coupon codes for fixed or percentage discounts in Taka.2. Evaluate active DeliveryRule entities against cart items, collection, and quantities.3. Update shipping fee dynamically to Free Delivery (0 Taka) or Reduced Delivery fee when thresholds are met.

Discounts and delivery fees calculate accurately in real-time in the cart drawer and checkout.

FR-CHK-002

Multi-Channel Payment ProcessingComplete payment through local payment methods.

Customer

High

1. Support Cash on Delivery (COD) with immediate order confirmation.2. Support bKash and Nagad with customer sender number and Transaction ID inputs.3. Support VibeCoin balance payment for registered customers with sufficient coins.

Orders record the specific payment method, transaction reference, and initial payment status (Pending).

FR-ADM-001

Order Pipeline Tracking & Status UpdatesManage incoming orders through a fulfillment pipeline.

Store Admin

High

1. List all orders with Order ID, Customer Phone, items, shades, 

delivery address, and total amount in Taka (OrdersTab).2. Update order status manually: Pending \to Processing 

\to Shipped \toDelivered 

\to Cancelled.

Status changes reflect immediately in the customer order history.

FR-ADM-002

Catalog & Variant CRUD ManagementManage product catalog, shade variants, and collections.

Store Admin

High

1. Create, edit, and delete products, categories/collections, and images (ProductsTab, CollectionsTab).2. Add shade variants with HEX color codes, size/volume, inventory count, and variant images.

Catalog modifications publish live to the customer storefront instantly.

FR-ADM-003

Promotion & Coupon Lifecycle ControlManage marketing campaigns and discount coupons.

Store Admin

High

1. Create coupon codes targeting specific products or collections with expiry dates (CouponsTab).2. Toggle coupon and banner active states on or off instantly.

Disabled coupons are rejected immediately if a customer attempts to apply them in their cart.

FR-ADM-004

Customer Directory & Order HistoryTrack customer profiles and historical transactions.

Store Admin

Medium

1. Search customer directory by Name or Phone Number (CustomersTab).2. View lifetime spend in Taka, membership tier, and detailed item breakdown of past purchases.

Admin can view complete transaction and purchase history per customer.

FR-ADM-005

Sales & Revenue Analytics OverviewMonitor business performance and sales trends.

Store Admin

Medium

1. Display total revenue in Taka, total orders, average order value, and top selling products (AnalyticsTab).2. Render trend charts across selectable intervals (Last 24h, 7 Days, 15 Days, 30 Days).

Analytics aggregate delivered/completed transactions accurately in real-time.

7. Non-Functional Requirements

Category

Requirement Type

Description

Performance

Response Time

Storefront pages and API endpoints must render and respond in < 1.5 seconds under standard 4G mobile connections.

Database Optimization

Use select_related and prefetch_related on Django ORM queries to prevent N+1 query bottlenecks on catalog and order endpoints.

Security

Authentication

Password hashing via PBKDF2 / Argon2; stateless API session verification using JWT.

Authorization

Role-based access control (RBAC) ensuring staff-only endpoints are inaccessible to public users.

Data Protection

Customer phone numbers, passwords, and transaction IDs are encrypted in transit via HTTPS.

Scalability & Reliability

Stateless API Design

Django REST API designed to scale horizontally across containerized instances.

Asynchronous Jobs

Celery task workers for sending OTP emails and generating background reports.

Usability & Responsiveness

Mobile-First UX

100% responsive layout optimized for mobile viewports (375px to 430px) inside Instagram and Facebook in-app web views.

User Stories

Story ID

User Story

Linked Functional Requirement

US-01

As a new customer, I want to verify my registration using a 6-digit email OTP so that I can securely create an account without hassle.

FR-AUTH-001

US-02

As a registered customer, I want to log in using my username and password so that I can access my saved profile, VibeCoins, and order history

FR-AUTH-002

US-03

As a cosmetics shopper, I want to visually select product shades using HEX color swatches so that I can confidently match my skin tone before buying.

FR-CAT-001

US-04

As a shopper, I want to filter products by custom price ranges in Taka and sort by popularity so that I can quickly find trending items within my budget.

FR-CAT-002

US-05

As a registered customer, I want to add out-of-stock items to my wishlist so that I can save them for a future purchase when they are restocked.

FR-CAT-003

US-06

As a gift-giver, I want to purchase a digital gift card in specific Taka denominations and send it via email so that I can easily gift cosmetics to someone else.

FR-GIFT-001

US-07

As a shopper, I want to apply my 16-character gift card code at checkout so that I can complete my shopping using vibecoin worth of its value.

FR-GIFT-002

US-08

As a registered customer, I want to redeem an unused gift card into my VibeCoin balance so that I can store the value securely for future transactions.

FR-GIFT-003

US-09

As a shopper, I want to apply promo codes and see dynamic free delivery rules calculated in my cart so that I know exactly what I am paying before checkout.

FR-CHK-001

US-10

As a customer, I want to pay using bKash, Nagad, Cash on Delivery, or VibeCoins so that I can use my preferred local payment method to complete my order quickly

FR-CHK-002

US-11

As a store admin, I want to manually update order statuses (Pending, Processing, Shipped, Delivered) so that customers receive accurate fulfillment tracking

FR-ADM-001

US-12

As a store admin, I want to create and manage product variants with distinct stock levels, images, and HEX colors so that my online catalog accurately matches physical inventory

FR-ADM-002

US-13

As a store admin, I want to toggle promotional coupons on and off with a single click so that I can instantly control active marketing campaigns.

FR-ADM-003

US-14

As a store admin, I want to view a customer's lifetime spend and detailed purchase history so that I can track user engagement and high-value buyers.

FR-ADM-004

US-15

As a store admin, I want to monitor total revenue, average order value, and top-selling products on a dashboard so that I can assess business performance in real time.

FR-ADM-005

8. Database Requirements

1. User & Customer Management

1.1 core_user (Custom User Model)

Field Name

Data Type

Key / Constraint

Nullable

Default

Description / Valid Choices

id

BigAutoField

PK

No

Auto-increment

Unique identifier for system user

username

VARCHAR(150)

UNIQUE

No

—

Unique login username

email

VARCHAR(254)

UNIQUE

No

—

Registered email address 

first_name

VARCHAR(150)

—

Yes

""

User's first name

last_name

VARCHAR(150)

—

Yes

""

User's last name

is_staff

BOOLEAN

—

No

False

Staff/Admin dashboard access

is_active

BOOLEAN

—

No

True

Account active status

date_joined

DATETIME

—

No

timezone.now

Timestamp of account registration

1.2 store_customer (Customer Profile)

Field Name

Data Type

Key / Constraint

Nullable

Default

Description / Valid Choices

id

BigAutoField

PK

No

Auto-increment

Unique Customer profile identifier

user_id

BigInt

FK (core_user.id), UNIQUE (1:1), ON DELETE CASCADE

No

—

One-to-one link to auth user account

phone

VARCHAR(255)

—

No

—

Contact telephone/mobile number

birth_date

DATE

—

Yes

NULL

Customer date of birth (for birthday perks)

membership

VARCHAR(1)

CHECK IN ('B', 'S', 'G')

No

'B'

Membership tier

vibe_coin

DECIMAL(10,2)

—

No

0.00

Gift card rewards currency balance

2. Catalog & Inventory Management

2.1 store_collection (Categories / Collections)

Field Name

Data Type

Key / Constraint

Nullable

Default

Description / Valid Choices

id

BigAutoField

PK

No

Auto-increment

Unique Collection ID

title

VARCHAR(255)

—

No

—

Name of the collection / category

featured_product_id

BigInt

FK (store_product.id), ON DELETE SET_NULL

Yes

NULL

Highlighted showcase product for this collection

image

VARCHAR(100)

Image path (store/collections/images)

Yes

NULL

Hero banner / category thumbnail

is_featured

BOOLEAN

—

No

False

Whether to display in featured homepage section

2.2 store_product (Product Catalog)

Field Name

Data Type

Key / Constraint

Nullable

Default

Description / Valid Choices

id

BigAutoField

PK

No

Auto-increment

Unique Product ID

title

VARCHAR(255)

—

No

—

Product display name

slug

VARCHAR(255)

db_index=True

No

—

URL-friendly slug

short_description

TEXT

—

No

'Short Description'

Brief snippet for product cards / teasers

description

TEXT

—

Yes

NULL

Full rich-text / markdown product details

unit_price

DECIMAL(6,2)

MinValueValidator(1)

No

—

Base price in BDT (৳)

discount_percent

DECIMAL(5,2)

Min: 0.00, Max: 100.00

No

0.00

Percentage discount override

inventory

INTEGER

MinValueValidator(0)

No

—

Available stock units (base inventory)

collection_id

BigInt

FK (store_collection.id), ON DELETE PROTECT

No

—

Parent collection / category

is_trending

BOOLEAN

—

No

False

Flag to show in "Trending Now" carousel

is_photos_published

BOOLEAN

—

No

True

Visibility toggle for public media display

last_update

DATETIME

auto_now=True

No

Auto-generated

Last modification timestamp

2.3 store_productvariant (Shades, Colors & Sizes)

Field Name

Data Type

Key / Constraint

Nullable

Default

Description / Valid Choices

id

BigAutoField

PK

No

Auto-increment

Unique Variant ID

product_id

BigInt

FK (store_product.id), ON DELETE CASCADE

No

—

Parent product reference

name

VARCHAR(100)

—

No

—

Variant label 

color_name

VARCHAR(50)

—

Yes

NULL

Name of color/shade 

color_code

VARCHAR(20)

Hex/CSS Color

Yes

NULL

HEX color code 

size

VARCHAR(50)

—

Yes

NULL

Size specification 

price_override

DECIMAL(6,2)

MinValueValidator(1)

Yes

NULL

Custom price override (if different from base product)

inventory

INTEGER UNSIGNED

—

No

0

Available stock count for this specific variant

image

VARCHAR(100)

Image path (store/variants)

Yes

NULL

Variant-specific shade/preview image

is_active

BOOLEAN

—

No

True

Variant availability toggle

2.4 store_productimage (Product Gallery)

Field Name

Data Type

Key / Constraint

Nullable

Default

Description / Valid Choices

id

BigAutoField

PK

No

Auto-increment

Unique Image ID

product_id

BigInt

FK (store_product.id), ON DELETE CASCADE

No

—

Associated parent product

image

VARCHAR(100)

Image path (store/images)

No

—

Gallery image asset

3. Reviews & Ratings

3.1 store_review

Field Name

Data Type

Key / Constraint

Nullable

Default

Description / Valid Choices

id

BigAutoField

PK

No

Auto-increment

Unique Review ID

product_id

BigInt

FK (store_product.id), ON DELETE CASCADE

No

—

Product being reviewed

user_id

BigInt

FK (core_user.id), ON DELETE CASCADE

Yes

NULL

Registered user submitting review

name

VARCHAR(255)

—

No

—

Display author name

description

TEXT

—

No

—

Feedback / review comment body

rating

SMALLINT UNSIGNED

Min: 1, Max: 5

No

5

Star rating (1 to 5)

image

VARCHAR(100)

Image path (store/reviews/images)

Yes

NULL

Primary review proof photo

date

DATETIME

auto_now_add=True

No

Auto-generated

Submission timestamp

3.2 store_reviewimage

Field Name

Data Type

Key / Constraint

Nullable

Default

Description / Valid Choices

id

BigAutoField

PK

No

Auto-increment

Unique Review Image ID

review_id

BigInt

FK (store_review.id), ON DELETE CASCADE

No

—

Associated parent review

image

VARCHAR(100)

Image path (store/reviews/images)

No

—

Additional verified buyer photo attachment

4. Shopping Cart Management

4.1 store_cart

Field Name

Data Type

Key / Constraint

Nullable

Default

Description / Valid Choices

id

CHAR(36) / UUID

PK (uuid4)

No

Auto-generated UUID

Unique cart session UUID token

customer_id

BigInt

FK 

Yes

NULL

Authenticated customer (or NULL for guest)

created_at

DATETIME

auto_now_add=True

No

Auto-generated

Session creation timestamp

4.2 store_cartitem

Field Name

Data Type

Key / Constraint

Nullable

Default

Description / Valid Choices

id

BigAutoField

PK

No

Auto-increment

Unique Cart Item ID

cart_id

CHAR(36) / UUID

FK (store_cart.id), ON DELETE CASCADE

No

—

Associated cart

product_id

BigInt

FK (store_product.id), ON DELETE CASCADE

No

—

Selected product

variant_id

BigInt

FK (store_productvariant.id), ON DELETE CASCADE

Yes

NULL

Selected shade/size variant

quantity

SMALLINT UNSIGNED

MinValueValidator(1)

No

—

Selected item quantity count

5. Orders & Transactions

5.1 store_order

Field Name

Data Type

Key / Constraint

Nullable

Default

Description / Valid Choices

id

BigAutoField

PK

No

Auto-increment

Unique Order ID

customer_id

BigInt

FK (store_customer.id), ON DELETE PROTECT

No

—

Placed-by customer

placed_at

DATETIME

auto_now_add=True

No

Auto-generated

Date & time order was placed

payment_status

VARCHAR(1)

CHECK IN ('P', 'C', 'F')

No

'P'

Status: 'P': Pending 'C': Complete'F': Failed

payment_method

VARCHAR(1)

CHECK IN ('C', 'O', 'B', 'N', 'V')

No

'C'

Payment gateway:• 'C': COD (Cash on Delivery)• 'O': Online Gateway• 'B': bKash Manual• 'N': Nagad Manual• 'V': VibeCoin Wallet

transaction_id

VARCHAR(255)

—

Yes

""

MFS TrxID (for bKash / Nagad validation)

transaction_phone_no

VARCHAR(255)

—

Yes

""

Sender wallet phone number

delivery_area

VARCHAR(20)

CHECK IN ('inside_dhaka', 'outside_dhaka')

No

'inside_dhaka'

Regional delivery zone

delivery_charge

DECIMAL(10,2)

MinValueValidator(0)

No

60.00

Applied delivery charge in ৳

shipping_address

VARCHAR(255)

—

Yes

""

Complete physical delivery address

phone

VARCHAR(255)

—

Yes

""

Recipient contact phone number

coupon_code

VARCHAR(50)

—

Yes

""

Applied coupon code for discount auditing

5.2 store_orderitem

Field Name

Data Type

Key / Constraint

Nullable

Default

Description / Valid Choices

id

BigAutoField

PK

No

Auto-increment

Unique Order Item ID

order_id

BigInt

FK (store_order.id), ON DELETE CASCADE

No

—

Associated parent order

product_id

BigInt

FK (store_product.id), ON DELETE PROTECT

Yes

NULL

Ordered product (protected against deletion)

variant_id

BigInt

FK (store_productvariant.id), ON DELETE SET_NULL

Yes

NULL

Specific variant selected

variant_title

VARCHAR(255)

—

Yes

""

Snapshot of variant name at purchase time

quantity

SMALLINT UNSIGNED

MinValueValidator(1)

No

—

Number of units purchased

unit_price

DECIMAL(6,2)

—

No

—

Snapshot unit price at purchase time

6. Marketing, Discounts & Engagement

6.1 store_coupon

Field Name

Data Type

Key / Constraint

Nullable

Default

Description / Valid Choices

id

BigAutoField

PK

No

Auto-increment

Unique Coupon ID

code

VARCHAR(20)

UNIQUE

No

—

Uppercase coupon promo code (e.g. "SUMMER20")

discount_percent

DECIMAL(5,2)

Min: 0.00, Max: 100.00

No

—

Percentage discount value

valid_from

DATETIME

—

No

timezone.now

Activation datetime

valid_to

DATETIME

—

No

+30 days

Expiration datetime

target_type

VARCHAR(20)

CHECK IN ('product', 'collection')

No

'product'

Scope of applicability

collection_id

BigInt

FK (store_collection.id), ON DELETE SET_NULL

Yes

NULL

Specific collection target (if scope = collection)

is_active

BOOLEAN

—

No

True

Master enable / disable toggle

created_at

DATETIME

auto_now_add=True

No

Auto-generated

Record creation timestamp

6.2 store_giftcard

Field Name

Data Type

Key / Constraint

Nullable

Default

Description / Valid Choices

id

CHAR(36) / UUID

PK (uuid4)

No

Auto-generated UUID

Unique digital card identifier

user_email

VARCHAR(254)

—

No

—

Recipient email address

card_code

VARCHAR(50)

UNIQUE

No

16-char Alphanumeric

16-character secret redemption key

price

DECIMAL(10,2)

—

No

500.00

Face monetary value / balance in ৳

created_at

DATETIME

auto_now_add=True

No

Auto-generated

Issue timestamp

expiry_date

DATETIME

—

No

+365 days

Card validity expiration timestamp

is_used

BOOLEAN

—

No

False

Redemption status flag

6.3 store_wishlistitem

Field Name

Data Type

Key / Constraint

Nullable

Default

Description / Valid Choices

id

BigAutoField

PK

No

Auto-increment

Unique Wishlist record ID

user_id

BigInt

FK (core_user.id), ON DELETE CASCADE

No

—

User who saved the item

product_id

BigInt

FK (store_product.id), ON DELETE CASCADE

No

—

Bookmarked product

created_at

DATETIME

auto_now_add=True

No

Auto-generated

Date bookmarked

6.4 store_subscriber (Newsletter Subscribers)

Field Name

Data Type

Key / Constraint

Nullable

Default

Description / Valid Choices

id

BigAutoField

PK

No

Auto-increment

Unique subscriber ID

email

VARCHAR(254)

UNIQUE

No

—

Subscribed email address

created_at

DATETIME

auto_now_add=True

No

Auto-generated

Subscription timestamp

7. Store Configuration & Business Rules

7.1 store_deliverysetting (Base Regional Logistics)

Field Name

Data Type

Key / Constraint

Nullable

Default

Description / Valid Choices

id

BigAutoField

PK

No

1 (Singleton)

Singleton configuration record

inside_dhaka_charge

DECIMAL(10,2)

MinValueValidator(0)

No

60.00

Default delivery charge for Inside Dhaka (৳)

outside_dhaka_charge

DECIMAL(10,2)

MinValueValidator(0)

No

130.00

Default delivery charge for Outside Dhaka (৳)

estimated_days_inside

VARCHAR(50)

—

Yes

'1-2 Days'

Delivery ETA for Inside Dhaka

estimated_days_outside

VARCHAR(50)

—

Yes

'3-5 Days'

Delivery ETA for Outside Dhaka

is_active

BOOLEAN

—

No

True

Shipping calculation engine toggle

last_updated

DATETIME

auto_now=True

No

Auto-generated

Last configuration update timestamp

7.2 store_deliveryrule (Dynamic Shipping Overrides)

Field Name

Data Type

Key / Constraint

Nullable

Default

Description / Valid Choices

id

BigAutoField

PK

No

Auto-increment

Unique Rule ID

title

VARCHAR(255)

—

No

—

Internal rule description / promotion name

target_type

VARCHAR(20)

CHECK IN ('product', 'collection')

No

'product'

Scope target

rule_type

VARCHAR(20)

CHECK IN ('free', 'reduced')

No

'free'

Rule effect:

• 'free': Free Delivery (৳0)

• 'reduced': Discounted shipping

inside_dhaka_charge

DECIMAL(10,2)

MinValueValidator(0)

No

0.00

Rule rate override for Inside Dhaka

outside_dhaka_charge

DECIMAL(10,2)

MinValueValidator(0)

No

0.00

Rule rate override for Outside Dhaka

collection_id

BigInt

FK (store_collection.id), ON DELETE SET_NULL

Yes

NULL

Target collection (if scope = collection)

min_quantity

INTEGER UNSIGNED

MinValueValidator(1)

No

1

Minimum item quantity threshold to trigger rule

is_active

BOOLEAN

—

No

True

Rule active toggle

created_at

DATETIME

auto_now_add=True

No

Auto-generated

Rule creation timestamp

7.3 store_paymentsetting (Payment Gateways Configuration)

Field Name

Data Type

Key / Constraint

Nullable

Default

Description / Valid Choices

id

BigAutoField

PK

No

1 (Singleton)

Singleton configuration record

bkash_number

VARCHAR(20)

—

No

'01711111111'

Official merchant/personal bKash wallet number

bkash_active

BOOLEAN

—

No

True

Enable / disable bKash gateway option

nagad_number

VARCHAR(20)

—

No

'01711111111'

Official Nagad wallet number

nagad_active

BOOLEAN

—

No

True

Enable / disable Nagad gateway option

cod_active

BOOLEAN

—

No

True

Enable / disable Cash on Delivery

vibecoin_active

BOOLEAN

—

No

True

Enable / disable VibeCoin loyalty point redemption

last_updated

DATETIME

auto_now=True

No

Auto-generated

Last configuration update timestamp

9. API Requirements

Method

Endpoint

Description

Auth Required

POST

/auth/otp/send/

Request 6-digit email OTP for registration

No

POST

/auth/otp/verify/

Verify OTP code and activate user account

No

POST

/auth/jwt/create/

Obtain JWT access and refresh token pair

No

GET

/store/products/

List products with search, sorting, price filter

No

GET

/store/products/{id}/

Retrieve product details with variants & reviews

No

POST

/store/products/

Create a new product with shades & stock

Staff Only

GET/POST

/store/collections/

List or create collections/categories

Public / Staff

GET/POST

/store/carts/

Retrieve or initialize cart instance (UUID)

No

POST

/store/carts/{id}/items/

Add variant or product to cart

No

POST

/store/orders/

Place order (COD, bKash, Nagad, VibeCoin)

Customer

PATCH

/store/orders/{id}/

Update order fulfillment & payment status

Staff Only

POST

/store/gift-cards/

Purchase or issue a digital gift card

Customer / Staff

POST

/store/coupons/validate/

Validate promo coupon code on cart

No

GET

/store/customers/

List customer directory with order stats

Staff Only

GET

/store/wishlist/

View authenticated user's wishlist items

Customer

POST

/store/subscribers/

Subscribe guest or customer email to newsletter ("Join the Club")

No

POST

/store/gift-cards/redeem/

Redeem a 16-character gift card code to credit VibeCoins directly to the customer's balance

Customer

GET

/store/customers/me/

Retrieve current authenticated customer profile and active vibe_coin balance

Customer

10. UI/UX Requirements

Category

Screen Name

Features & Elements

Customer Facing Screens

Homepage / Landing

Hero banner, Featured Collections carousel, Trending cosmetics items, Gift Card banner, Newsletter subscriber form.

Product Catalog Page

Multi-column responsive grid, search bar, sort dropdown, Min/Max price slider in Taka, Collection sidebar filter.

Collections Page

Visual directory and grid showcasing all available cosmetics categories and curated collections (e.g., Skincare, Lip Care, Summer Glow, Bestsellers) with cover imagery and instant links to view filtered products.

Product Detail Page

Visual shade selector (HEX circles), dynamic variant image switcher, Add to Cart / Buy Now sticky buttons, Wishlist heart toggle, Customer reviews with photo gallery.

Digital Gift Card Page

Pre-set denomination selector (500 Taka, 1000 Taka, 2500 Taka, 3000 Taka), recipient email and phone number inputs, digital gift card preview, and instant checkout trigger.

Cart

Live subtotal, dynamic free delivery progress bar, promo coupon code input, single-click checkout redirect.

Checkout Page

Single-page form (Name, Phone, Shipping Address, Delivery Area), Payment method selector (COD, bKash, Nagad, VibeCoin), Order confirmation summary. 

User Profile & Order Tracking

Active orders status tracker, purchase history, saved wishlist, and VibeCoin rewards balance.

Admin Screens

Admin Overview (AnalyticsTab)

Comprehensive real-time analytics suite featuring time-series revenue metrics coupon & discount auditing, interactive multi-gateway revenue share analysis , dual-axis product performance rankings, and top-selling shade variant leaderboards.

Orders Management (OrdersTab)

Tabular pipeline with search, filter by status, customer contact, variant details, and manual status update actions.

Product & Variant Editor (ProductsTab)

Product creation modal with dynamic variant rows (Color HEX, Shade Name, SKU, Stock, Image upload).

Promotions & Coupons (CouponsTab, PromotionsTab)

Campaign creation forms with one-click active/inactive toggle switches.

Delivery & Payments Settings (DeliveryTab, PaymentsTab)

Configure regional delivery fees, conditional free delivery rules, and payment phone numbers

Customer Directory (CustomersTab)

Searchable customer table with historical order cards, phone numbers, and spend metrics.

10.3 UI/UX Design System Specification

11. Business Rules

Rule ID

Rule Name

Description & System Enforcement

BR-01

Inventory Integrity

Inventory counts cannot become negative. Placing an order immediately decrements the stock count of the specific shade variant. Out-of-stock variants cannot be added to the cart.

BR-02

Gift Card Expiry & Balance

Gift cards expire exactly 365 days after creation. Unused balances remain attached to the code and can be used across multiple distinct orders until fully exhausted.

BR-03

Delivery Rule Evaluation

When cart items qualify for a DeliveryRule (e.g., purchasing 2+ items from a specific collection), the system automatically applies the free or reduced delivery charge over the base regional charge.

BR-04

Admin Access Separation

Only users with is_staff=True can access /admin, update order statuses, modify product pricing, or inspect the customer directory.

BR-05

Revenue Accounting

Only orders with payment_status='Complete' or fulfilled Delivered status are aggregated into total sales metrics in the Analytics tab.

BR-06

VibeCoin Accumulation & Policy

Customers earn VibeCoins solely by redeeming valid digital gift cards, which permanently marks the card as used (is_used=True).

12. Testing Requirements

Functional Testing:

End-to-end user journeys: User Registration (OTP) to Browse & Shade Selection to Cart to Coupon/Gift Card Application to Express Checkout to Admin Order Fulfillment.

Test variant pricing overrides and stock decrement triggers.

Security & Authorization Testing:

Verify that unauthenticated or non-staff users cannot execute CRUD operations on /store/products/, /store/orders/, or /store/customers/.

Performance Testing:

Run Locust load testing scripts (locustfiles/) simulating 50 concurrent shoppers browsing catalog endpoints.

Cross-Browser & Device Responsiveness:

Verify UI rendering across Google Chrome, Safari, Firefox, and in-app web views (Instagram Browser, Facebook Mobile Webview) on screen widths from 375\text{px}to 1920\text{px}.

13. Acceptance Criteria

 Customer can register and verify account via Email OTP.

 Customer can browse, search, filter by price in Taka, and sort by all 7 sorting criteria.

 Customer can pick cosmetic shade variants with dynamic photo updating.

 Customer can purchase a digital gift card and redeem the unique 16-character code at checkout.

 Customer can complete checkout via COD, bKash, Nagad, or VibeCoin.

 Admin can manually update order statuses, manage products/shades, configure coupons, and view customer histories.

 All backend Django unit and integration tests (pytest) pass with zero regressions.

Guests and customers can subscribe to "Join the Club" via email.

Registered customers can convert redeem digital gift cards into VibeCoins.