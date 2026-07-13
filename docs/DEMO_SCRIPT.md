# VendorBridge ERP — Live Demo Walkthrough Script

This script outlines the step-by-step walkthrough of the **VendorBridge ERP** system during live demo sessions and hackathon evaluations. It demonstrates a complete procurement lifecycle across all 4 system roles.

---

## 🔑 Login Credentials

| Role | Email | Password | Primary Focus |
|---|---|---|---|
| **Procurement Admin** | `admin@vendorbridge.com` | `Admin@123` | System Settings, Users, Full Audits |
| **Procurement Officer** | `officer@vendorbridge.com` | `Officer@123` | RFQs, Selection, Invoicing |
| **Manager** | `manager@vendorbridge.com` | `Manager@123` | Approval Decisions, PO Oversight |
| **Vendor Candidate** | `vendor1@vendorbridge.com` | `Vendor@123` | Bidding, PO Acknowledgement, Invoicing |

---

## 🎬 Stage 1: Procurement Officer Flow (RFQ Creation & Invitation)

**Goal:** Create a new request for quotation and invite suppliers to submit bids.

1. Open browser to `http://localhost:5173`.
2. Log in using `officer@vendorbridge.com` / `Officer@123`.
3. Navigate to **RFQs** in the left sidebar.
4. Click the **Create RFQ** button.
5. Fill out the RFQ Form:
   - **Title:** `High-performance LED Projectors for Bangalore Boardrooms`
   - **Description:** `We require 4 ultra-short throw 4K laser projectors, minimum 5000 lumens brightness, including mounting brackets.`
   - **Quantity:** `4`
   - **Category:** `Hardware & Electronics`
   - **Deadline:** Choose a date 2 weeks in the future.
6. Under **Supplier Assignment**, select `GlobalHardware Pvt Ltd` and `AeroConnect Systems`.
7. Click **Save Draft** first to show draft saving, then click **Publish RFQ**.
8. **Explain to Judges:** "Upon publication, VendorBridge automatically logs the activity and triggers real-time SMTP emails inviting the selected vendors to bid."

---

## 🎬 Stage 2: Vendor Bidding Flow

**Goal:** Log in as a vendor, review the RFQ invitation, and submit a pricing proposal.

1. Click **Logout** at the bottom of the sidebar.
2. Log in using `vendor1@vendorbridge.com` / `Vendor@123` (representative for `TechVision Solutions` / `GlobalHardware`).
3. Point out the **Vendor Portal** dashboard.
4. Select **Assigned RFQs** to see the newly published project.
5. Click **Submit Quotation** for the Bangalore Project.
6. Fill in the bidding form:
   - **Unit Price:** `₹ 82,000` (Total calculates to `₹ 3,28,000` instantly)
   - **Delivery Timeline:** `5` calendar days
   - **Notes:** `Includes premium warranty of 2 years, ceiling mount, and free installation service.`
7. Click **Submit Proposal**.
8. **Explain to Judges:** "The bid is locked. The vendor can optionally modify it until the deadline, and notifications are sent to the procurement desk."

---

## 🎬 Stage 3: Quotation Comparison & Winner Selection (Officer)

**Goal:** Compare all supplier bids side-by-side and select the winning vendor.

1. Log back in as `officer@vendorbridge.com` / `Officer@123`.
2. Open **RFQs** and select the Bangalore Project.
3. Click the **Compare Bids** action button at the top-right.
4. Point out the **Quotation Comparison Matrix**:
   - Focus on how VendorBridge highlights the lowest price in green.
   - Point out unit pricing, delivery timelines, and vendor remarks.
5. Select the bid submitted by `GlobalHardware Pvt Ltd` and click **Select Winner**.
6. **Explain to Judges:** "Selecting a winner locks the RFQ. It automatically sends rejection notices to other suppliers, and submits the selection for manager approval."

---

## 🎬 Stage 4: Manager Approval Queue (Manager)

**Goal:** Review selection and approve the procurement, triggering automatic PO generation.

1. Log in using `manager@vendorbridge.com` / `Manager@123`.
2. Navigate to **Approvals** (or **Approval Queue**).
3. Select the pending request for ` Bangalore Boardrooms`.
4. Point out the **Price Analysis Summary**:
   - Explains bid cost details and warns if the selection is higher than the lowest bid.
5. Under **Remarks**, enter: `Approved. Selection justified by shorter delivery timeline and warranty features.`
6. Click **Approve Request**.
7. **Explain to Judges:** "Approving the selection changes status to 'approved', generates sequential Purchase Order `PO-2026-XXXX`, creates activity logs, and notifies the officer."

---

## 🎬 Stage 5: Purchase Order & Invoice Generation (Officer)

**Goal:** View PO and generate the official tax invoice.

1. Log back in as `officer@vendorbridge.com` / `Officer@123`.
2. Navigate to **Purchase Orders** and select the newly approved order.
3. Review the automatic PO cost calculation (subtotal, 18% standard GST, and grand total).
4. Click **Generate Tax Invoice**.
5. Highlight the options:
   - Click **Download PDF**: Stream and open the A4 styled invoice PDF generated using Puppeteer.
   - Click **Print Invoice**: Show the clean, sidebar-hidden print preview dialog.
   - Click **Email Invoice**: Point out the background Nodemailer dispatch with PDF attachment.

---

## 🎬 Stage 6: Audit Logs & Intelligence Dashboard (Admin)

**Goal:** Review full audit logs and system analytics.

1. Log in as `admin@vendorbridge.com` / `Admin@123`.
2. Navigate to **Activity Logs** to show the detailed audit trail of everything that happened.
3. Navigate to **Reports & Analytics**:
   - Point out monthly spending trends.
   - Show supplier performance logs and conversion charts.
   - Point out that Admin can export the spend sheets to Excel or CSV.
