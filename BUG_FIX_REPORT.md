# VendorBridge ERP — Bug Detection & Fixing Report

This report documents the software defects identified during the audit phase and the exact code modifications applied to fix them.

---

## 1. Password Reset Tokens Table & User Columns Missing from Base Schema
- **Root Cause:** The base schema file `database/schema.sql` was missing the `password_reset_tokens` table and users status columns, which were defined in a separate migration script. Setups running from the base schema failed on forgot-password workflows.
- **Severity:** 🔴 CRITICAL (Blocker)
- **Files Modified:** [schema.sql](file:///d:/vendorbridge/database/schema.sql)
- **Fix Applied:** Merged users table enhancements (`status`, `last_login`, `updated_at`) and the complete `password_reset_tokens` table definition into the base schema file.

---

## 2. Hardcoded Default JWT Secret Fallbacks
- **Root Cause:** Both the auth controller and validation middleware defaulted to a static development secret key if the `JWT_SECRET` variable was absent from `.env`, exposing the ERP to token forgery.
- **Severity:** 🔴 CRITICAL (Security)
- **Files Modified:**
  - [authController.js](file:///d:/vendorbridge/backend/controllers/authController.js) (Line 16)
  - [authMiddleware.js](file:///d:/vendorbridge/backend/middleware/authMiddleware.js) (Line 30)
- **Fix Applied:** Removed hardcoded secrets. Enforced fail-fast behavior (crash process on server start and return 500 error on API verification if secret is missing).

---

## 3. Account Blockade on Falsy User Status
- **Root Cause:** Login logic performed `if (user.status !== 'active')` which evaluates to true if the status field is NULL or missing, blocking access for pre-migration or uninitialized user rows.
- **Severity:** 🟠 HIGH
- **Files Modified:** [authController.js](file:///d:/vendorbridge/backend/controllers/authController.js) (Line 146)
- **Fix Applied:** Updated logical check to check for falsy values as well: `if (!user.status || user.status !== 'active')`.

---

## 4. PDF Invoice Generation Thread Hanging
- **Root Cause:** Puppeteer PDF rendering lacked a timeout configuration, allowing slow or failed chromium tasks to consume node resources and keep API connections open indefinitely.
- **Severity:** 🟡 MEDIUM
- **Files Modified:** [pdfService.js](file:///d:/vendorbridge/backend/services/pdfService.js) (Line 333)
- **Fix Applied:** Added `timeout: 30000` (30 seconds) into page printing configurations.

---

## 5. Missing Database Performance Indexes
- **Root Cause:** Base tables lacked indices on frequently filtered or ordered fields, causing slow query performance on listings, approvals, and reports.
- **Severity:** 🟠 HIGH (Performance)
- **Files Modified:** [schema.sql](file:///d:/vendorbridge/database/schema.sql)
- **Fix Applied:** Created inline performance indexes inside database schema table definitions for `vendors`, `rfqs`, `quotations`, `approvals`, `purchase_orders`, `invoices`, and `activity_logs`.
