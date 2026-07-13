# VendorBridge ERP — Demo Data Report

This report outlines the realistic seed dataset automatically generated for the **VendorBridge ERP** system (Procurement & Vendor Management) configured for **Hari Krupa Engineering Pvt Ltd**.

---

## 🏢 Company Profile
* **Company Name:** Hari Krupa Engineering Pvt Ltd
* **Industry:** Engineering & Manufacturing
* **Location:** Gujarat, India
* **Core Business:** Industrial Equipment Procurement

---

## 📊 Database Seed Summary

The programmatic seeder ([backend/seed.js](file:///d:/vendorbridge/backend/seed.js)) seeds the database with a high-fidelity dataset, modeling over 6 months of active procurement operations:

| Database Entity | Seeded Count | Description / Notes |
|---|---|---|
| 👥 **System Users** | **13** | Rajesh Patel (Admin), Priya Shah (Officer), Vikram Mehta (Manager), plus 10 Vendor users. |
| 📂 **Vendor Categories** | **8** | Categories: Electronics, Mechanical Parts, Industrial Equipment, Electrical Components, IT Services, Raw Materials, Safety Equipment, Office Supplies. |
| 🏢 **Vendors (Companies)** | **20** | Detailed profiles including verified GSTINs, addresses, contacts, and categories. |
| 📋 **RFQs** | **30** | Balanced states: 5 Draft, 10 Open, 10 Closed, 5 Cancelled. |
| 💬 **Quotations (Bids)** | **87** | Multi-vendor pricing responses, delivery times, and bid terms. |
| ✅ **Approval Requests** | **25** | Detailed decisions: 20 Approved, 5 Rejected, 5 Pending Manager Review. |
| 📦 **Purchase Orders** | **20** | Generated sequentially: `PO-2026-0001` through `PO-2026-0020` (10 Completed, 6 Sent, 4 Generated). |
| 🧾 **Tax Invoices** | **20** | Generated from POs: `INV-2026-0001` through `INV-2026-0020` (10 Paid, 6 Sent, 4 Generated). |
| 📝 **Activity Logs** | **320** | Audit trail logs representing logins, RFQ creation, vendor selection, approvals, and PO generation events. |
| 🔔 **Notifications** | **165** | System-wide in-app notifications. |

---

## 🔑 Demo Login Accounts

All user accounts have bcrypt-hashed passwords initialized in the database:

### 1. System Admin (Rajesh Patel)
* **Email:** `admin@vendorbridge.com`
* **Password:** `Admin@123`
* **Features:** Audit Logs, Category Controls, User Management.

### 2. Procurement Officer (Priya Shah)
* **Email:** `officer@vendorbridge.com`
* **Password:** `Officer@123`
* **Features:** Create RFQs, Bid Comparison Matrix, Winner Selection, Invoices.

### 3. Manager (Vikram Mehta)
* **Email:** `manager@vendorbridge.com`
* **Password:** `Manager@123`
* **Features:** Decision Approval Queue (Approve/Reject requests), PO Overview.

### 4. Vendor Portals (10 Bidders)
* **Emails:** `vendor1@vendorbridge.com` through `vendor10@vendorbridge.com`
* **Password:** `Vendor@123`
* **Features:** Review Assignments, Bid Submission, PO Acknowledgement, Invoice Uploads.

---

## ⚡ How to Reset and Seed the Database

To clean and re-populate the database with the fresh hackathon dataset:

1. Open a terminal in the project root.
2. Run the programmatic seeder:
   ```bash
   cd backend
   node seed.js
   ```
3. The script will output confirmation checks for each table insert cycle.
