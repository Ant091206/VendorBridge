# VendorBridge ERP — Project Audit & Assessment

This report presents a thorough audit of the **VendorBridge ERP** system (Procurement & Vendor Management). It outlines what features are working, what is broken, missing integrations, security and performance concerns, and codebase quality flags.

---

## 🟢 Working Features

### 1. Authentication & Role Permissions
- JWT-based token generation and verification are fully implemented.
- Role-based route guards (`restrictTo('admin', 'officer', 'manager', 'vendor')`) successfully limit API access.
- Password hashing utilizing `bcryptjs` is properly integrated.

### 2. Vendor Management
- Category classification (`IT & Software`, `Office Supplies`, etc.) works.
- Vendor CRUD endpoints exist and connect cleanly.
- Validation checks restrict vendor modifications to Admins and Officers.

### 3. RFQ & Quotation Workflows
- RFQ creation, category assignment, and email dispatches to assigned vendors are implemented.
- Vendors can log in to their portal, view assigned RFQs, and submit or edit their bids.

### 4. Selection & Approval Workflow
- Officers can compare bids side-by-side on the compare view.
- Selection of a winner locks RFQ, notifies candidates, and spawns a pending Approval record.
- Managers can view, approve (auto-generates PO, logs activity, emails confirmation), or reject (reverts statuses, logs activity) selections.

### 5. Purchase Orders & Invoice Management
- Automatic, sequential PO generation (`PO-YYYY-XXXX`) computes prices and 18% standard GST.
- Invoices can be generated from POs, featuring individual item summary, PDF generation (via Puppeteer), and print layout CSS support.
- SMTP dispatch sends emails with PDF attachments.

### 6. Reports & Analytics
- Monthly spend charts, RFQ conversions, performance rankings, and CSV exports are wired to React Recharts and work.

---

## 🔴 Broken Features & Blockers

### 1. Base Database Schema Missing Critical Tables & Columns
- **Token Table Missing:** Base `database/schema.sql` does not define `password_reset_tokens`. Reset request will crash if the user only runs the base schema without manual migrations.
- **Enhanced Columns Missing:** The base `users` table lacks `status`, `last_login`, and `updated_at` columns referenced in auth routines.

### 2. Hardcoded Default JWT Secret Fallbacks
- Both `backend/controllers/authController.js` and `backend/middleware/authMiddleware.js` default to `'vendorbridge_dev_secret_key_12345'` if `process.env.JWT_SECRET` is unset. This is a severe security vulnerability.

### 3. Puppeteer Chrome Launch Overhead
- PDF invoice generation spawns a headless browser per request. While it closes it in the `finally` block, this consumes high CPU/Memory and lacks a timeout, making it vulnerable to hanging indefinitely on slow systems.

---

## 🟠 Security & Performance Issues

### 1. Missing Database Indexes
- Frequently filtered columns such as `decision` in `approvals`, `status` in `quotations` and `rfqs`, and `email`/`status` in `vendors` lack indexes.

### 2. Silent Email Failures
- Catch blocks in email dispatch routines log failures to console, but don't notify the user or record dispatch status.

### 3. Lack of Login Bruteforce Prevention
- No lockout mechanisms after consecutive failed login attempts, rendering accounts susceptible to brute-force attacks.

---

## 🟡 Code Quality & UX Gaps

### 1. Duplicate Seeding Utilities
- `backend/seed.js` and `backend/resetAndSeedAuth.js` exist in the same codebase with overlapping responsibilities.
- The default seed data does not fulfill the Odoo hackathon dataset requirements (needs 20+ vendors, 30+ RFQs, 60+ quotations, etc.).

### 2. Form Validation Inconsistencies
- Some forms use custom states, while others leverage standard validators, leading to different styling and behavior on validation error states.
