# VendorBridge — Authentication Verification Report

> Generated: 2026-06-17T05:41:09.623Z
> Environment: development
> Database: vendorbridge@localhost
> bcrypt Rounds: 10
> JWT Secret: vendorbrid...

---

## Summary

| Status | Check |
|--------|-------|
| ❌ | 4/5 users seeded |
| ✅ | bcrypt hash verification |
| ✅ | bcrypt rejects wrong passwords |
| ✅ | JWT generation & verification |

---

## Demo Users

| ID | Name | Email | Role | Status | Plain Password |
|----|------|-------|------|--------|----------------|
| 1 | Priya Sharma | officer@vendorbridge.com | officer | active | `Officer@123` |
| 2 | Vikram Mehta | manager@vendorbridge.com | manager | active | `Manager@123` |
| 3 | Arjun Patel | vendor1@vendorbridge.com | vendor | active | `Vendor@123` |
| 4 | Amit Patel | finance@vendorbridge.com | finance | active | `Finance@123` |

---

## bcrypt Hash Verification

### Priya Sharma (officer)
- **Email:** `officer@vendorbridge.com`
- **Plain Password:** `Officer@123`
- **Hash (truncated):** `$2a$10$Z/mL3Q7.se1QrdDpIuI61OoPxI6k6Bf4C...`
- **bcrypt.compare(correct password):** ✅ MATCH
- **bcrypt.compare(wrong password):** ✅ REJECTED
- **Account Status:** `active`

### Vikram Mehta (manager)
- **Email:** `manager@vendorbridge.com`
- **Plain Password:** `Manager@123`
- **Hash (truncated):** `$2a$10$G/GkWxBSLN4oPrLlz9uXuuCZlIL4rcp.s...`
- **bcrypt.compare(correct password):** ✅ MATCH
- **bcrypt.compare(wrong password):** ✅ REJECTED
- **Account Status:** `active`

### Arjun Patel (vendor)
- **Email:** `vendor1@vendorbridge.com`
- **Plain Password:** `Vendor@123`
- **Hash (truncated):** `$2a$10$2xw3kEICY1VuRRjSbJyXw.1lcMm3jE02Q...`
- **bcrypt.compare(correct password):** ✅ MATCH
- **bcrypt.compare(wrong password):** ✅ REJECTED
- **Account Status:** `active`

### Amit Patel (finance)
- **Email:** `finance@vendorbridge.com`
- **Plain Password:** `Finance@123`
- **Hash (truncated):** `$2a$10$uvmnR4hqFcGuyIFX9xcTZu.r.yWHJHZ6S...`
- **bcrypt.compare(correct password):** ✅ MATCH
- **bcrypt.compare(wrong password):** ✅ REJECTED
- **Account Status:** `active`

---

## JWT Generation & Verification

### Priya Sharma (officer)
- **Email:** `officer@vendorbridge.com`
- **Token (truncated):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IlB...`
- **Sign + Verify:** ✅ PASS
- **Decoded Payload:**
  ```json
  {
    "id": 1,
    "email": "officer@vendorbridge.com",
    "role": "officer",
    "status": "active"
  }
  ```

### Vikram Mehta (manager)
- **Email:** `manager@vendorbridge.com`
- **Token (truncated):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwibmFtZSI6IlZ...`
- **Sign + Verify:** ✅ PASS
- **Decoded Payload:**
  ```json
  {
    "id": 2,
    "email": "manager@vendorbridge.com",
    "role": "manager",
    "status": "active"
  }
  ```

### Arjun Patel (vendor)
- **Email:** `vendor1@vendorbridge.com`
- **Token (truncated):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywibmFtZSI6IkF...`
- **Sign + Verify:** ✅ PASS
- **Decoded Payload:**
  ```json
  {
    "id": 3,
    "email": "vendor1@vendorbridge.com",
    "role": "vendor",
    "status": "active"
  }
  ```

### Amit Patel (finance)
- **Email:** `finance@vendorbridge.com`
- **Token (truncated):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwibmFtZSI6IkF...`
- **Sign + Verify:** ✅ PASS
- **Decoded Payload:**
  ```json
  {
    "id": 4,
    "email": "finance@vendorbridge.com",
    "role": "finance",
    "status": "active"
  }
  ```

---

## Login Test Credentials

Use these credentials on the login page at `http://localhost:5173/login`:

| Role | Email | Password |
|------|-------|----------|
| officer | `officer@vendorbridge.com` | `Officer@123` |
| manager | `manager@vendorbridge.com` | `Manager@123` |
| vendor | `vendor1@vendorbridge.com` | `Vendor@123` |
| finance | `finance@vendorbridge.com` | `Finance@123` |

---

## Schema Verification

### Tables Found

- `activity_logs`
- `approval_history`
- `approval_requests`
- `invoice_emails`
- `invoice_history`
- `invoice_items`
- `invoices`
- `notifications`
- `password_reset_tokens`
- `profiles`
- `purchase_order_history`
- `purchase_order_items`
- `purchase_orders`
- `quotation_attachments`
- `quotation_comparisons`
- `quotation_items`
- `quotation_selections`
- `quotations`
- `rfq_attachments`
- `rfq_items`
- `rfq_vendors`
- `rfqs`
- `sessions`
- `users`
- `vendor_categories`
- `vendors`

### users Table Columns (after migration)

- `id` — int | NULL: NO | Default: none
- `full_name` — varchar(255) | NULL: NO | Default: none
- `email` — varchar(255) | NULL: NO | Default: none
- `password_hash` — varchar(255) | NULL: NO | Default: none
- `role` — enum('admin','manager','officer','finance','vendor') | NULL: NO | Default: none
- `status` — enum('active','inactive','suspended') | NULL: NO | Default: active
- `created_at` — timestamp | NULL: YES | Default: CURRENT_TIMESTAMP
- `updated_at` — timestamp | NULL: YES | Default: CURRENT_TIMESTAMP

---

## Overall Result

### ❌ SOME CHECKS FAILED — See individual results above.
