# VendorBridge — Procurement & Vendor Management ERP

VendorBridge is a full-stack Enterprise Resource Planning (ERP) system built for the Odoo Hackathon. It digitizes end-to-end procurement operations for organizations — from vendor registration and RFQ creation to quotation comparison, approval workflows, purchase order generation, and invoice management.

## Features

- **Role-Based Authentication** — Four distinct roles (Admin, Procurement Officer, Manager, Vendor) with granular access control
- **Vendor Management** — Full CRUD operations, GST tracking, category-based classification, soft delete
- **RFQ Module** — Create, edit, close, and assign vendors to Requests for Quotation with automated email notifications
- **Vendor Portal** — Dedicated vendor dashboard to view invitations, submit quotes, and track orders
- **Quotation Submission** — Vendors submit competitive bids with unit price, delivery timeline, and notes
- **Quotation Comparison** — Side-by-side bid comparison with lowest price and fastest delivery highlights
- **Approval Workflow** — Manager reviews, approves or rejects with remarks; auto-reverts state on rejection
- **Purchase Orders** — Auto-generated on approval with sequential numbering and GST calculation
- **Invoice Generation** — Create tax invoices from POs with 18% GST, professional PDF rendering
- **PDF Export** — Puppeteer-rendered, print-ready invoice documents
- **Email Notifications** — Nodemailer-powered RFQ invites, winner/rejection alerts, invoice delivery
- **Activity Logs** — Complete audit trail with filtering, timeline view, and role-based access
- **Reports & Analytics** — Dashboard KPIs, monthly spending charts, vendor performance, RFQ conversion metrics
- **CSV Export** — Download vendor, PO, and invoice data for external analysis

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MySQL |
| Authentication | JWT + bcryptjs |
| PDF Generation | Puppeteer |
| Email | Nodemailer (Gmail SMTP) |
| Charts | Recharts |

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vendorbridge.com | Admin@123 |
| Procurement Officer | officer@vendorbridge.com | Officer@123 |
| Manager / Approver | manager@vendorbridge.com | Manager@123 |
| Vendor | vendor1@vendorbridge.com | Vendor@123 |

> Additional vendor accounts: `vendor2@vendorbridge.com` and `vendor3@vendorbridge.com` (password: `Vendor@123`)

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Backend Setup

```bash
cd vendorbridge-server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database and email credentials

# Initialize database and seed demo data
node database/seed.js

# Start server
npm start
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd vendorbridge-client

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set VITE_API_URL to your backend URL

# Start dev server
npm run dev
```

Frontend runs on `http://localhost:5173`

### Seed Data

The project includes a comprehensive seed script that populates the database with:
- 6 users (all 4 roles)
- 6 vendor categories
- 5 vendor companies
- 3 RFQs in different stages (closed, approved, open)
- 6 quotations with varied statuses
- 2 approvals (approved)
- 2 purchase orders
- 1 invoice
- 10 activity log entries

Run with: `node database/seed.js`

Or use the SQL file: `mysql -u root -p vendorbridge < database/seed.sql`

## Project Structure

```
vendorbridge/
├── vendorbridge-server/
│   ├── config/
│   │   └── db.js                    # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js        # Login, register
│   │   ├── vendorController.js      # Vendor CRUD + categories
│   │   ├── rfqController.js         # RFQ management
│   │   ├── quotationController.js   # Quotation submission + comparison
│   │   ├── approvalController.js    # Approve / reject workflow
│   │   ├── purchaseOrderController.js # PO generation + status
│   │   ├── invoiceController.js     # Invoice creation + PDF + email
│   │   ├── reportController.js      # Analytics + CSV export
│   │   └── activityLogController.js # Audit trail
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification + role guards
│   │   ├── validateRequest.js       # Input validation rules
│   │   ├── errorHandler.js          # Global error handling
│   │   └── notFound.js              # 404 handler
│   ├── routes/
│   │   ├── auth.js
│   │   ├── vendors.js
│   │   ├── rfqs.js
│   │   ├── quotations.js
│   │   ├── approvals.js
│   │   ├── purchaseOrders.js
│   │   ├── invoices.js
│   │   ├── reports.js
│   │   └── activityLogs.js
│   ├── services/
│   │   ├── emailService.js          # Nodemailer integration
│   │   └── pdfService.js            # Puppeteer PDF generation
│   ├── utils/
│   │   ├── activityLogger.js        # Activity log helper
│   │   ├── poNumberGenerator.js     # Sequential PO numbering
│   │   └── invoiceNumberGenerator.js # Sequential invoice numbering
│   ├── database/
│   │   ├── schema.sql               # Full DB schema
│   │   ├── seed.sql                 # SQL seed data
│   │   └── seed.js                  # Node.js seed script
│   ├── server.js                    # Express app entry point
│   └── package.json
│
└── vendorbridge-client/
    └── src/
        ├── api/
        │   ├── axios.js              # Axios instance with interceptors
        │   ├── vendorApi.js
        │   ├── rfqApi.js
        │   ├── quotationApi.js
        │   ├── approvalApi.js
        │   ├── poApi.js
        │   ├── invoiceApi.js
        │   ├── reportApi.js
        │   └── activityApi.js
        ├── components/
        │   ├── Layout.jsx             # Sidebar + Navbar + content
        │   ├── Sidebar.jsx            # Role-based navigation
        │   ├── Navbar.jsx             # Top bar + user dropdown
        │   ├── PageHeader.jsx         # Reusable page header
        │   ├── StatCard.jsx           # Animated KPI card
        │   ├── EmptyState.jsx         # Empty data placeholder
        │   ├── LoadingSkeleton.jsx    # Table loading placeholder
        │   ├── Toast.jsx              # Notification toasts
        │   ├── Spinner.jsx            # Loading spinner
        │   ├── Badge.jsx              # Status badge
        │   ├── NotificationBell.jsx   # Notification dropdown
        │   ├── ApproveModal.jsx       # Approval confirm dialog
        │   ├── RejectModal.jsx        # Rejection dialog
        │   ├── ConfirmModal.jsx       # Generic confirm dialog
        │   └── AppLoader.jsx          # Initial loading screen
        ├── context/
        │   └── AuthContext.jsx        # Auth state management
        ├── hooks/
        │   └── usePageTitle.js        # Document title updater
        ├── pages/
        │   ├── Login.jsx
        │   ├── Dashboard.jsx          # Role-specific dashboard
        │   ├── VendorPortal.jsx       # Vendor dashboard
        │   ├── ActivityLogs.jsx       # Audit trail viewer
        │   ├── Reports.jsx            # Analytics + charts
        │   ├── NotFound.jsx           # 404 page
        │   ├── vendors/
        │   │   ├── VendorList.jsx
        │   │   ├── AddVendor.jsx
        │   │   ├── EditVendor.jsx
        │   │   └── VendorDetail.jsx
        │   ├── rfqs/
        │   │   ├── RFQList.jsx
        │   │   ├── CreateRFQ.jsx
        │   │   ├── EditRFQ.jsx
        │   │   └── RFQDetail.jsx
        │   ├── quotations/
        │   │   ├── QuotationList.jsx
        │   │   └── QuotationComparison.jsx
        │   ├── approvals/
        │   │   ├── ApprovalQueue.jsx
        │   │   └── ApprovalDetail.jsx
        │   ├── purchaseOrders/
        │   │   ├── POList.jsx
        │   │   └── PODetail.jsx
        │   ├── invoices/
        │   │   ├── InvoiceList.jsx
        │   │   ├── InvoiceDetail.jsx
        │   │   └── GenerateInvoice.jsx
        │   └── vendor/
        │       ├── SubmitQuote.jsx
        │       ├── EditQuote.jsx
        │       ├── VendorPOList.jsx
        │       └── VendorInvoices.jsx
        ├── utils/
        │   ├── downloadPDF.js
        │   └── downloadCSV.js
        └── App.jsx                    # Router + lazy loading
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `DB_HOST` | MySQL host |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | MySQL database name |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | Token expiration (default: 7d) |
| `EMAIL_USER` | Gmail address for sending emails |
| `EMAIL_PASS` | Gmail app password (not regular password) |
| `FRONTEND_URL` | Frontend URL for CORS |
| `NODE_ENV` | Environment (development/production) |

### Frontend (`vendorbridge-client/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |
| `VITE_APP_NAME` | Application name |

## Deployment

### Backend — Railway

1. Push to GitHub
2. Connect Railway to your repo
3. Set environment variables in Railway dashboard
4. Railway auto-deploys from `Procfile` and `railway.json`

Puppeteer is configured for Railway Linux with `--no-sandbox` flags.

### Frontend — Vercel

1. Push to GitHub
2. Connect Vercel to your repo (root: `vendorbridge-client`)
3. Set `VITE_API_URL` to your Railway backend URL
4. `vercel.json` handles React Router SPA routing

### Database — Railway MySQL

1. Add MySQL plugin in Railway dashboard
2. Copy connection credentials
3. Update backend `.env` with Railway MySQL credentials
4. Run `node database/seed.js` one-time to populate data

## API Endpoints

### Authentication
`POST /api/auth/register` — Register new user
`POST /api/auth/login` — Login, returns JWT

### Vendors
`GET /api/vendors` — List all vendors
`GET /api/vendors/:id` — Vendor details
`POST /api/vendors` — Create vendor (admin)
`PUT /api/vendors/:id` — Update vendor (admin)
`DELETE /api/vendors/:id` — Soft delete vendor (admin)
`GET /api/vendor-categories` — List categories
`POST /api/vendor-categories` — Create category (admin)

### RFQs
`GET /api/rfqs` — List RFQs
`GET /api/rfqs/:id` — RFQ details
`POST /api/rfqs` — Create RFQ (officer)
`PUT /api/rfqs/:id` — Update RFQ (officer)
`PUT /api/rfqs/:id/close` — Close RFQ
`DELETE /api/rfqs/:id` — Delete draft RFQ
`GET /api/rfqs/:id/vendors` — Assigned vendors with status
`GET /api/vendor/my-rfqs` — Vendor's assigned RFQs

### Quotations
`POST /api/quotations` — Submit quotation (vendor)
`PUT /api/quotations/:id` — Edit quotation (vendor)
`GET /api/quotations/my-quotations` — My submitted quotes
`GET /api/quotations/rfq/:rfq_id` — Quotes for an RFQ (staff)
`GET /api/quotations` — All quotations (staff)
`GET /api/quotations/:id` — Quotation details
`PUT /api/quotations/:id/select` — Select winner (officer)

### Approvals
`GET /api/approvals` — All approvals (manager)
`GET /api/approvals/pending` — Pending approvals (manager)
`GET /api/approvals/:id` — Approval details
`PUT /api/approvals/:id/approve` — Approve + generate PO
`PUT /api/approvals/:id/reject` — Reject + revert state

### Purchase Orders
`GET /api/purchase-orders` — All POs
`GET /api/purchase-orders/vendor/my-orders` — Vendor's POs
`GET /api/purchase-orders/:id` — PO details
`PUT /api/purchase-orders/:id/status` — Update PO status

### Invoices
`POST /api/invoices/generate/:po_id` — Generate invoice from PO
`GET /api/invoices` — All invoices
`GET /api/invoices/vendor/my-invoices` — Vendor's invoices
`GET /api/invoices/:id` — Invoice details
`GET /api/invoices/:id/pdf` — Download PDF
`POST /api/invoices/:id/send-email` — Email PDF to vendor
`PUT /api/invoices/:id/status` — Update status

### Reports
`GET /api/reports/dashboard-stats` — KPI summary
`GET /api/reports/monthly-spending` — Monthly spend data
`GET /api/reports/vendor-performance` — Vendor metrics
`GET /api/reports/rfq-analytics` — RFQ conversion stats
`GET /api/reports/spending-by-category` — Category breakdown
`GET /api/reports/top-vendors` — Top 5 by value
`GET /api/reports/export/vendors` — CSV export
`GET /api/reports/export/purchase-orders` — CSV export
`GET /api/reports/export/invoices` — CSV export

### Activity Logs
`GET /api/activity-logs` — All logs (admin)
`GET /api/activity-logs/recent` — Recent 20 logs
`GET /api/activity-logs/my-activity` — Current user's logs

## Architecture Decisions

- **JWT for auth** — Stateless, scalable, works across stateless servers
- **Role-based middleware** — `verifyToken` + `restrictTo` pattern for clean route protection
- **MySQL transactions** — Used for RFQ creation, quotation selection, approval, and invoice generation
- **Sequential numbering** — PO and invoice numbers generated via DB queries within transactions
- **Puppeteer for PDF** — Headless Chrome renders professional invoices with exact CSS styling
- **Axios interceptors** — Global 401 handling with automatic session cleanup
- **React.lazy** — Code splitting for all 26+ page components

## License

Built for the Odoo Hackathon. VendorBridge ERP.
