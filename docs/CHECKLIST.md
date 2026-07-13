# VendorBridge — Pre-Demo Checklist

## Backend Health
- [ ] Server starts without errors (`npm start` in backend)
- [ ] `GET /api/health` returns 200 OK
- [ ] Database connected successfully
- [ ] All routes registered (no "route not found" on known endpoints)
- [ ] JWT auth working (register + login returns token)
- [ ] Email service connected (check SMTP credentials in `.env`)
- [ ] `node database/seed.js` runs without errors
- [ ] Seed script final summary shows correct counts

## Feature Checklist
- [ ] Login works for all 4 roles
- [ ] Vendor CRUD working (add, edit, view, soft-delete)
- [ ] Vendor categories working
- [ ] RFQ creation with vendor assignment
- [ ] Email sent to vendors on RFQ creation
- [ ] Vendor portal loads for vendor role
- [ ] Vendor can submit quotation
- [ ] Vendor can edit own quotation
- [ ] Officer can view all quotations for an RFQ
- [ ] Quotation comparison page shows all bids
- [ ] Lowest price highlighted correctly
- [ ] Officer can select winning quotation
- [ ] Winner and rejected vendors receive email notifications
- [ ] Manager can view pending approvals
- [ ] Manager can approve with remarks
- [ ] PO auto-generated on approval (sequential numbering)
- [ ] PO status can be updated (generated → sent → completed)
- [ ] Officer can generate invoice from PO
- [ ] Invoice detail page shows correct data
- [ ] PDF download works and renders professionally
- [ ] Print opens print dialog (sidebar/buttons hidden)
- [ ] Email sends PDF to vendor as attachment
- [ ] Activity logs recording across all actions
- [ ] Dashboard KPIs loading correctly per role
- [ ] Reports → Overview charts loading (bar + pie)
- [ ] Reports → Vendor Performance table with sorting
- [ ] Reports → RFQ Analytics metrics
- [ ] CSV export downloads file for vendors, POs, invoices

## Demo Data Checklist
- [ ] Seed script runs successfully: `node database/seed.js`
- [ ] All 6 users created (admin, officer, manager, 3 vendors)
- [ ] Login with each role works:
  - `admin@vendorbridge.com` / `Admin@123`
  - `officer@vendorbridge.com` / `Officer@123`
  - `manager@vendorbridge.com` / `Manager@123`
  - `vendor1@vendorbridge.com` / `Vendor@123`
- [ ] 3 RFQs in different stages exist
- [ ] RFQ 1 is closed with selected quotation
- [ ] RFQ 2 is closed with approved PO
- [ ] RFQ 3 is open with 2 submitted quotations
- [ ] 1 complete invoice ready to show (INV-2025-0001)
- [ ] 1 PO pending invoice generation (PO-2025-0002)
- [ ] All activity logs populated (10 entries)

## UI Checklist
- [ ] No broken layouts on laptop screen (1366x768)
- [ ] Sidebar shows correct items per role
- [ ] All badges show correct colors (status indicators)
- [ ] All tables render without layout shifts
- [ ] All tables have empty states when no data
- [ ] Loading spinner visible while fetching data
- [ ] Toast notifications working (success + error)
- [ ] Modals (approve, reject, confirm) open and close
- [ ] 404 page renders on unknown route
- [ ] No JavaScript errors in browser console
- [ ] No 401/403 flashes on normal page load

## Demo Flow Checklist
- [ ] Demo script practiced 3+ times
- [ ] All demo accounts logged in and tested end-to-end
- [ ] PDF invoice ready to download live during demo
- [ ] Recharts loading with real seed data (not empty)
- [ ] Notification bell showing correct count
- [ ] Email notifications configured (or mock mode ready)
- [ ] CORS configured for deployed frontend URL
- [ ] Environment variables documented for deployment

## Pre-Submission Checklist
- [ ] `.env.example` committed, `.env` in `.gitignore`
- [ ] No hardcoded secrets in code
- [ ] `database/seed.sql` has correct bcrypt hashes
- [ ] `database/seed.js` runs as `node database/seed.js`
- [ ] `vercel.json` present in frontend root
- [ ] `Procfile` and `railway.json` present in backend root
- [ ] README.md has setup instructions and demo accounts
- [ ] All routes protected with `verifyToken`
- [ ] Role restrictions applied on protected routes
- [ ] Rate limiting configured on auth routes
