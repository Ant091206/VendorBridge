# VendorBridge ERP

VendorBridge is a comprehensive, production-ready full-stack Enterprise Resource Planning (ERP) system designed to automate procurement operations, optimize vendor collaborations, and deliver end-to-end visibility throughout the procurement lifecycle. It replaces traditional, manual, error-prone workflows (relying on scattered spreadsheets and email chains) with a highly structured, automated, and secure digital platform.

The system was originally built as a practical, high-impact solution for the **Odoo Hackathon**, customized for **Hari Krupa Engineering Pvt Ltd**.

---

## 🚀 Key Features

* **Secure Authentication & RBAC**: Advanced JWT authentication with password strength validation (`bcryptjs`) and secure role-based access control (guards for `admin`, `officer`, `manager`, `vendor`, and `finance`).
* **Interactive Vendor Management**: Dynamic supplier database, categories division, and onboarding tracking with detailed profile management.
* **Streamlined RFQ Workflow**: Automated Request for Quotation (RFQ) creation, category assignment, and email dispatches to relevant suppliers.
* **Side-by-Side Bid Comparison**: Interactive matrix for procurement officers to compare multi-vendor bids, pricing breakdown, and delivery times.
* **Structured Approval Routing**: Winner selection locking, rejection rollback capability, and supervisor approval logs.
* **Automated Document Generation**: Real-time generation of formatted sequential Purchase Orders (`PO-YYYY-XXXX`) and Tax Invoices with standard GST.
* **PDF Invoice Compiler**: Server-side rendering (using headless Puppeteer) of downloadable tax invoices with print-friendly CSS.
* **Audit Trail**: Real-time activity logger recording system transactions, user logins, RFQ actions, and order status updates.
* **Advanced Reports & Analytics**: Live Recharts dashboards displaying category-wise spend, vendor fulfillment rates, conversion metrics, decision times, and CSV/Excel data export modules.

---

## 🛠️ Tech Stack

### Frontend
* **Core**: React (Vite-powered SPA, ES Modules)
* **Routing**: React Router DOM (v7)
* **State & Forms**: Context API, React Hook Form
* **Charts**: Recharts
* **Animations**: Framer Motion
* **Styling**: Tailwind CSS & Vanilla CSS (modern layout, responsive variables)
* **HTTP Client**: Axios

### Backend
* **Runtime**: Node.js
* **Framework**: Express.js
* **Security**: Helmet, CORS, Express Rate Limit
* **Database Driver**: MySQL2 (with connection pooling)
* **Auth**: JSON Web Tokens (JWT), BcryptJS
* **Mailing**: Nodemailer (SMTP/Gmail integration)
* **PDF Generation**: Puppeteer

### Database
* **Engine**: MySQL (8.0+)
* **Migrations**: Sequential SQL schema scripts

---

## 📂 Folder Structure

```
VendorBridge/
├── backend/                  # Node.js + Express backend server
│   ├── config/               # Database connection configuration
│   ├── controllers/          # Request handler controllers
│   ├── middleware/           # Express middlewares (auth, validation, errors)
│   ├── routes/               # API route definitions
│   ├── services/             # Core business logic services (emails, PDFs)
│   ├── utils/                # Helper utilities (activity logger, PO/invoice generators)
│   ├── validators/           # Request body validators
│   ├── uploads/              # File uploads folder (empty, tracked)
│   ├── server.js             # API entrypoint
│   └── package.json          # Backend package dependencies
├── database/                 # Database schema and sql migrations
│   ├── migration_001_auth_module.sql
│   ├── migration_002_vendor_rfq_modules.sql
│   ├── migration_003_quotations_comparison.sql
│   ├── migration_004_approvals_po_invoice.sql
│   ├── schema.sql            # Core database schema
│   ├── seed.js               # Standard seed script (JS)
│   └── seed.sql              # Standard seed SQL data
├── docs/                     # Project audits, reports, and checklists
├── tests/                    # Developer test scripts (APIs, workflows, metrics)
├── vendorbridge-client/      # React + Vite frontend application
│   ├── src/
│   │   ├── api/              # Axios API service clients
│   │   ├── assets/           # Frontend static assets
│   │   ├── components/       # Reusable React UI components
│   │   ├── context/          # Auth context state provider
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # React page components (views)
│   │   ├── utils/            # Client-side price calculator and helpers
│   │   ├── App.jsx           # Client entry routes definition
│   │   └── main.jsx          # Client DOM mount
│   ├── index.html            # HTML entry point
│   ├── package.json          # Frontend package dependencies
│   └── vite.config.js        # Vite build tool config
├── package.json              # Root workspace orchestrator (concurrently)
└── .gitignore                # Root-level ignore rules
```

---

## ⚙️ Installation

### 1. Clone Repository
```bash
git clone https://github.com/Ant091206/VendorBridge.git
cd VendorBridge
```

### 2. Install Dependencies
Restore dependencies for the root orchestrator, backend server, and frontend client:
```bash
npm run install:all
```

---

## 🔑 Environment Variables

To run the application, configure your environments using `.env` files in their respective folders.

### Backend (`/backend/.env`)
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=vendorbridge
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
JWT_EXPIRES_IN=7d
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend (`/vendorbridge-client/.env`)
Create a `.env` file in the `vendorbridge-client/` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=VendorBridge
```

---

## 💾 Database Setup

Ensure MySQL Server is running locally.

### 1. Initialize Database Schema
Execute the consolidated schema file to initialize the `vendorbridge` database and tables structure:
```bash
# Using command-line client
mysql -u root -p < database/schema.sql

# OR running the backend initialization helper
node backend/dbInit.js
```

### 2. Apply Migrations (if applicable)
Apply modules migrations in chronological order:
```bash
mysql -u root -p vendorbridge < database/migration_001_auth_module.sql
mysql -u root -p vendorbridge < database/migration_002_vendor_rfq_modules.sql
mysql -u root -p vendorbridge < database/migration_003_quotations_comparison.sql
mysql -u root -p vendorbridge < database/migration_004_approvals_po_invoice.sql
```

### 3. Seed Database
You can populate the database using either the standard sample dataset or the high-fidelity demo dataset.

#### Standard Sample Dataset:
```bash
npm run seed
```

#### Massive High-Fidelity Dataset (6 months of activity history):
```bash
npm run seed:massive
```

---

## 🏃 Running the Project

### Development Mode
Start both backend API server and frontend client concurrently:
```bash
npm run dev
```
* **Frontend Site**: [http://localhost:5173](http://localhost:5173)
* **Backend API Docs/Base**: [http://localhost:5000](http://localhost:5000)

### Production Build & Preview
To compile the frontend application for production and view it locally:
```bash
cd vendorbridge-client
npm run build
npm run preview
```

---

## 📐 Build & Deployment

### Build Instructions
To build the frontend production-ready files:
```bash
cd vendorbridge-client
npm run build
```
This outputs compiled, optimized HTML/CSS/JS assets to the `vendorbridge-client/dist/` directory.

### Deployment Guide
* **Backend**: Configured for Railway (`railway.json` and `Procfile` included) or Heroku. Ensure you configure environment variables on the hosting platform.
* **Frontend**: Can be hosted on Vercel (`vercel.json` included), Netlify, or AWS S3. Connect build command to `npm run build` with output directory set to `dist`.

---

## 📊 API Overview

| Method | Endpoint | Description | Role Allowed |
|---|---|---|---|
| **POST** | `/api/auth/register` | Create a new user profile | Public |
| **POST** | `/api/auth/login` | Authenticate user and get JWT | Public |
| **GET** | `/api/vendors` | List all suppliers | admin, officer, manager, vendor |
| **POST** | `/api/rfqs` | Publish a new RFQ | admin, officer |
| **POST** | `/api/quotations` | Submit quotation for RFQ | vendor |
| **GET** | `/api/approvals/queue` | Retrieve pending winner approvals | admin, manager |
| **POST** | `/api/invoices/generate/:poId`| Generate invoice from PO | admin, finance |

---

## 🖼️ Screenshots

*Screenshots demonstrating the dashboards, matrices, and layouts can be placed here during deployment.*

---

## 🔮 Future Improvements

* **AI-based Vendor Scoring**: Dynamically score vendors based on past delivery speed and pricing consistency.
* **SMS Notifications Integration**: Integrated SMS updates alongside Nodemailer SMTP.
* **Multi-Warehouse Stock Mapping**: Add support for cross-warehouse shipping lines inside RFQs.

---

## 👥 Authors

* **Vivek Maheshwari** - Senior Software Engineer
* **Manav Lathiya** - Codebase Architect & Full Stack Developer
* **Jugal Kshatriya** - Database Engineer & API Specialist
* **Aayush Malhotra** - Frontend UI/UX Designer

---

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

## 🤝 Acknowledgements

Developed with dedication for the **Odoo Hackathon** to resolve real-world procurement friction. Special thanks to the judges and mentors for their support.
