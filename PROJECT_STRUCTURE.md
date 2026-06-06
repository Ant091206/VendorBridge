# VendorBridge ERP — Project Structure Audit

## Overview
VendorBridge is a full-stack procurement and vendor management ERP system built with React (Vite), Node.js (Express), and MySQL. The project follows a monorepo structure with separate frontend and backend folders.

---

## Root-Level Structure

```
vendorbridge/
├── README.md                          # Project documentation and quick start guide
├── package.json                       # Root workspace package manager (concurrently)
├── backend/                           # Node.js + Express API server
├── vendorbridge-client/               # React + Vite frontend application
└── database/                          # Database schema and migrations
```

---

## Backend Architecture (`/backend`)

### Purpose
RESTful API server handling authentication, vendor management, RFQ workflows, quotations, approvals, purchase orders, invoices, reporting, and activity logging.

### Directory Structure

```
backend/
├── server.js                          # Express app initialization with routing & middleware
├── package.json                       # Node.js dependencies (Express, JWT, MySQL, etc.)
├── Procfile                           # Railway deployment configuration
├── railway.json                       # Railway environment setup
├── resetAndSeedAuth.js                # Database initialization + demo data seed
├── seed.js                            # Alternative seeding script
├── config/
│   └── db.js                          # MySQL connection pool configuration
├── controllers/                       # Business logic handlers for routes
│   ├── authController.js              # Registration, login, forgot/reset password
│   ├── userController.js              # User CRUD (admin user management)
│   ├── vendorController.js            # Vendor management CRUD + categories
│   ├── rfqController.js               # RFQ creation, editing, closure, assignment
│   ├── quotationController.js         # Vendor quotation submission & updates
│   ├── approvalController.js          # Manager approval/rejection workflows
│   ├── purchaseOrderController.js     # PO retrieval and status management
│   ├── invoiceController.js           # Invoice generation, PDF, email, status
│   ├── activityLogController.js       # Audit trail queries and filtering
│   └── reportController.js            # Analytics, dashboards, CSV exports
├── routes/                            # HTTP endpoint definitions with validation
│   ├── auth.js                        # POST /api/auth/* (register, login, forgot-password)
│   ├── users.js                       # GET/POST /api/users
│   ├── vendors.js                     # GET/POST/PUT/DELETE /api/vendors
│   ├── rfqs.js                        # GET/POST/PUT /api/rfqs
│   ├── quotations.js                  # GET/POST/PUT /api/quotations
│   ├── approvals.js                   # GET/PUT /api/approvals
│   ├── purchaseOrders.js              # GET/PUT /api/purchase-orders
│   ├── invoices.js                    # GET/POST /api/invoices
│   ├── activityLogs.js                # GET /api/activity-logs
│   └── reports.js                     # GET /api/reports
├── middleware/
│   ├── authMiddleware.js              # JWT verification (verifyToken) & role-based access (restrictTo)
│   ├── validateRequest.js             # Schema validation for request bodies
│   ├── errorHandler.js                # Global error response formatting
│   └── notFound.js                    # 404 handler for undefined routes
├── services/
│   ├── authService.js                 # Password reset token generation & validation
│   ├── emailService.js                # Nodemailer SMTP integration (Gmail)
│   └── pdfService.js                  # Puppeteer invoice PDF generation
├── utils/
│   ├── activityLogger.js              # Activity log insertion helper
│   ├── invoiceNumberGenerator.js      # Auto-incrementing invoice ID generation
│   └── poNumberGenerator.js           # Auto-incrementing purchase order ID generation
└── database/
    ├── schema.sql                     # Base database schema (10 tables)
    └── migration_001_auth_module.sql  # Auth-related schema enhancements
```

### Key Features Implemented
- **Authentication**: JWT-based with bcrypt password hashing
- **Rate Limiting**: 100 req/15min general, 10 req/15min for auth routes
- **Security**: Helmet headers, CORS configuration, input validation
- **Database**: MySQL connection pooling with prepared statements
- **Email**: Nodemailer for RFQ invitations & invoice distribution
- **PDF**: Puppeteer for invoice PDF rendering
- **Activity Logging**: Comprehensive audit trail for all transactions

---

## Frontend Architecture (`/vendorbridge-client`)

### Purpose
React + Vite single-page application with Tailwind CSS for responsive UI. Implements role-based dashboards, vendor portals, quotation management, and analytics.

### Directory Structure

```
vendorbridge-client/
├── package.json                       # Frontend dependencies (React, Vite, Tailwind)
├── vite.config.js                     # Vite bundler configuration
├── postcss.config.js                  # PostCSS + Tailwind CSS setup
├── eslint.config.js                   # ESLint linting rules
├── index.html                         # Main HTML entry point
├── public/                            # Static assets
├── src/
│   ├── main.jsx                       # React app entry point
│   ├── App.jsx                        # Route definitions & page imports
│   ├── App.css                        # Global styles
│   ├── index.css                      # Base Tailwind CSS & global utilities
│   ├── api/
│   │   ├── axios.js                   # Axios instance with JWT interceptors
│   │   ├── userApi.js                 # User management API calls
│   │   ├── vendorApi.js               # Vendor CRUD API calls
│   │   ├── rfqApi.js                  # RFQ operations API
│   │   ├── quotationApi.js            # Quotation submission API
│   │   ├── approvalApi.js             # Approval queue API
│   │   ├── poApi.js                   # Purchase order API
│   │   ├── invoiceApi.js              # Invoice generation & retrieval
│   │   ├── reportApi.js               # Analytics & reporting API
│   │   └── activityApi.js             # Activity log API
│   ├── assets/                        # Images, icons, media files
│   ├── components/
│   │   ├── Layout.jsx                 # Main layout wrapper (Sidebar + Navbar + Content)
│   │   ├── Navbar.jsx                 # Top navigation bar
│   │   ├── Sidebar.jsx                # Left sidebar navigation
│   │   ├── AppLoader.jsx              # Full-page loading spinner
│   │   ├── LoadingSkeleton.jsx        # Skeleton loaders for data
│   │   ├── Spinner.jsx                # Inline spinner component
│   │   ├── Badge.jsx                  # Status badge component
│   │   ├── StatCard.jsx               # KPI card component
│   │   ├── Toast.jsx                  # Toast notification component
│   │   ├── ApproveModal.jsx           # Modal for approval actions
│   │   ├── RejectModal.jsx            # Modal for rejection actions
│   │   ├── ConfirmModal.jsx           # Generic confirmation modal
│   │   ├── EmptyState.jsx             # Empty result state placeholder
│   │   ├── PageHeader.jsx             # Page title & breadcrumb
│   │   ├── NotificationBell.jsx       # Real-time notification indicator
│   │   └── auth/                      # Authentication components
│   │       ├── ProtectedRoute.jsx     # Route guard for authenticated pages
│   │       └── [other auth UI]
│   ├── context/
│   │   └── AuthContext.jsx            # Global auth state (user, token, login/logout)
│   ├── hooks/
│   │   └── usePageTitle.js            # Custom hook for document title
│   ├── pages/
│   │   ├── Login.jsx                  # Public login page
│   │   ├── Register.jsx               # Public registration page
│   │   ├── Dashboard.jsx              # Role-specific dashboard (Admin/Officer/Manager)
│   │   ├── VendorPortal.jsx           # Vendor-only dashboard
│   │   ├── NotFound.jsx               # 404 page
│   │   ├── ActivityLogs.jsx           # Admin audit trail viewer
│   │   ├── Reports.jsx                # Analytics & reporting dashboard
│   │   ├── auth/
│   │   │   ├── Login.jsx              # Login form
│   │   │   ├── Register.jsx           # Registration form
│   │   │   ├── ForgotPassword.jsx     # Password reset request
│   │   │   └── ResetPassword.jsx      # Password reset form
│   │   ├── users/
│   │   │   ├── UserList.jsx           # Admin user management
│   │   │   ├── UserCreate.jsx         # Create new user
│   │   │   ├── UserEdit.jsx           # Edit user details
│   │   │   └── Profile.jsx            # User profile management
│   │   ├── vendors/
│   │   │   ├── VendorList.jsx         # Vendor list with filters
│   │   │   ├── VendorDetail.jsx       # Vendor profile view
│   │   │   ├── AddVendor.jsx          # Create vendor form
│   │   │   └── EditVendor.jsx         # Edit vendor form
│   │   ├── rfqs/
│   │   │   ├── RFQList.jsx            # RFQ list with search
│   │   │   ├── RFQDetail.jsx          # RFQ details & assigned vendors
│   │   │   ├── CreateRFQ.jsx          # RFQ creation form
│   │   │   └── EditRFQ.jsx            # RFQ editing form
│   │   ├── quotations/
│   │   │   ├── QuotationList.jsx      # Officer view of all quotations
│   │   │   └── QuotationComparison.jsx # Side-by-side bid comparison
│   │   ├── vendor/
│   │   │   ├── SubmitQuote.jsx        # Vendor quotation submission
│   │   │   ├── EditQuote.jsx          # Edit submitted quotation
│   │   │   ├── VendorPOList.jsx       # Vendor's purchase orders
│   │   │   └── VendorInvoices.jsx     # Vendor's invoices
│   │   ├── approvals/
│   │   │   ├── ApprovalQueue.jsx      # Manager approval queue
│   │   │   └── ApprovalDetail.jsx     # Approval decision page
│   │   ├── purchaseOrders/
│   │   │   ├── POList.jsx             # All POs (officer/admin)
│   │   │   └── PODetail.jsx           # PO details with line items
│   │   └── invoices/
│   │       ├── InvoiceList.jsx        # Invoice list
│   │       ├── InvoiceDetail.jsx      # Invoice details & PDF download
│   │       └── GenerateInvoice.jsx    # Generate invoice from PO
│   └── utils/
│       ├── downloadCSV.js             # CSV export utility
│       └── downloadPDF.js             # PDF download helper
```

### Key Features Implemented
- **Routing**: React Router v7 with protected routes and role-based redirects
- **State Management**: React Context API for global authentication
- **Styling**: Tailwind CSS v4 with PostCSS for responsive design
- **Charts**: Recharts for dashboard analytics (bar, pie, line charts)
- **Forms**: React Hook Form for validation and submission
- **HTTP Client**: Axios with JWT token interceptors
- **Loading States**: Skeleton loaders and spinners for UX
- **Notifications**: Toast messages for success/error feedback

---

## Database Architecture (`/database`)

### Purpose
MySQL schema defining all tables, relationships, constraints, and initial seed data.

### Files
- **schema.sql**: Base schema with 10 core tables
- **migration_001_auth_module.sql**: Authentication enhancements (status, last_login, password_reset_tokens)
- **seed.js**: Node.js script to populate demo data

### Tables (11 total)
1. **users** - System users with roles (admin, officer, vendor, manager)
2. **vendors** - Vendor company profiles
3. **vendor_categories** - Vendor classification
4. **rfqs** - Request for Quotations
5. **rfq_vendors** - Junction table (many-to-many: RFQs ↔ Vendors)
6. **quotations** - Vendor bids on RFQs
7. **approvals** - Manager approval records
8. **purchase_orders** - Auto-generated from approved quotations
9. **invoices** - Tax invoices from purchase orders
10. **activity_logs** - Audit trail of all actions
11. **password_reset_tokens** - Single-use reset tokens

---

## Module Dependencies

### Authentication Module
- **Files**: authController.js, authMiddleware.js, authService.js, auth.js route
- **Dependencies**: bcryptjs, jsonwebtoken, nodemailer

### Vendor Management Module
- **Files**: vendorController.js, vendors.js route
- **Dependencies**: None (core DB operations)

### RFQ Module
- **Files**: rfqController.js, rfqs.js route, emailService.js
- **Dependencies**: nodemailer for email notifications

### Quotation Module
- **Files**: quotationController.js, quotations.js route
- **Dependencies**: Database transactions

### Approval Workflow
- **Files**: approvalController.js, approvals.js route, poNumberGenerator.js
- **Dependencies**: Purchase order auto-generation

### Purchase Order Module
- **Files**: purchaseOrderController.js, purchaseOrders.js route
- **Dependencies**: Approval workflow

### Invoice Module
- **Files**: invoiceController.js, invoices.js route, pdfService.js, emailService.js
- **Dependencies**: Puppeteer for PDF, Nodemailer for email

### Activity Logging
- **Files**: activityLogController.js, activityLogs.js route, activityLogger.js utility
- **Dependencies**: None (async logging)

### Reporting & Analytics
- **Files**: reportController.js, reports.js route
- **Dependencies**: None (read-only queries)

---

## Environment & Configuration

### Backend Environment Variables
- `PORT`: Server port (default: 5000)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: MySQL credentials
- `JWT_SECRET`: JWT signing key
- `JWT_EXPIRES_IN`: Token expiry (default: 7d)
- `EMAIL_USER`, `EMAIL_PASS`: Gmail SMTP credentials
- `FRONTEND_URL`: CORS origin
- `NODE_ENV`: development/production

### Frontend Environment Variables
- `VITE_API_URL`: Backend API base URL

---

## Build & Deployment

### Development
```bash
npm install:all          # Install all dependencies
npm run dev              # Concurrent dev server (frontend + backend)
```

### Production
- **Backend**: Deployed on Railway with Procfile
- **Frontend**: Built with Vite and deployed on Vercel

---

## Code Quality & Standards

### Validation
- Custom request validation middleware (validateRequest.js)
- Input sanitization via prepared SQL statements
- Email regex validation
- Positive number validation for quantities/prices

### Error Handling
- Global error handler middleware
- Consistent JSON error responses
- Stack traces in development mode only

### Logging
- Console logs for debugging
- Activity audit trail in database
- Error logging to stderr

---

## Summary

**Total Files**: ~100+
**Backend Routes**: 10 main route files (60+ endpoints)
**Frontend Pages**: 25+ pages with lazy loading
**Database Tables**: 11 tables with foreign keys and indexes
**Services**: 3 core services (auth, email, PDF)
**Utilities**: 3 helper utilities
**Middleware**: 4 middleware functions

The architecture follows RESTful principles, maintains separation of concerns, and implements security best practices for a production-grade ERP system.
