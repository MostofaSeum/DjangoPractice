# Authentication & User Management API

**Base Path:** `/api/v1/auth/` (and `/auth/`)  
**Authentication:** Standard JWT Header (`Authorization: JWT <token>`) or automatic browser HttpOnly cookies (`access_token`, `refresh_token`).

---

## Index

| # | Endpoint | Method | Who Can Use | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `otp/send/` | POST | Public / Guest | Request 6-digit numeric email OTP code |
| 2 | `otp/verify/` | POST | Public / Guest | Verify OTP code and activate / create user account with JWT |
| 3 | `jwt/create/` | POST | Public | Authenticate username/password and issue JWT token pair & HttpOnly cookies |
| 4 | `jwt/refresh/` | POST | Authenticated | Refresh expired access token using refresh token in body or HttpOnly cookie |
| 5 | `jwt/verify/` | POST | Public | Validate token integrity and expiry |
| 6 | `logout/` | POST | Public / All | Clear authentication session and delete HttpOnly cookies |
| 7 | `reset-password/` | POST | Public | Check username/email match or set new password without email link |
| 8 | `users/` | POST | Public | Direct user account registration (Djoser standard) |
| 9 | `users/me/` | GET / PUT / PATCH | Authenticated | Retrieve or update active user account details |
| 10 | `users/set_password/` | POST | Authenticated | Change password for logged-in user with current password validation |
| 11 | `users/reset_password/` | POST | Public | Request Djoser email token-based password reset |
| 12 | `users/reset_password_confirm/` | POST | Public | Complete Djoser password reset with UID and Token |

---

## 1. Request Email OTP

### `POST /api/v1/auth/otp/send/`
Generates a random 6-digit verification code and emails it to the user via transactional email providers (SendGrid, Sender.net, Brevo, or SMTP).

* **Who Can Use:** Guest / Public
* **Rate Limit:** 10 requests / minute (`auth_burst`)

#### Request Body:
```json
{
  "email": "customer@example.com",
  "username": "customer123" // optional: pre-checks if username is already taken
}
```

#### Success Response (`200 OK`):
```json
{
  "detail": "Verification code sent to your email!"
}
```

#### Error Responses:
* **`400 Bad Request`** (Email missing or already registered):
```json
{
  "error": "An account with this email already exists."
}
```
* **`400 Bad Request`** (Username conflict):
```json
{
  "error": "Username is already taken."
}
```

---

## 2. Verify Email OTP & Register

### `POST /api/v1/auth/otp/verify/`
Validates the submitted 6-digit OTP against active database tokens. On valid verification, the user account is created (or activated), and JWT tokens are issued both in the response body and as HttpOnly cookies.

* **Who Can Use:** Guest / Public
* **Rate Limit:** 10 requests / minute (`auth_burst`)

#### Request Body:
```json
{
  "email": "customer@example.com",
  "otp_code": "583921",
  "username": "customer123",
  "password": "SecurePassword123!",
  "first_name": "Rahim", // optional
  "last_name": "Uddin"    // optional
}
```

#### Success Response (`200 OK`):
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 14,
    "username": "customer123",
    "email": "customer@example.com",
    "first_name": "Rahim",
    "last_name": "Uddin",
    "is_staff": false
  }
}
```
*Sets cookies: `access_token` (Max-Age: 1 Day), `refresh_token` (Max-Age: 7 Days).*

#### Error Responses:
* **`400 Bad Request`** (Invalid or expired OTP):
```json
{
  "error": "Invalid or expired verification code"
}
```

---

## 3. Username & Password Login

### `POST /api/v1/auth/jwt/create/`
Authenticates existing credentials and issues JWT token pair along with HttpOnly cookies.

* **Who Can Use:** Public / Registered Users

#### Request Body:
```json
{
  "username": "customer123",
  "password": "SecurePassword123!"
}
```

#### Success Response (`200 OK`):
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
*Sets `access_token` and `refresh_token` HttpOnly cookies.*

#### Error Responses:
* **`401 Unauthorized`**:
```json
{
  "detail": "No active account found with the given credentials"
}
```

---

## 4. Refresh Access Token

### `POST /api/v1/auth/jwt/refresh/`
Generates a new active access token. Accepts the refresh token either via JSON body or automatically through the browser's `refresh_token` HttpOnly cookie.

* **Who Can Use:** Authenticated Users

#### Request Body:
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // optional if cookie is present
}
```

#### Success Response (`200 OK`):
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
*Updates `access_token` HttpOnly cookie.*

---

## 5. Validate Token

### `POST /api/v1/auth/jwt/verify/`
Inspects if an existing access token is valid and unexpired.

#### Request Body:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Success Response (`200 OK`):
`{}` *(Empty object with 200 OK)*

---

## 6. User Logout

### `POST /api/v1/auth/logout/`
Clears authentication state by invalidating and expiring the `access_token` and `refresh_token` HttpOnly cookies.

* **Who Can Use:** Public / Authenticated

#### Success Response (`200 OK`):
```json
{
  "detail": "Logged out successfully."
}
```

---

## 7. Password Reset (Direct Verification)

### `POST /api/v1/auth/reset-password/`
Two-step password reset endpoint protected by `AuthBurstThrottle` (10 req/min):
1. **Validation Step:** Send `username` and `email` without passwords to verify that the account exists.
2. **Execution Step:** Send `username`, `email`, `new_password`, and `confirm_password` to update password directly.

#### Request Body (Step 1 - Verification):
```json
{
  "username": "customer123",
  "email": "customer@example.com"
}
```
*Response (`200 OK`): `{"detail": "Account verified. You can now set your new password."}`*

#### Request Body (Step 2 - Update Password):
```json
{
  "username": "customer123",
  "email": "customer@example.com",
  "new_password": "NewSecurePassword456!",
  "confirm_password": "NewSecurePassword456!"
}
```

#### Success Response (`200 OK`):
```json
{
  "detail": "Password has been successfully changed! You can now sign in."
}
```

#### Error Responses:
* **`404 Not Found`**:
```json
{
  "error": "No matching account found with the provided username and email."
}
```
* **`400 Bad Request`** (Password mismatch):
```json
{
  "error": "New password and confirm password do not match."
}
```

---

## 8. Direct User Registration (Djoser Standard)

### `POST /api/v1/auth/users/`
Creates a user account directly through Djoser without OTP verification.

* **Who Can Use:** Public / Guest

#### Request Body:
```json
{
  "username": "customer123",
  "email": "customer@example.com",
  "password": "SecurePassword123!",
  "first_name": "Rahim",
  "last_name": "Uddin"
}
```

#### Success Response (`201 Created`):
```json
{
  "id": 15,
  "username": "customer123",
  "email": "customer@example.com"
}
```

---

## 9. Current User Profile

### `GET /api/v1/auth/users/me/`
Retrieves information about the currently authenticated user based on the JWT token or session.

* **Who Can Use:** Authenticated (`Authorization: JWT <token>`)

#### Success Response (`200 OK`):
```json
{
  "id": 14,
  "username": "customer123",
  "email": "customer@example.com",
  "first_name": "Rahim",
  "last_name": "Uddin"
}
```

### `PUT / PATCH /api/v1/auth/users/me/`
Updates account details (first name, last name, email) for the authenticated user.

#### Request Body:
```json
{
  "first_name": "Rahim",
  "last_name": "Ahmed"
}
```

---

## 10. Authenticated Password Change

### `POST /api/v1/auth/users/set_password/`
Allows an authenticated user to update their password by confirming their existing password.

* **Who Can Use:** Authenticated Users

#### Request Body:
```json
{
  "current_password": "SecurePassword123!",
  "new_password": "NewSecurePassword456!"
}
```

#### Success Response:
`204 No Content`

---

## 11. Djoser Token-Based Password Reset Flow

### `POST /api/v1/auth/users/reset_password/`
Sends a password reset email with a `uid` and `token`.

#### Request Body:
```json
{
  "email": "customer@example.com"
}
```
*Success Response: `204 No Content`*

---

### `POST /api/v1/auth/users/reset_password_confirm/`
Completes password reset using the emailed `uid`, `token`, and `new_password`.

#### Request Body:
```json
{
  "uid": "MTQ",
  "token": "c7k10p-39d01248...",
  "new_password": "BrandNewPassword789!"
}
```
*Success Response: `204 No Content`*
