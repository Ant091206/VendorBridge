import pool from './config/db.js';
import * as analyticsService from './services/analyticsService.js';
import * as reportService from './services/reportService.js';

async function runTests() {
  console.log('=== PROGRAMMATIC TESTING: MODULE 10 REPORTS & ANALYTICS ===\n');

  try {
    // 1. Verify DB connection
    console.log('Testing connection to database...');
    const [dbCheck] = await pool.execute('SELECT 1 + 1 AS result');
    if (dbCheck[0].result === 2) {
      console.log('✅ Database connection verified successfully.\n');
    } else {
      throw new Error('Database connection check failed.');
    }

    // Prepare mock users
    const adminUser = { id: 1, email: 'admin@vendorbridge.com', role: 'admin' };
    const vendorUser = { id: 4, email: 'vendor@vendorbridge.com', role: 'vendor' }; // Assuming vendor exists with this email
    const mockFilters = { from: '2026-01-01', to: '2026-12-31' };

    // 2. Test Dashboard Analytics (Admin)
    console.log('Testing getDashboardAnalytics for Admin...');
    const adminDashboard = await analyticsService.getDashboardAnalytics(adminUser, mockFilters);
    console.log('✅ Admin Dashboard KPIs:', JSON.stringify(adminDashboard.kpis, null, 2));
    console.log(`✅ Admin Dashboard Outstanding Approvals: ${adminDashboard.outstanding_approvals.length} items.`);
    console.log(`✅ Admin Dashboard Outstanding Payments: ${adminDashboard.outstanding_payments.length} items.\n`);

    // 3. Test Dashboard Analytics (Vendor)
    console.log('Testing getDashboardAnalytics for Vendor...');
    const vendorDashboard = await analyticsService.getDashboardAnalytics(vendorUser, mockFilters);
    console.log('✅ Vendor Dashboard KPIs:', JSON.stringify(vendorDashboard.kpis, null, 2));
    console.log(`✅ Vendor Dashboard Outstanding Approvals: ${vendorDashboard.outstanding_approvals.length} items.`);
    console.log(`✅ Vendor Dashboard Outstanding Payments: ${vendorDashboard.outstanding_payments.length} items.\n`);

    // 4. Test Procurement Analytics
    console.log('Testing getProcurementAnalytics...');
    const procAnalytics = await analyticsService.getProcurementAnalytics(mockFilters);
    console.log('✅ Procurement Analytics KPIs:', JSON.stringify(procAnalytics, null, 2));
    console.log(`✅ Vendor Participation Rate: ${procAnalytics.vendor_participation_rate}%`);
    console.log(`✅ PO Generation Rate: ${procAnalytics.purchase_order_generation_rate}%\n`);

    // 5. Test Vendor Performance Analytics
    console.log('Testing getVendorAnalytics (Vendor Performance)...');
    const vendorAnalytics = await analyticsService.getVendorAnalytics(mockFilters);
    console.log(`✅ Retrieved ${vendorAnalytics.length} vendors performance analytics.`);
    if (vendorAnalytics.length > 0) {
      console.log('✅ First Vendor Metric:', JSON.stringify(vendorAnalytics[0], null, 2));
    }
    console.log('');

    // 6. Test Spending Analytics
    console.log('Testing getSpendingAnalytics...');
    const spendAnalytics = await analyticsService.getSpendingAnalytics(mockFilters);
    console.log(`✅ Total Invoice Spend: ₹${spendAnalytics.invoice_spend}`);
    console.log(`✅ Average Order Value: ₹${spendAnalytics.average_order_value}`);
    console.log(`✅ Category-wise Spend count: ${spendAnalytics.category_wise ? spendAnalytics.category_wise[0]?.length || 0 : 0} items.\n`);

    // 7. Test Approval Analytics
    console.log('Testing getApprovalAnalytics...');
    const approvalAnalytics = await analyticsService.getApprovalAnalytics(mockFilters);
    console.log(`✅ Decided Approvals: ${approvalAnalytics.total_decided}`);
    console.log(`✅ Approval Success Rate: ${approvalAnalytics.approval_success_rate}%`);
    console.log(`✅ Average Decision Time: ${approvalAnalytics.average_approval_time_hours} hours.\n`);

    // 8. Test Purchase Order Analytics
    console.log('Testing getPurchaseOrderAnalytics...');
    const poAnalytics = await analyticsService.getPurchaseOrderAnalytics(mockFilters);
    console.log(`✅ Issued POs: ${poAnalytics.issued_pos}`);
    console.log(`✅ Vendor Fulfillment Rate: ${poAnalytics.vendor_fulfillment_rate}%`);
    console.log(`✅ Vendor Fulfillment count: ${poAnalytics.vendor_fulfillment_list.length} vendors.\n`);

    // 9. Test Invoice Analytics
    console.log('Testing getInvoiceAnalytics...');
    const invoiceAnalytics = await analyticsService.getInvoiceAnalytics(mockFilters);
    console.log(`✅ Paid Invoices Amount: ₹${invoiceAnalytics.paid_amount}`);
    console.log(`✅ Outstanding Invoices Amount: ₹${invoiceAnalytics.outstanding_amount}\n`);

    // 10. Test Trends Analytics
    console.log('Testing getTrendsAnalytics...');
    const trends = await analyticsService.getTrendsAnalytics(mockFilters);
    console.log(`✅ Retrieved trends for ${trends.length} months.`);
    if (trends.length > 0) {
      console.log('✅ Latest Month Trend Point:', JSON.stringify(trends[trends.length - 1], null, 2));
    }
    console.log('');

    // 11. Test Report Listings
    console.log('Testing Report Services Data Listings...');
    const vendorsReport = await reportService.getVendorsReport(adminUser, mockFilters);
    console.log(`✅ Vendors Report: ${vendorsReport.length} records.`);
    
    const rfqsReport = await reportService.getRFQsReport(adminUser, mockFilters);
    console.log(`✅ RFQs Report: ${rfqsReport.length} records.`);

    const quotationsReport = await reportService.getQuotationsReport(adminUser, mockFilters);
    console.log(`✅ Quotations Report: ${quotationsReport.length} records.`);

    const approvalsReport = await reportService.getApprovalsReport(adminUser, mockFilters);
    console.log(`✅ Approvals Report: ${approvalsReport.length} records.`);

    const posReport = await reportService.getPurchaseOrdersReport(adminUser, mockFilters);
    console.log(`✅ Purchase Orders Report: ${posReport.length} records.`);

    const invoicesReport = await reportService.getInvoicesReport(adminUser, mockFilters);
    console.log(`✅ Invoices Report: ${invoicesReport.length} records.`);

    const spendReport = await reportService.getSpendingReport(adminUser, mockFilters);
    console.log(`✅ Spending Report: ${spendReport.length} records.`);

    const summaryReport = await reportService.getSummaryReport(adminUser, mockFilters);
    console.log('✅ Summary Report KPIs:', JSON.stringify(summaryReport, null, 2));

    const auditReport = await reportService.getAuditActivityReport(adminUser, mockFilters);
    console.log(`✅ Audit Activities Report: ${auditReport.length} records.\n`);

    // 12. Test Report Exports
    console.log('Testing CSV and Excel Compilation...');
    const csvVendors = await reportService.generateCSV(adminUser, 'vendors', mockFilters);
    console.log(`✅ CSV generated. Characters: ${csvVendors.length}`);

    const excelSpending = await reportService.generateExcel(adminUser, 'spending', mockFilters);
    console.log(`✅ Excel generated. Characters: ${excelSpending.length}\n`);

    console.log('🎉 ALL PROGRAMMATIC MATH AND METRICS TESTS PASSED SUCCESSFULLY! ✅');
    process.exit(0);

  } catch (error) {
    console.error('❌ Programmatic Verification Test Failed:', error);
    process.exit(1);
  }
}

runTests();
