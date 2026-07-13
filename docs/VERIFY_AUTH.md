# VendorBridge — Authentication Verification Report

> Generated: 2026-06-06T08:17:17.588Z
> Environment: development
> Database: vendorbridge@localhost
> bcrypt Rounds: 10
> JWT Secret: vendorbrid...

---

## Summary

| Status | Check |
|--------|-------|
| ✅ | 4/4 users seeded |
| ✅ | bcrypt hash verification |
| ✅ | bcrypt rejects wrong passwords |
| ✅ | JWT generation & verification |

---

## Demo Users

| ID | Name | Email | Role | Status | Plain Password |
|----|------|-------|------|--------|----------------|
| 1 | Rajesh Kumar | admin@vendorbridge.com | admin | active | `Admin@123` |
| 2 | Priya Sharma | officer@vendorbridge.com | officer | active | `Officer@123` |
| 3 | Vikram Mehta | manager@vendorbridge.com | manager | active | `Manager@123` |
| 4 | Arjun Patel | vendor1@vendorbridge.com | vendor | active | `Vendor@123` |

---

## bcrypt Hash Verification

### Rajesh Kumar (admin)
- **Email:** `admin@vendorbridge.com`
- **Plain Password:** `Admin@123`
- **Hash (truncated):** `$2a$10$V2138uo8f/QbA7YivZLvS.srpYmIii0nU...`
- **bcrypt.compare(correct password):** ✅ MATCH
- **bcrypt.compare(wrong password):** ✅ REJECTED
- **Account Status:** `active`

### Priya Sharma (officer)
- **Email:** `officer@vendorbridge.com`
- **Plain Password:** `Officer@123`
- **Hash (truncated):** `$2a$10$9lF2sHpyK1nbKjf2uurKUuaVO5itrpdd0...`
- **bcrypt.compare(correct password):** ✅ MATCH
- **bcrypt.compare(wrong password):** ✅ REJECTED
- **Account Status:** `active`

### Vikram Mehta (manager)
- **Email:** `manager@vendorbridge.com`
- **Plain Password:** `Manager@123`
- **Hash (truncated):** `$2a$10$Yh5810wx9hAddAhbbmO7nuyxqidnyW7KH...`
- **bcrypt.compare(correct password):** ✅ MATCH
- **bcrypt.compare(wrong password):** ✅ REJECTED
- **Account Status:** `active`

### Arjun Patel (vendor)
- **Email:** `vendor1@vendorbridge.com`
- **Plain Password:** `Vendor@123`
- **Hash (truncated):** `$2a$10$1IRkPu7LOQZayKLnbVKeb.k3GL9E.BMKv...`
- **bcrypt.compare(correct password):** ✅ MATCH
- **bcrypt.compare(wrong password):** ✅ REJECTED
- **Account Status:** `active`

---

## JWT Generation & Verification

### Rajesh Kumar (admin)
- **Email:** `admin@vendorbridge.com`
- **Token (truncated):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IlJ...`
- **Sign + Verify:** ✅ PASS
- **Decoded Payload:**
  ```json
  {
    "id": 1,
    "email": "admin@vendorbridge.com",
    "role": "admin",
    "status": "active"
  }
  ```

### Priya Sharma (officer)
- **Email:** `officer@vendorbridge.com`
- **Token (truncated):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwibmFtZSI6IlB...`
- **Sign + Verify:** ✅ PASS
- **Decoded Payload:**
  ```json
  {
    "id": 2,
    "email": "officer@vendorbridge.com",
    "role": "officer",
    "status": "active"
  }
  ```

### Vikram Mehta (manager)
- **Email:** `manager@vendorbridge.com`
- **Token (truncated):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywibmFtZSI6IlZ...`
- **Sign + Verify:** ✅ PASS
- **Decoded Payload:**
  ```json
  {
    "id": 3,
    "email": "manager@vendorbridge.com",
    "role": "manager",
    "status": "active"
  }
  ```

### Arjun Patel (vendor)
- **Email:** `vendor1@vendorbridge.com`
- **Token (truncated):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwibmFtZSI6IkF...`
- **Sign + Verify:** ✅ PASS
- **Decoded Payload:**
  ```json
  {
    "id": 4,
    "email": "vendor1@vendorbridge.com",
    "role": "vendor",
    "status": "active"
  }
  ```

---

## Login Test Credentials

Use these credentials on the login page at `http://localhost:5173/login`:

| Role | Email | Password |
|------|-------|----------|
| admin | `admin@vendorbridge.com` | `Admin@123` |
| officer | `officer@vendorbridge.com` | `Officer@123` |
| manager | `manager@vendorbridge.com` | `Manager@123` |
| vendor | `vendor1@vendorbridge.com` | `Vendor@123` |

---

## Schema Verification

### Tables Found

- `activity_logs`
- `approvals`
- `invoices`
- `password_reset_tokens`
- `purchase_orders`
- `quotations`
- `rfq_vendors`
- `rfqs`
- `users`
- `vendor_categories`
- `vendors`

### users Table Columns (after migration)

- `id` — int | NULL: NO | Default: none
- `name` — varchar(255) | NULL: NO | Default: none
- `email` — varchar(255) | NULL: NO | Default: none
- `password_hash` — varchar(255) | NULL: NO | Default: none
- `role` — enum('admin','officer','vendor','manager') | NULL: NO | Default: none
- `status` — enum('active','inactive') | NULL: NO | Default: active
- `last_login` — timestamp | NULL: YES | Default: none
- `updated_at` — timestamp | NULL: YES | Default: CURRENT_TIMESTAMP
- `created_at` — timestamp | NULL: YES | Default: CURRENT_TIMESTAMP

---

## Live API Test Results

Tested against live backend at `http://localhost:5000` (server running via `npm run dev`):

| Role | Email | HTTP Status | API Status | JWT Token Length |
|------|-------|-------------|------------|-----------------|
| ADMIN | `admin@vendorbridge.com` | 200 OK | `success` | 231 chars |
| OFFICER | `officer@vendorbridge.com` | 200 OK | `success` | 236 chars |
| MANAGER | `manager@vendorbridge.com` | 200 OK | `success` | 236 chars |
| VENDOR | `vendor1@vendorbridge.com` | 200 OK | `success` | 233 chars |

All 4 accounts return valid JWT tokens from the live `/api/auth/login` endpoint. ✅

---

## Overall Result

### 🎉 ALL CHECKS PASSED — Authentication system is fully functional.

- ✅ Schema migration applied (status, last_login, updated_at, password_reset_tokens)
- ✅ 4 demo users seeded with bcrypt (10 rounds)
- ✅ All bcrypt hash verifications pass
- ✅ All bcrypt wrong-password rejections pass
- ✅ All JWT sign+verify tests pass
- ✅ All 4 live API login calls return `status: success` with valid JWT tokens
