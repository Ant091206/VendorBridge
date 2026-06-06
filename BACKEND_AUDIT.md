# VendorBridge ERP — Backend Audit

## Overview

**Framework**: Node.js + Express.js
**Language**: JavaScript (ES6+ Modules)
**API Style**: RESTful JSON
**Authentication**: JWT (Bearer tokens)
**Database**: MySQL with connection pooling
**Port**: 5000 (default)

**API Endpoints**: 60+ documented
**Controllers**: 10
**Route Files**: 10
**Middleware**: 4
**Services**: 3
**Utilities**: 3

---

## API Endpoint Inventory

### Authentication Routes (`/api/auth`)

#### 1. POST /api/auth/register ✅
**Purpose**: User self-registration
**Access**: Public
**Rate Limit**: 10 req/15 min
**Request Body**:
```json
{
  "name": "string (required)",
  "email": "string (required, valid email)",
  "password": "string (required, min 8 chars)",
  "role": "officer|vendor|manager (required)"
}
```
**Response**: 201 Created
```json
{
  "status": "success",
  "message": "User registered successfully.",
  "token": "eyJhbGci...",
  "user": { "id": 1, "name": "...", "email": "...", "role": "..." }
}
```
**Issues**: None ✅

---

#### 2. POST /api/auth/login ✅
**Purpose**: User authentication
**Access**: Public
**Rate Limit**: 10 req/15 min
**Request Body**:
```json
{
  "email": "string (required)",
  "password": "string (required)",
  "rememberMe": "boolean (optional, default false)"
}
```
**Response**: 200 OK
**Validation**: ✅ Email/password required, email format checked, status verification
**Issues**: 
- ⚠️ References user.status field which may be NULL in old records
- ⚠️ No brute-force protection (only rate limit)
**Fix Priority**: MEDIUM

---

#### 3. POST /api/auth/logout ✅
**Purpose**: Logout acknowledgment (stateless)
**Access**: Protected (verifyToken required)
**Request Body**: Empty
**Response**: 200 OK
```json
{ "status": "success", "message": "Logout successful." }
```
**Issues**: None ✅

---

#### 4. POST /api/auth/forgot-password ✅
**Purpose**: Initiate password reset
**Access**: Public
**Request Body**:
```json
{
  "email": "string (required, valid email)"
}
```
**Response**: 200 OK
**Issues**:
- 🔴 **CRITICAL**: password_reset_tokens table missing from base schema
- ⚠️ No rate limiting per email (same user could spam)
- ⚠️ Doesn't verify email actually sent
**Fix Priority**: CRITICAL

---

#### 5. POST /api/auth/reset-password ⚠️
**Purpose**: Complete password reset
**Access**: Public
**Request Body**:
```json
{
  "token": "string (required)",
  "password": "string (required, min 8 chars)",
  "confirmPassword": "string (required)"
}
```
**Issues**:
- 🔴 **CRITICAL**: Requires non-existent password_reset_tokens table
- ⚠️ No token format validation
- ⚠️ Doesn't check if new password == old password
**Fix Priority**: CRITICAL

---

### Vendor Routes (`/api/vendors`)

#### 6. GET /api/vendors ✅
**Purpose**: List all vendors
**Access**: admin, officer
**Query Params**:
- `search`: Vendor name search (LIKE)
- `status`: Filter by status (active|inactive|blacklisted)
- `category_id`: Filter by category
**Response**: 200 OK
```json
{
  "status": "success",
  "results": 5,
  "data": [{ "id": 1, "name": "...", "status": "active", ... }]
}
```
**Issues**: None ✅

---

#### 7. GET /api/vendors/:id ✅
**Purpose**: Get vendor details
**Access**: admin, officer
**Response**: 200 OK or 404 Not Found
**Issues**: None ✅

---

#### 8. POST /api/vendors ✅
**Purpose**: Create vendor
**Access**: admin only
**Validation**: name, email, gst_number required; email unique
**Issues**: None ✅

---

#### 9. PUT /api/vendors/:id ✅
**Purpose**: Update vendor
**Access**: admin only
**Validation**: Full record required
**Issues**: None ✅

---

#### 10. DELETE /api/vendors/:id ✅
**Purpose**: Soft delete vendor
**Access**: admin only
**Implementation**: Soft delete via status field
**Issues**: None ✅

---

#### 11. GET /api/vendor-categories ✅
**Purpose**: List vendor categories
**Access**: admin, officer
**Issues**: None ✅

---

#### 12. POST /api/vendor-categories ✅
**Purpose**: Create vendor category
**Access**: admin only
**Issues**: None ✅

---

### RFQ Routes (`/api/rfqs`)

#### 13. GET /api/rfqs ✅
**Purpose**: List all RFQs
**Access**: admin, officer
**Response**: 200 OK with vendor count per RFQ
**Issues**: None ✅

---

#### 14. GET /api/rfqs/:id ✅
**Purpose**: Get RFQ details with assigned vendors
**Access**: admin, officer
**Issues**: None ✅

---

#### 15. POST /api/rfqs ✅
**Purpose**: Create RFQ and assign vendors
**Access**: officer only
**Validation**: All fields required, deadline must be future date, vendor_ids array required
**Implementation**: 
- ✅ Transaction-based vendor assignment
- ✅ Async email dispatch to vendors
- ✅ Status auto-set to 'open'
**Issues**: None ✅

---

#### 16. PUT /api/rfqs/:id ✅
**Purpose**: Update RFQ (if draft)
**Access**: officer only
**Issues**: None ✅

---

#### 17. PUT /api/rfqs/:id/close ✅
**Purpose**: Close RFQ (stop accepting quotations)
**Access**: officer, admin
**Issues**: None ✅

---

#### 18. DELETE /api/rfqs/:id ✅
**Purpose**: Delete RFQ (if draft)
**Access**: officer only
**Issues**: None ✅

---

#### 19. GET /api/rfqs/:id/vendors ✅
**Purpose**: Get assigned vendors with quotation status
**Access**: admin, officer
**Issues**: None ✅

---

#### 20. GET /api/vendor/my-rfqs ✅
**Purpose**: Get RFQs assigned to logged-in vendor
**Access**: vendor only
**Issues**: None ✅

---

### Quotation Routes (`/api/quotations`)

#### 21. POST /api/quotations ✅
**Purpose**: Vendor submits quotation
**Access**: vendor only
**Validation**:
- ✅ Vendor registration verified
- ✅ RFQ assignment verified
- ✅ RFQ status must be 'open'
- ✅ Deadline must be future
- ✅ Prevents duplicate submissions
- ✅ Validates price > 0
**Issues**: None ✅

---

#### 22. PUT /api/quotations/:id ✅
**Purpose**: Vendor updates their quotation
**Access**: vendor only
**Issues**: None ✅

---

#### 23. GET /api/quotations/my-quotations ✅
**Purpose**: Get vendor's submitted quotations
**Access**: vendor only
**Issues**: None ✅

---

#### 24. GET /api/quotations/rfq/:rfq_id ✅
**Purpose**: Get all quotations for RFQ (comparison view)
**Access**: admin, officer
**Issues**: None ✅

---

#### 25. GET /api/quotations ✅
**Purpose**: Get all quotations in system
**Access**: admin, officer
**Issues**: None ✅

---

#### 26. GET /api/quotations/:id ✅
**Purpose**: Get quotation details
**Access**: admin, officer, or submitting vendor
**Authorization**: Vendor access restricted to own quotations
**Issues**: None ✅

---

#### 27. PUT /api/quotations/:id/select ✅
**Purpose**: Officer selects winning quotation
**Access**: officer only
**Implementation**: 
- ✅ Creates approval record
- ✅ Sets quotation status to 'selected'
**Issues**: None ✅

---

### Approval Routes (`/api/approvals`)

#### 28. GET /api/approvals ✅
**Purpose**: Get all approvals with decision filter
**Access**: manager, admin
**Query**: `?decision=pending|approved|rejected`
**Issues**: None ✅

---

#### 29. GET /api/approvals/pending ✅
**Purpose**: Get pending approvals only
**Access**: manager, admin
**Issues**: None ✅

---

#### 30. GET /api/approvals/:id ✅
**Purpose**: Get approval details with price comparison
**Access**: manager, admin
**Issues**: None ✅

---

#### 31. PUT /api/approvals/:id/approve ✅
**Purpose**: Manager approves quotation
**Access**: manager, admin
**Implementation**:
- ✅ Auto-generates PO
- ✅ Calculates GST (18%)
- ✅ Updates approval decision to 'approved'
- ✅ Logs activity
- ✅ Sends email notification
**Issues**: None ✅

---

#### 32. PUT /api/approvals/:id/reject ✅
**Purpose**: Manager rejects quotation
**Access**: manager, admin
**Implementation**:
- ✅ Sets status to 'rejected'
- ✅ Reverts quotation to 'submitted'
- ✅ Requires remarks
- ✅ Sends rejection email
**Issues**: None ✅

---

### Purchase Order Routes (`/api/purchase-orders`)

#### 33. GET /api/purchase-orders ✅
**Purpose**: Get all POs
**Access**: officer, admin, manager
**Search**: po_number, vendor_name
**Filter**: status
**Issues**: None ✅

---

#### 34. GET /api/purchase-orders/vendor/my-orders ✅
**Purpose**: Get vendor's POs
**Access**: vendor only
**Issues**: None ✅

---

#### 35. GET /api/purchase-orders/:id ✅
**Purpose**: Get PO details
**Access**: officer, admin, manager, or owner vendor
**Issues**: None ✅

---

#### 36. PUT /api/purchase-orders/:id/status ✅
**Purpose**: Update PO status
**Access**: officer, admin, manager
**Allowed Transitions**: generated→sent→completed
**Issues**: None ✅

---

### Invoice Routes (`/api/invoices`)

#### 37. POST /api/invoices/generate/:po_id ✅
**Purpose**: Generate invoice from PO
**Access**: officer, admin
**Validation**:
- ✅ PO must exist
- ✅ PO status must be 'generated' or 'sent'
- ✅ Prevents duplicate invoices
**Implementation**:
- ✅ Auto-number: INV-YYYY-XXXXX
- ✅ Calculates 18% GST
- ✅ Updates PO status to 'sent'
- ✅ Logs activity
**Issues**: None ✅

---

#### 38. GET /api/invoices ✅
**Purpose**: Get all invoices
**Access**: officer, admin
**Issues**: None ✅

---

#### 39. GET /api/invoices/vendor/my-invoices ✅
**Purpose**: Get vendor's invoices
**Access**: vendor only
**Issues**: None ✅

---

#### 40. GET /api/invoices/:id ✅
**Purpose**: Get invoice details
**Access**: officer, admin, or owner vendor
**Issues**: None ✅

---

#### 41. GET /api/invoices/:id/pdf ✅
**Purpose**: Download invoice as PDF
**Access**: officer, admin, or owner vendor
**Implementation**: Puppeteer PDF generation
**Issues**: 
- ⚠️ No file size validation
- ⚠️ No rate limiting on PDF generation
**Fix Priority**: LOW

---

#### 42. POST /api/invoices/:id/send-email ✅
**Purpose**: Email invoice to vendor
**Access**: officer, admin
**Issues**:
- ⚠️ No delivery tracking
- ⚠️ Silent failure on email error
**Fix Priority**: LOW

---

#### 43. PUT /api/invoices/:id/status ✅
**Purpose**: Update invoice status
**Access**: officer, admin
**Allowed**: generated→sent→paid
**Issues**: None ✅

---

### Activity Log Routes (`/api/activity-logs`)

#### 44. GET /api/activity-logs ✅
**Purpose**: Get filtered activity logs
**Access**: admin only
**Filters**:
- user_id
- entity_type (rfq, quotation, approval, po, invoice, vendor)
- action
- date range (from, to)
**Pagination**: limit (max 200, default 50)
**Issues**: None ✅

---

#### 45. GET /api/activity-logs/recent ✅
**Purpose**: Get last 20 actions
**Access**: admin, officer
**Issues**: None ✅

---

#### 46. GET /api/activity-logs/my-activity ✅
**Purpose**: Get logged-in user's last 30 actions
**Access**: All authenticated
**Issues**: None ✅

---

### Report Routes (`/api/reports`)

#### 47. GET /api/reports/dashboard-stats ✅
**Purpose**: Dashboard KPIs
**Access**: admin, officer
**Metrics**: vendors count, RFQs, quotations, approvals, POs, invoices, spend
**Issues**: None ✅

---

#### 48. GET /api/reports/monthly-spending ✅
**Purpose**: Monthly spend breakdown
**Access**: admin, officer
**Query**: `?year=2026` (default current year)
**Issues**: None ✅

---

#### 49. GET /api/reports/vendor-performance ✅
**Purpose**: Vendor metrics (quotes, selections, delivery time)
**Access**: admin, officer
**Issues**: None ✅

---

#### 50. GET /api/reports/rfq-analytics ✅
**Purpose**: RFQ conversion metrics
**Access**: admin, officer
**Issues**: None ✅

---

#### 51. GET /api/reports/spending-by-category ✅
**Purpose**: Spending breakdown by vendor category
**Access**: admin, officer
**Issues**: None ✅

---

#### 52. GET /api/reports/top-vendors ✅
**Purpose**: Top 5 vendors by business value
**Access**: admin, officer
**Issues**: None ✅

---

#### 53. GET /api/reports/export/vendors ✅
**Purpose**: Export vendor list as CSV
**Access**: admin only
**Issues**: None ✅

---

#### 54. GET /api/reports/export/purchase-orders ✅
**Purpose**: Export POs as CSV
**Access**: admin, officer
**Issues**: None ✅

---

#### 55. GET /api/reports/export/invoices ✅
**Purpose**: Export invoices as CSV
**Access**: admin, officer
**Issues**: None ✅

---

## Middleware Analysis

### 1. authMiddleware.js ✅

**verifyToken Middleware**
- ✅ Validates Bearer token format
- ✅ Verifies JWT signature
- ✅ Attaches user payload to req.user
- ✅ Returns 401 on invalid/expired token
- ✅ Returns 400 on malformed header
**Issues**: None ✅

**restrictTo Middleware**
- ✅ Checks user role against allowed roles
- ✅ Returns 403 if unauthorized
**Issues**: None ✅

---

### 2. validateRequest.js ✅

**Validation Rules**:
- ✅ required(field)
- ✅ email(field)
- ✅ minLength(field, min)
- ✅ positiveNumber(field)
- ✅ oneOf(field, allowedValues)

**Issues**: 
- ⚠️ No regex validation for phone numbers
- ⚠️ No file upload validation
- ⚠️ No SQL injection prevention hints
**Fix Priority**: LOW

---

### 3. errorHandler.js ✅

**Features**:
- ✅ Maps error types to HTTP status codes
- ✅ Returns consistent JSON error format
- ✅ Logs errors in development mode
- ✅ Hides stack trace in production
**Issues**: None ✅

---

### 4. notFound.js ✅

**Features**:
- ✅ Catches undefined routes
- ✅ Returns 404 status
- ✅ Returns consistent error format
**Issues**: None ✅

---

## Security Analysis

### Authentication Security ✅
- ✅ JWT tokens (no server session storage)
- ✅ Bcryptjs password hashing (12 salt rounds)
- ✅ Bearer token format validation
- ✅ Email format validation
- ✅ Password minimum length (8 chars)

### Authorization Security ✅
- ✅ Role-based access control (4 roles: admin, officer, vendor, manager)
- ✅ Vendor self-isolation (cannot see other vendors' data)
- ✅ Manager approval-only access
- ✅ Route protection with verifyToken middleware

### Data Security ✅
- ✅ Prepared statements (parameterized queries)
- ✅ No SQL injection vectors
- ✅ Input validation on all public routes
- ✅ Email validation

### Transport Security ✅
- ✅ Helmet security headers enabled
- ✅ CORS configured with origin whitelist
- ✅ Rate limiting (100 req/15 min general, 10 req/15 min auth)

### Issues & Vulnerabilities
- ⚠️ **NO HTTPS** in development (not applicable, local dev)
- ⚠️ **JWT_SECRET hardcoded in fallback** (should warn in logs)
- ⚠️ **No account lockout** after failed logins
- ⚠️ **No CSRF tokens** (not needed for SPA/API architecture)
- ⚠️ **Email service credentials in .env** (standard practice, okay)

---

## Services Analysis

### 1. authService.js

**generateResetToken()**
- ✅ Generates 64-char hex token
- ✅ Cryptographically secure (crypto.randomBytes)

**storeResetToken()**
- ✅ Invalidates previous tokens
- ✅ Sets 1-hour expiry
- ⚠️ No error handling if DB insert fails

**validateResetToken()**
- ✅ Checks existence, expiry, used flag
- ✅ Returns token record with user info

**invalidateResetToken()**
- ✅ Marks token as used (single-use enforcement)

**sendPasswordResetEmail()**
- ✅ Sends HTML-formatted email
- ⚠️ Email failure is silent (doesn't throw)

**Issues**:
- 🔴 **CRITICAL**: Functions reference non-existent password_reset_tokens table
- ⚠️ No retry logic on email failure

---

### 2. emailService.js

**sendEmail()**
- ✅ Generic email sender using Nodemailer
- ✅ Gmail SMTP configuration
- ✅ HTML body support
- ✅ Attachment support
- ✅ Non-blocking (async)
- ⚠️ Silently catches errors (logs but doesn't throw)

**sendRFQInvitation()**
- ✅ HTML-formatted invitation
- ✅ RFQ details embedded
- ✅ Deadline highlighted

**Issues**:
- ⚠️ No email delivery confirmation
- ⚠️ No retry mechanism
- ⚠️ No bounced email handling
- ⚠️ No unsubscribe link (GDPR)
**Fix Priority**: MEDIUM

---

### 3. pdfService.js

**generateInvoicePDF()**
- ✅ Uses Puppeteer for PDF generation
- ✅ Professional invoice template
- ✅ Tax calculations (18% GST)
- ⚠️ Heavy resource usage (Puppeteer instance per invoice)
- ⚠️ No timeout protection

**Issues**:
- ⚠️ **PERFORMANCE**: No caching, regenerates PDF on each request
- ⚠️ **MEMORY**: Puppeteer may consume 100+ MB per instance
- ⚠️ **TIMEOUT**: No timeout on PDF generation
- ⚠️ **NO DISK CACHE**: PDFs not saved to disk
**Fix Priority**: HIGH

---

## Utilities Analysis

### 1. activityLogger.js ✅
**logActivity()** - Non-blocking activity insertion
- ✅ Accepts DB connection
- ✅ Silently fails (doesn't crash main process)
- ✅ Proper error logging
**Issues**: None ✅

---

### 2. invoiceNumberGenerator.js ✅
**generateInvoiceNumber()** - Sequential numbering (INV-YYYY-XXXXX)
- ✅ Year-based format
- ✅ Auto-increment counter
- ✅ Thread-safe (uses DB transaction)
**Issues**: None ✅

---

### 3. poNumberGenerator.js ✅
**generatePONumber()** - Sequential numbering (PO-YYYY-XXXXX)
- ✅ Year-based format
- ✅ Auto-increment counter
- ✅ Thread-safe (uses DB transaction)
**Issues**: None ✅

---

## Configuration Analysis

### server.js Configuration

**Middleware Stack** (in order):
1. ✅ Helmet (security headers)
2. ✅ CORS (configurable origin)
3. ✅ General rate limiter (100 req/15 min)
4. ✅ Body parser (10MB limit, JSON)
5. ✅ Health check endpoint (GET /api/health)
6. ✅ Auth rate limiter (10 req/15 min)
7. ✅ Route handlers
8. ✅ 404 handler
9. ✅ Error handler

**Issues**:
- ⚠️ CORS origin hardcoded with fallback (okay for dev)
- ⚠️ Rate limiters are memory-based (not distributed)
- ⚠️ No request logging middleware

---

## Database Connection

### db.js Configuration
- ✅ Connection pooling (10 connections, queue limit 0)
- ✅ Prepared statements (mysql2/promise)
- ✅ Error logging on pool establishment
**Issues**: None ✅

---

## Error Handling Assessment

**Missing Error Cases**:
1. ⚠️ **Transaction rollback** - Some endpoints don't properly rollback on nested failures
2. ⚠️ **Database connection errors** - Not all queries have try-catch
3. ⚠️ **File upload errors** - No multer or file handling
4. ⚠️ **Puppeteer timeout** - PDF generation has no timeout

---

## Performance Analysis

### Database Queries
- ✅ Most queries use JOINs efficiently
- ✅ Prepared statements prevent parsing overhead
- ⚠️ **Missing indexes** on (status, created_at) for filters
- ⚠️ **N+1 queries** in some endpoints (e.g., vendor loops)

### Memory Usage
- ⚠️ **HIGH**: Puppeteer spawns browser instance per invoice (100+ MB each)
- ⚠️ **MEDIUM**: No connection pooling limits on concurrent requests
- ✅ **GOOD**: Async/await prevents blocking

### Response Times (Estimated)
- ✅ Auth endpoints: 50-100ms
- ✅ List endpoints: 50-200ms
- ⚠️ PDF generation: 2-5 seconds (Puppeteer overhead)
- ⚠️ Email sending: 1-3 seconds (SMTP)

**Recommendation**: Cache PDFs, implement background jobs for emails

---

## Testing & Quality

**Code Quality**:
- ✅ Consistent error response format
- ✅ Proper HTTP status codes
- ✅ Input validation on all public routes
- ⚠️ No unit tests found
- ⚠️ No integration tests found

**Logging**:
- ✅ Console.error for failures
- ✅ Activity logs in database
- ⚠️ No structured logging (no Winston/Pino)
- ⚠️ No request ID tracking

---

## Critical Issues Summary

| Issue | Severity | File | Fix |
|-------|----------|------|-----|
| password_reset_tokens table missing | 🔴 CRITICAL | authService.js | Merge migration into schema.sql |
| Puppeteer memory leak risk | 🔴 CRITICAL | pdfService.js | Implement connection pooling + caching |
| No email delivery tracking | ⚠️ HIGH | emailService.js | Add delivery status table |
| No account lockout | ⚠️ MEDIUM | authController.js | Track failed attempts |
| PDF generation timeout | ⚠️ MEDIUM | pdfService.js | Add 30s timeout |
| Silent email failures | ⚠️ MEDIUM | emailService.js | Log failures visible to users |
| No database indexes for filters | ⚠️ MEDIUM | schema.sql | Add composite indexes |

---

## Deployment Readiness

**Production Ready**: ⚠️ **CONDITIONAL**

✅ **READY**:
- Authentication & authorization
- Database operations
- API routing & validation
- Error handling framework
- Security headers & CORS

⚠️ **NEEDS FIXES**:
- Password reset flow (blocked by schema issue)
- PDF generation (memory/performance)
- Email reliability (no retry)
- Database indexing (performance)

🔴 **BLOCKERS**:
- password_reset_tokens table not in base schema

---

## Recommendations

### Before Production
1. 🔴 Fix password_reset_tokens blocker
2. 🔴 Implement Puppeteer connection pool with caching
3. ⚠️ Add email retry logic with exponential backoff
4. ⚠️ Add database indexes for status/created_at
5. ⚠️ Implement account lockout after 5 failed attempts

### Post-Launch
6. Add structured logging (Winston/Pino)
7. Implement monitoring & alerting
8. Add integration tests
9. Performance profiling & optimization
10. GDPR compliance audit (email opt-outs, data deletion)

---

## Conclusion

**Backend Quality**: 🟢 **GOOD** (with critical blocker)

The backend is well-structured with proper separation of concerns, comprehensive validation, and good security practices. However, the password reset functionality is completely blocked by a schema issue, and PDF generation has serious performance implications.

**Score**: 8/10 (9/10 after fixes)

