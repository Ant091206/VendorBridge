import bcrypt from 'bcryptjs';
import db from './config/db.js';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, './.env') });

// Helper to get relative dates for historical data
const getDateAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const formatMySqlDate = (date) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

const seed = async () => {
  console.log('\n🚀 Hari Krupa Engineering — Massive Database Seeding Started...\n');

  try {
    // ── Step 0: Clean existing data (FK-safe order) ──
    console.log('🧹 Cleaning existing data...');
    await db.execute('SET FOREIGN_KEY_CHECKS = 0');
    await db.execute('DELETE FROM `password_reset_tokens`');
    await db.execute('DELETE FROM `activity_logs`');
    await db.execute('DELETE FROM `notifications`');
    await db.execute('DELETE FROM `invoice_emails`');
    await db.execute('DELETE FROM `invoice_history`');
    await db.execute('DELETE FROM `invoice_items`');
    await db.execute('DELETE FROM `invoices`');
    await db.execute('DELETE FROM `purchase_order_history`');
    await db.execute('DELETE FROM `purchase_order_items`');
    await db.execute('DELETE FROM `purchase_orders`');
    await db.execute('DELETE FROM `approval_history`');
    await db.execute('DELETE FROM `approval_requests`');
    await db.execute('DELETE FROM `quotation_selections`');
    await db.execute('DELETE FROM `quotation_comparisons`');
    await db.execute('DELETE FROM `quotation_items`');
    await db.execute('DELETE FROM `quotations`');
    await db.execute('DELETE FROM `rfq_items`');
    await db.execute('DELETE FROM `rfq_vendors`');
    await db.execute('DELETE FROM `rfqs`');
    await db.execute('DELETE FROM `vendors`');
    await db.execute('DELETE FROM `vendor_categories`');
    await db.execute('DELETE FROM `users`');
    await db.execute('SET FOREIGN_KEY_CHECKS = 1');

    // Reset auto-increment counters
    const tables = [
      'password_reset_tokens', 'activity_logs', 'notifications',
      'invoice_emails', 'invoice_history', 'invoice_items', 'invoices',
      'purchase_order_history', 'purchase_order_items', 'purchase_orders',
      'approval_history', 'approval_requests', 'quotation_selections', 'quotation_comparisons',
      'quotation_items', 'quotations', 'rfq_items', 'rfq_vendors', 'rfqs',
      'vendors', 'vendor_categories', 'users'
    ];
    for (const table of tables) {
      await db.execute(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`);
    }
    console.log('✅ Clean slate ready.\n');

    // ── Step 1: Pre-hash passwords ──
    console.log('🔐 Hashing passwords...');
    const hashedOfficer = await bcrypt.hash('Officer@123', 10);
    const hashedManager = await bcrypt.hash('Manager@123', 10);
    const hashedVendor = await bcrypt.hash('Vendor@123', 10);
    const hashedFinance = await bcrypt.hash('Finance@123', 10);
    console.log('✅ Passwords hashed.\n');

    // ── Step 2: Insert Users ──
    console.log('👥 Inserting users...');
    const users = [
      ['Priya Shah', 'officer@vendorbridge.com', hashedOfficer, 'officer'],
      ['Vikram Mehta', 'manager@vendorbridge.com', hashedManager, 'manager'],
      ['Amit Patel', 'finance@vendorbridge.com', hashedFinance, 'finance'],
      ['Arjun Patel', 'vendor1@vendorbridge.com', hashedVendor, 'vendor'],
      ['Neha Gupta', 'vendor2@vendorbridge.com', hashedVendor, 'vendor'],
      ['Rajesh Sharma', 'vendor3@vendorbridge.com', hashedVendor, 'vendor'],
      ['Vijay Iyer', 'vendor4@vendorbridge.com', hashedVendor, 'vendor'],
      ['Amit Shah', 'vendor5@vendorbridge.com', hashedVendor, 'vendor'],
      ['Sunita Rao', 'vendor6@vendorbridge.com', hashedVendor, 'vendor'],
      ['Suresh Menon', 'vendor7@vendorbridge.com', hashedVendor, 'vendor'],
      ['Sandeep Singh', 'vendor8@vendorbridge.com', hashedVendor, 'vendor'],
      ['Raj Kumar', 'vendor9@vendorbridge.com', hashedVendor, 'vendor'],
      ['Harish Joshi', 'vendor10@vendorbridge.com', hashedVendor, 'vendor'],
    ];
    for (const [name, email, hash, role] of users) {
      const [res] = await db.execute(
        'INSERT INTO users (full_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, \'active\')',
        [name, email, hash, role]
      );
      await db.execute(
        'INSERT INTO profiles (user_id, phone, company, department, address) VALUES (?, NULL, NULL, NULL, NULL)',
        [res.insertId]
      );
    }
    console.log(`   Seeded ${users.length} system users.\n`);

    // ── Step 3: Insert 8 Vendor Categories ──
    console.log('📂 Inserting categories...');
    const categories = [
      'Electronics',
      'Mechanical Parts',
      'Industrial Equipment',
      'Electrical Components',
      'IT Services',
      'Raw Materials',
      'Safety Equipment',
      'Office Supplies'
    ];
    const categoryIds = [];
    for (const cat of categories) {
      const [res] = await db.execute('INSERT INTO vendor_categories (name) VALUES (?)', [cat]);
      categoryIds.push(res.insertId);
    }
    console.log(`   Seeded ${categories.length} categories.\n`);

    // ── Step 4: Insert 20 Vendor Companies ──
    console.log('🏢 Inserting vendors...');
    const vendorData = [
      ['Arjun Patel Enterprises', '27AAPAT1332L1ZX', 'vendor1@vendorbridge.com', '9876543210', '42, Tech Park, Powai, Mumbai - 400076', 5],
      ['Neha Enterprises', '29AABCG4567M1ZY', 'vendor2@vendorbridge.com', '9876543211', '18, Electronic City Phase 1, Bengaluru - 560100', 4],
      ['Global Tech Supplies', '06AABCS8901N1ZZ', 'vendor3@vendorbridge.com', '9876543212', '7, Sector 18, Gurugram, Haryana - 122015', 1],
      ['Prime Industrial Solutions', '07AABCO2345P1ZA', 'vendor4@vendorbridge.com', '9876543213', '33, Connaught Place, New Delhi - 110001', 2],
      ['Shree Engineering Works', '24AABCF6789Q1ZB', 'vendor5@vendorbridge.com', '9876543214', '9, GIDC Industrial Estate, Ahmedabad - 382445', 3],
      ['AeroConnect Systems', '27AACCS3332A1Z1', 'vendor6@vendorbridge.com', '9876543215', '124, SEZ Zone, Hinjewadi, Pune - 411057', 1],
      ['Apex Software Consult', '29AAPSC4567B1Z2', 'vendor7@vendorbridge.com', '9876543216', '55, Outer Ring Rd, Marathahalli, Bengaluru - 560037', 5],
      ['BlueDart Logistics Ltd', '06AABDL8901C1Z3', 'vendor8@vendorbridge.com', '9876543217', '12, Transport Area, Okhla, New Delhi - 110020', 3],
      ['Raj Stationery Mart', '07AARSM2345D1Z4', 'vendor9@vendorbridge.com', '9876543218', 'Shop 4, Sadar Bazar, Delhi - 110006', 8],
      ['Hindustan Ergonomics', '24AAHFE6789E1Z5', 'vendor10@vendorbridge.com', '9876543219', '88, Timber Market, Ahmedabad - 380002', 8],
      ['TechVision Solutions', '27AABCT1332L1ZX', 'sales@techvision.com', '9876543220', '52, Phase II, Electronic City, Bangalore - 560100', 5],
      ['Vertex Manufacturing', '24AABCV4567M1ZY', 'info@vertexmfg.com', '9876543221', 'A-3, Industrial Area, Rajkot - 360003', 2],
      ['Precision Components Pvt Ltd', '24AABCP8901N1ZZ', 'sales@precisioncomp.com', '9876543222', '12, GIDC, Makarpura, Vadodara - 390010', 2],
      ['Industrial Automation India', '27AABCI2345P1ZA', 'contact@indautomation.com', '9876543223', '23, MIDC, Bhosari, Pune - 411026', 3],
      ['Sigma Tools & Equipment', '24AABCS6789Q1ZB', 'orders@sigmatools.com', '9876543224', '78, GIDC, Vatva, Ahmedabad - 382440', 3],
      ['Smart Electrical Systems', '27AACCS3332A1Z2', 'info@smartelectrical.com', '9876543225', '101, Wagle Estate, Thane - 400604', 4],
      ['Delta Engineering Products', '24AAPSC4567B1Z3', 'sales@deltaeng.com', '9876543226', 'Plot 45, GIDC, Ankleshwar - 393002', 2],
      ['United Industrial Supplies', '06AABDL8901C1Z4', 'info@unitedindustrial.com', '9876543227', 'Shop 12, Naya Bazar, Delhi - 110006', 8],
      ['Krupa Safety Gear', '24AARSM2345D1Z5', 'sales@krupasafety.com', '9876543228', 'Plot 18, GIDC, Jamnagar - 361004', 7],
      ['Modern Facility Services', '27AAHFE6789E1Z6', 'ops@modernfacility.com', '9876543229', 'Andheri East, Mumbai - 400069', 7],
    ];

    const vendorIds = [];
    let vCount = 1;
    for (const [name, gst, email, phone, address, catId] of vendorData) {
      // Calculate realistic PAN from GST (chars 2-12)
      const pan = gst.substring(2, 12);
      const vendorCode = `VND-26-${String(vCount).padStart(4, '0')}`;
      const [res] = await db.execute(
        'INSERT INTO vendors (vendor_code, name, gst_number, pan_number, email, phone, address, status, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, \'active\', ?)',
        [vendorCode, name, gst, pan, email, phone, address, catId]
      );
      vendorIds.push(res.insertId);
      vCount++;
    }
    console.log(`   Seeded ${vendorData.length} vendor profiles.\n`);

    // ── Step 5: Insert 30 RFQs ──
    console.log('📋 Inserting RFQs (5 Draft, 10 Open, 10 Closed, 5 Cancelled)...');
    const rfqTemplates = [
      // Closed RFQs (Indices 0 - 9)
      ['Industrial Motor Procurement', 'Require 10 units of 3-Phase AC induction motors, 5HP capacity, high starting torque, IP55 enclosure protection class, Class F insulation.', 10, 3, 150],
      ['PLC Controller Purchase', 'Require 5 units of modular programmable logic controllers (PLCs) with 24 DI/DO points, Modbus communication interface module.', 5, 1, 145],
      ['CNC Machine Spare Tooling Kits', 'Procuring tool holder assemblies, carbide insert drills, collets, and clamping kits for CNC lathe machining floor.', 25, 2, 140],
      ['Raw Steel Plates & Hollow Section Beams', 'Procurement of structural mild steel (IS 2062 Grade), 10mm plates (20 tons) and hollow sections (50 beams) for fabrication workshop.', 70, 6, 135],
      ['Electrical Power Distribution Panels', 'Supply of custom fabricated main LT distribution panels with 400A air circuit breakers, copper busbars, and digital metering indicators.', 2, 4, 130],
      ['Commercial Rotary Screw Air Compressor', 'Requirement for 2 units of 15KW rotary screw air compressors including dryer system, air receiver tank (1000L), and auto drains.', 2, 3, 125],
      ['Industrial Temperature & Proximity Sensors', 'Bulk order of RTD Pt100 temperature sensors (30 units) and inductive proximity sensors M18 sensing distance 8mm (50 units).', 80, 4, 120],
      ['Factory Heavy-Duty Safety Equipment', 'Corporate supply of double lanyard safety harnesses (100 units), safety shoes (200 pairs), and flame-resistant coveralls (150 sets).', 450, 7, 115],
      ['Corporate Office High-Speed Network Switches', 'Requirement of 8 managed Layer 3 gigabit switches with 24 PoE+ ports, SFP uplinks, and support for enterprise VLAN configurations.', 8, 5, 110],
      ['Warehouse Automation Pallet Jacks & Trolleys', 'Requirement of 12 semi-electric heavy-duty pallet jacks (2.5 Ton capacity) and hydraulic lifting trolleys for material handling.', 12, 3, 105],

      // Open RFQs (Indices 10 - 19)
      ['Electrical Control Cable Rolls', 'Requirement for 30 rolls of multi-core copper control cables, shielded armored, 1.5 sq mm cross-section area.', 30, 4, 30],
      ['Heavy-Duty Workshop Bench Grinders', 'Purchase of 6 double-ended pedestal bench grinders, 10-inch wheel size, 3-Phase power feed.', 6, 3, 25],
      ['Digital Vernier Calipers & Micrometers', 'Procurement of precision measuring instruments: 20 digital calipers (0-150mm) and 10 external micrometers (0-25mm) with calibration certs.', 30, 2, 20],
      ['Industrial Exhaust & Ventilation Fans', 'Procurement of 15 wall-mounted axial industrial exhaust fans, heavy-duty louvers, diameter 24 inches.', 15, 3, 15],
      ['Office Ergonomic Chairs & Desks', 'Procurement of 50 ergonomic chairs with mesh backrest and 25 steel-frame wooden desks for engineering drafting team.', 75, 8, 12],
      ['IT Security Firewall Appliance System', 'Supply and configuration of 1 enterprise gateway hardware firewall supporting 500 active VPN sessions and intrusion prevention.', 1, 5, 10],
      ['Welding Electrodes & Protective Screens', 'Yearly contract of MS welding electrodes (100 packets) and movable transparent welding protection screens (10 units).', 110, 7, 8],
      ['Emergency Wall-Mount First Aid Cabinets', 'Supply of 15 industrial-grade metal medical first aid boxes fully stocked as per factory health regulations.', 15, 7, 5],
      ['Pneumatic Control Valves & Cylinders', 'Requirement for double-acting pneumatic cylinders stroke 100mm (20 units) and 5/2-way solenoid valves G1/4 (25 units).', 45, 2, 3],
      ['Raw Brass Rods and Hexagonal Bars', 'Requirement of 2 tons of free-cutting brass rods (grade IS 319) and hexagonal bars for turning operations.', 2, 6, 1],

      // Cancelled RFQs (Indices 20 - 24)
      ['Factory Shed Overhead Crane Spare Parts', 'Procuring drum brakes, hoisting rope guides, and carbon brushes for 10-Ton EOT crane.', 15, 2, 90],
      ['Executive Leather Conference Room Sofas', 'Procurement of premium black leather lounge sofas (3-seater) and meeting table chairs for management boardrooms.', 6, 8, 85],
      ['Industrial Submersible Water Pumps 10HP', 'Supply of 3 units of multi-stage submersible borewell water pumps, stainless steel body, with control starters.', 3, 3, 80],
      ['High-Pressure Hydraulic Hose Pipelines', 'Purchase of 40 reinforced rubber hydraulic hoses with crimped connectors, maximum working pressure 350 bar.', 40, 2, 75],
      ['Precision Laser Cutting Spares & Nozzles', 'Requirement of copper nozzles, ceramic rings, and laser lens assemblies for CNC laser cutter.', 100, 2, 70],

      // Draft RFQs (Indices 25 - 29)
      ['Electric standing desks and tables', 'Electric motorized height adjustable desks with presets for engineering design office.', 15, 8, 2],
      ['Calibration Gas Cylinders and Regulators', 'Requirement of calibration gas cylinders (mixture of methane, CO, oxygen) for gas detector devices.', 10, 7, 2],
      ['Custom Logo Printed ID Card Lanyards', 'Supply of 500 woven employee lanyards with card holders featuring Hari Krupa logo.', 500, 8, 1],
      ['Factory Floor Epoxy Coating Materials', 'Epoxy self-leveling flooring resins, hardener packs, and primer bases for factory floor shed-1.', 60, 6, 1],
      ['Automatic Coffee Vending Machines', 'Rental or purchase contract for 4 automatic dual-selection coffee/tea vending machines for offices.', 4, 8, 0],
    ];

    const rfqIds = [];
    let rIdx = 1;
    for (const [title, desc, qty, catId, daysAgo] of rfqTemplates) {
      let status = 'open';
      if (rIdx <= 10) status = 'closed';
      else if (rIdx >= 11 && rIdx <= 20) status = 'open';
      else if (rIdx >= 21 && rIdx <= 25) status = 'cancelled';
      else status = 'draft';

      const deadline = new Date(Date.now() - (daysAgo - 20) * 24 * 60 * 60 * 1000);
      const createdAt = formatMySqlDate(getDateAgo(daysAgo));
      const rfqNumber = `RFQ-2026-${String(rIdx).padStart(4, '0')}`;
      
      const [res] = await db.execute(
        'INSERT INTO rfqs (rfq_number, title, description, submission_deadline, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)',
        [rfqNumber, title, desc, deadline, status, createdAt]
      );
      
      const rfqId = res.insertId;
      rfqIds.push(rfqId);

      // Insert into rfq_items
      await db.execute(
        `INSERT INTO rfq_items (rfq_id, item_name, description, quantity, unit, expected_price) 
         VALUES (?, ?, ?, ?, 'Units', 1000.00)`,
        [rfqId, title, desc, qty]
      );

      rIdx++;
    }
    console.log(`   Seeded ${rfqIds.length} RFQ records.\n`);

    // ── Step 6: RFQ Vendor Assignments ──
    console.log('🔗 Assigning vendors to RFQs...');
    for (const rfqId of rfqIds) {
      // Pick 4 realistic vendors from category or randomly
      const shuffledVendors = [...vendorIds].sort(() => 0.5 - Math.random());
      const selected = shuffledVendors.slice(0, 4);
      for (const vId of selected) {
        await db.execute(
          'INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES (?, ?)',
          [rfqId, vId]
        );
      }
    }
    console.log('   Assigned vendors to all RFQs.\n');

    // ── Step 7: Seed 85+ Quotations (with QTN numbers & quantities) ──
    console.log('💬 Seeding quotations (85+ records)...');
    const quotations = [];
    let qtnCounter = 1;

    const insertQuotation = async (qtnNumber, rfqId, vendorId, qty, unitPrice, deliveryDays, notes, status, submittedAt, daysAgo) => {
      const subtotal = qty * unitPrice;
      const taxAmount = subtotal * 0.18;
      const grandTotal = subtotal + taxAmount;

      const [res] = await db.execute(
        `INSERT INTO quotations (quotation_number, rfq_id, vendor_id, delivery_days, notes, status, submission_date, subtotal, tax_amount, discount_amount, grand_total) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, ?)`,
        [qtnNumber, rfqId, vendorId, deliveryDays, notes, status, submittedAt, subtotal, taxAmount, grandTotal]
      );
      
      const qId = res.insertId;

      const [rfqItemRows] = await db.execute('SELECT id FROM rfq_items WHERE rfq_id = ? LIMIT 1', [rfqId]);
      const rfqItemId = rfqItemRows[0]?.id || 1;

      await db.execute(
        `INSERT INTO quotation_items (quotation_id, rfq_item_id, quantity, unit_price, tax_percentage, discount_percentage, total_amount) 
         VALUES (?, ?, ?, ?, 18.00, 0.00, ?)`,
        [qId, rfqItemId, qty, unitPrice, grandTotal]
      );

      quotations.push({
        id: qId, rfqId, vendorId, unitPrice, totalPrice: subtotal, deliveryDays, status, qty, qtnNumber, daysAgo
      });
    };

    for (let i = 0; i < rfqIds.length; i++) {
      const rfqId = rfqIds[i];
      const rfqTitle = rfqTemplates[i][0];
      const qty = rfqTemplates[i][2];
      const rfqDaysAgo = rfqTemplates[i][4];

      const [assignedRows] = await db.execute(
        'SELECT vendor_id FROM rfq_vendors WHERE rfq_id = ?',
        [rfqId]
      );
      const assignedVendorIds = assignedRows.map(r => r.vendor_id);

      if (i < 10) {
        for (let vIdx = 0; vIdx < assignedVendorIds.length; vIdx++) {
          const vId = assignedVendorIds[vIdx];
          const unitPrice = Math.floor(Math.random() * 4000) + 1200;
          const deliveryDays = Math.floor(Math.random() * 8) + 3;
          const status = vIdx < 2 ? 'selected' : 'rejected';
          const qtnNumber = `QTN-2026-${String(qtnCounter).padStart(5, '0')}`;
          const submittedAt = formatMySqlDate(getDateAgo(rfqDaysAgo - 2));

          await insertQuotation(
            qtnNumber, rfqId, vId, qty, unitPrice, deliveryDays, 
            `Bid submitted for ${rfqTitle}. Meets standard specifications.`, 
            status, submittedAt, rfqDaysAgo - 2
          );
          qtnCounter++;
        }
      } 
      else if (i >= 10 && i < 20) {
        for (let vIdx = 0; vIdx < 3; vIdx++) {
          const vId = assignedVendorIds[vIdx];
          const unitPrice = Math.floor(Math.random() * 3000) + 900;
          const deliveryDays = Math.floor(Math.random() * 10) + 4;
          
          let qStatus = 'submitted';
          if (i < 15 && vIdx === 0) {
            qStatus = 'selected';
          }
          const qtnNumber = `QTN-2026-${String(qtnCounter).padStart(5, '0')}`;
          const submittedAt = formatMySqlDate(getDateAgo(rfqDaysAgo - 2));

          await insertQuotation(
            qtnNumber, rfqId, vId, qty, unitPrice, deliveryDays, 
            `Active quotation proposal for ${rfqTitle}.`, 
            qStatus, submittedAt, rfqDaysAgo - 2
          );
          qtnCounter++;
        }
      }
      else if (i >= 20 && i < 25) {
        for (let vIdx = 0; vIdx < 2.4; vIdx++) {
          const vId = assignedVendorIds[vIdx];
          const unitPrice = Math.floor(Math.random() * 3000) + 800;
          const deliveryDays = Math.floor(Math.random() * 10) + 5;
          const qtnNumber = `QTN-2026-${String(qtnCounter).padStart(5, '0')}`;
          const submittedAt = formatMySqlDate(getDateAgo(rfqDaysAgo - 2));

          await insertQuotation(
            qtnNumber, rfqId, vId, qty, unitPrice, deliveryDays, 
            `Cancelled RFQ quote proposal.`, 
            'rejected', submittedAt, rfqDaysAgo - 2
          );
          qtnCounter++;
        }
      }
      else {
        if (i % 2 === 0) {
          const vId = assignedVendorIds[0];
          const unitPrice = Math.floor(Math.random() * 2500) + 700;
          const qtnNumber = `QTN-2026-${String(qtnCounter).padStart(5, '0')}`;

          await insertQuotation(
            qtnNumber, rfqId, vId, qty, unitPrice, 8, 
            `Draft quotation notes.`, 
            'draft', null, null
          );
          qtnCounter++;
        }
      }
    }
    console.log(`   Seeded ${quotations.length} total quotations.\n`);

    // ── Step 8: Seed Approvals (20 Approved, 5 Rejected, 5 Pending) ──
    console.log('✅ Seeding approvals (20 Approved, 5 Rejected, 5 Pending)...');
    const approvalMap = [];
    let aprCount = 1;

    // 1. Seed 20 Approved approvals (from closed RFQs)
    const selectedClosedQuotes = quotations.filter(q => q.status === 'selected');
    for (let sIdx = 0; sIdx < 20 && sIdx < selectedClosedQuotes.length; sIdx++) {
      const q = selectedClosedQuotes[sIdx];
      const remarks = `Selection approved. Best technical configuration and competitive price at ₹${q.unitPrice}/unit.`;
      const decidedAt = formatMySqlDate(getDateAgo(q.daysAgo - 3));
      const approvalNumber = `APR-2026-${String(aprCount++).padStart(5, '0')}`;

      const [res] = await db.execute(
        `INSERT INTO approval_requests (approval_number, rfq_id, quotation_id, vendor_id, requested_by, assigned_to, request_date, status, selection_reason, remarks, approved_at, created_at) 
         VALUES (?, ?, ?, ?, 1, 2, ?, 'Approved', 'Cheapest unit price and excellent previous delivery rating.', ?, ?, ?)`,
        [approvalNumber, q.rfqId, q.id, q.vendorId, formatMySqlDate(getDateAgo(q.daysAgo - 4)), remarks, decidedAt, formatMySqlDate(getDateAgo(q.daysAgo - 4))]
      );

      // Record selection in quotation_comparisons and quotation_selections tables!
      await db.execute(
        'INSERT INTO quotation_comparisons (rfq_id, compared_by, comparison_date) VALUES (?, 2, ?)',
        [q.rfqId, decidedAt]
      );
      await db.execute(
        `INSERT INTO quotation_selections (rfq_id, quotation_id, selected_by, selection_reason, selection_date, status) 
         VALUES (?, ?, 2, ?, ?, 'Recommended')`,
        [q.rfqId, q.id, 'Cheapest unit price and excellent previous delivery rating.', decidedAt]
      );

      // Log in approval_history
      await db.execute(
        `INSERT INTO approval_history (approval_request_id, action_type, action_by, action_date, remarks) 
         VALUES (?, 'Approved', 2, ?, ?)`,
        [res.insertId, decidedAt, remarks]
      );

      approvalMap.push({
        id: res.insertId, quotationId: q.id, decision: 'approved', remarks, rfqId: q.rfqId, totalPrice: q.totalPrice, vendorId: q.vendorId, daysAgo: q.daysAgo - 3
      });
    }

    // 2. Seed 5 Rejected approvals (using rejected quotes)
    const rejectedQuotes = quotations.filter(q => q.status === 'rejected').slice(0, 5);
    for (let rIdx = 0; rIdx < 5 && rIdx < rejectedQuotes.length; rIdx++) {
      const q = rejectedQuotes[rIdx];
      const remarks = 'Rejected. Proposed delivery schedule (15 days) exceeds our factory fabrication deadline of 7 days.';
      const decidedAt = formatMySqlDate(getDateAgo(q.daysAgo - 3));
      const approvalNumber = `APR-2026-${String(aprCount++).padStart(5, '0')}`;

      const [res] = await db.execute(
        `INSERT INTO approval_requests (approval_number, rfq_id, quotation_id, vendor_id, requested_by, assigned_to, request_date, status, selection_reason, remarks, rejected_at, created_at) 
         VALUES (?, ?, ?, ?, 1, 2, ?, 'Rejected', 'Cheapest unit price.', ?, ?, ?)`,
        [approvalNumber, q.rfqId, q.id, q.vendorId, formatMySqlDate(getDateAgo(q.daysAgo - 4)), remarks, decidedAt, formatMySqlDate(getDateAgo(q.daysAgo - 4))]
      );

      // Log in approval_history
      await db.execute(
        `INSERT INTO approval_history (approval_request_id, action_type, action_by, action_date, remarks) 
         VALUES (?, 'Rejected', 2, ?, ?)`,
        [res.insertId, decidedAt, remarks]
      );

      approvalMap.push({
        id: res.insertId, quotationId: q.id, decision: 'rejected', remarks, rfqId: q.rfqId, totalPrice: q.totalPrice, vendorId: q.vendorId, daysAgo: q.daysAgo - 3
      });
    }

    // 3. Seed 5 Pending approvals (from open RFQs selected quotes)
    const selectedOpenQuotes = quotations.filter(q => q.status === 'selected' && !selectedClosedQuotes.map(sc => sc.id).includes(q.id));
    for (let pIdx = 0; pIdx < selectedOpenQuotes.length; pIdx++) {
      const q = selectedOpenQuotes[pIdx];
      const createdAt = formatMySqlDate(getDateAgo(q.daysAgo - 1));
      const approvalNumber = `APR-2026-${String(aprCount++).padStart(5, '0')}`;

      const [res] = await db.execute(
        `INSERT INTO approval_requests (approval_number, rfq_id, quotation_id, vendor_id, requested_by, assigned_to, request_date, status, selection_reason, remarks, created_at) 
         VALUES (?, ?, ?, ?, 1, 2, ?, 'Pending Approval', 'Meets baseline criteria.', NULL, ?)`,
        [approvalNumber, q.rfqId, q.id, q.vendorId, createdAt, createdAt]
      );

      // Log in approval_history
      await db.execute(
        `INSERT INTO approval_history (approval_request_id, action_type, action_by, action_date) 
         VALUES (?, 'Submitted', 1, ?)`,
        [res.insertId, createdAt]
      );

      approvalMap.push({
        id: res.insertId, quotationId: q.id, decision: 'pending', remarks: null, rfqId: q.rfqId, totalPrice: q.totalPrice, vendorId: q.vendorId, daysAgo: q.daysAgo
      });
    }
    console.log(`   Seeded ${approvalMap.length} approvals.\n`);

    // ── Step 9: Seed 20 Purchase Orders ──
    console.log('📦 Seeding purchase orders (20 records)...');
    const approvedApprovals = approvalMap.filter(a => a.decision === 'approved');
    const poMap = [];

    let poCount = 1;
    for (const a of approvedApprovals) {
      const poNumber = `PO-2026-${String(poCount).padStart(4, '0')}`;
      const subtotal = parseFloat(a.totalPrice);
      const tax = subtotal * 0.18;
      const grandTotal = subtotal + tax;

      // Status mix: 10 Fulfilled, 6 Issued, 4 Draft
      let status = 'Draft';
      if (poCount <= 10) status = 'Fulfilled';
      else if (poCount <= 16) status = 'Issued';

      const poDate = formatMySqlDate(getDateAgo(a.daysAgo - 1));
      const deliveryDate = formatMySqlDate(getDateAgo(a.daysAgo - 8));

      const [res] = await db.execute(
        `INSERT INTO purchase_orders (
           po_number, approval_request_id, rfq_id, vendor_id, quotation_id, 
           issue_date, expected_delivery_date, delivery_method, delivery_address, 
           subtotal, tax_amount, discount_amount, grand_total, status, created_by, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Road Transport', '401, Tech Park BKC, Mumbai', ?, ?, 0.00, ?, ?, 1, ?)`,
        [
          poNumber, a.id, a.rfqId, a.vendorId, a.quotationId,
          poDate, deliveryDate, subtotal, tax, grandTotal, status, poDate
        ]
      );
      
      const poId = res.insertId;

      // Seed items for this PO
      const rfqTitle = rfqTemplates[a.rfqId - 1] ? rfqTemplates[a.rfqId - 1][0] : 'Procurement Item';
      const quantity = rfqTemplates[a.rfqId - 1] ? rfqTemplates[a.rfqId - 1][2] : 1;
      const unitPrice = subtotal / quantity;

      await db.execute(
        `INSERT INTO purchase_order_items (
           purchase_order_id, quotation_item_id, item_name, description, quantity, unit, 
           unit_price, tax_percentage, discount_percentage, line_total
         ) VALUES (?, NULL, ?, 'Seeded procurement spare parts', ?, 'Units', ?, 18.00, 0.00, ?)`,
        [poId, rfqTitle, quantity, unitPrice, grandTotal]
      );

      // Seed history for this PO
      await db.execute(
        `INSERT INTO purchase_order_history (purchase_order_id, action_type, action_by, action_date, remarks) 
         VALUES (?, 'Created', 1, ?, 'Purchase order generated in draft mode.')`,
        [poId, poDate]
      );

      if (status === 'Issued' || status === 'Fulfilled') {
        await db.execute(
          `INSERT INTO purchase_order_history (purchase_order_id, action_type, action_by, action_date, remarks) 
           VALUES (?, 'Issued', 1, ?, 'Purchase order sent to vendor.')`,
          [poId, poDate]
        );
      }

      if (status === 'Fulfilled') {
        await db.execute(
          `INSERT INTO purchase_order_history (purchase_order_id, action_type, action_by, action_date, remarks) 
           VALUES (?, 'Fulfilled', 1, ?, 'Delivery completed and order fulfilled.')`,
          [poId, poDate]
        );
      }

      poMap.push({
        id: poId, poNumber, subtotal, tax, grandTotal, status, rfqId: a.rfqId, vendorId: a.vendorId, daysAgo: a.daysAgo - 1
      });
      poCount++;
    }
    console.log(`   Seeded ${poMap.length} Purchase Orders.\n`);

    // ── Step 10: Seed 20 Invoices (Module 8 Schema) ──
    console.log('🧾 Seeding invoices with Module 8 schema (20 records)...');
    let invCount = 1;
    for (const po of poMap) {
      const invoiceNumber = `INV-2026-${String(invCount).padStart(4, '0')}`;
      const subtotal = parseFloat(po.subtotal);
      const taxAmt = parseFloat(po.tax);
      const grandTotal = parseFloat(po.grandTotal);
      const discountAmt = 0;
      const roundOff = Math.round(grandTotal) - grandTotal;

      // Status mix for realism: Paid / Sent / Generated / Viewed
      let invStatus, payStatus;
      if (invCount <= 10)      { invStatus = 'Paid';      payStatus = 'Paid'; }
      else if (invCount <= 15) { invStatus = 'Sent';      payStatus = 'Unpaid'; }
      else if (invCount <= 18) { invStatus = 'Generated'; payStatus = 'Unpaid'; }
      else                     { invStatus = 'Draft';     payStatus = 'Unpaid'; }

      const issueDate = formatMySqlDate(getDateAgo(po.daysAgo - 1)).split(' ')[0];
      const dueDate30 = new Date(getDateAgo(po.daysAgo - 31));
      const dueDateStr = dueDate30.toISOString().split('T')[0];

      // Fetch the rfq_id and quotation_id from the PO
      const [poRec] = await db.execute(
        'SELECT rfq_id, quotation_id FROM purchase_orders WHERE id = ?', [po.id]
      );
      const rfqId2 = poRec[0]?.rfq_id || 1;
      const quotationId2 = poRec[0]?.quotation_id || 1;

      const [invRes] = await db.execute(
        `INSERT INTO invoices (
           invoice_number, po_id, rfq_id, quotation_id, vendor_id,
           issue_date, due_date, payment_terms,
           subtotal, discount_amount, tax_amount, round_off_amount, grand_total,
           payment_status, status, notes, created_by, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Net 30', ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          invoiceNumber, po.id, rfqId2, quotationId2, po.vendorId,
          issueDate, dueDateStr,
          subtotal, discountAmt, taxAmt, roundOff, grandTotal,
          payStatus, invStatus,
          invCount <= 10 ? 'Payment received. Thank you.' : null,
          formatMySqlDate(getDateAgo(po.daysAgo - 1)),
          formatMySqlDate(getDateAgo(po.daysAgo - 1))
        ]
      );
      const invId = invRes.insertId;

      // Seed invoice_items from purchase_order_items
      const [poItems] = await db.execute(
        'SELECT * FROM purchase_order_items WHERE purchase_order_id = ?', [po.id]
      );
      for (const item of poItems) {
        await db.execute(
          `INSERT INTO invoice_items (
             invoice_id, purchase_order_item_id, item_name, description,
             quantity, unit, unit_price, tax_percentage, discount_percentage, line_total
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [invId, item.id, item.item_name, item.description,
           item.quantity, item.unit, item.unit_price,
           item.tax_percentage, item.discount_percentage, item.line_total]
        );
      }

      // Seed invoice_history
      await db.execute(
        `INSERT INTO invoice_history (invoice_id, action_type, action_by, action_date, remarks)
         VALUES (?, 'Created', 1, ?, 'Invoice created as Draft.')`,
        [invId, formatMySqlDate(getDateAgo(po.daysAgo - 1))]
      );

      if (invStatus !== 'Draft') {
        await db.execute(
          `INSERT INTO invoice_history (invoice_id, action_type, action_by, action_date, remarks)
           VALUES (?, 'Generated', 1, ?, 'Invoice finalized and generated.')`,
          [invId, formatMySqlDate(getDateAgo(po.daysAgo - 2))]
        );
      }
      if (['Sent', 'Viewed', 'Paid'].includes(invStatus)) {
        await db.execute(
          `INSERT INTO invoice_history (invoice_id, action_type, action_by, action_date, remarks)
           VALUES (?, 'Sent', 1, ?, 'Invoice emailed to vendor.')`,
          [invId, formatMySqlDate(getDateAgo(po.daysAgo - 3))]
        );
        await db.execute(
          `INSERT INTO invoice_emails (invoice_id, recipient_email, email_subject, email_status, delivery_status, sent_at)
           VALUES (?, 'vendor@example.com', ?, 'Sent', 'Delivered', ?)`,
          [invId, `Invoice ${invoiceNumber} — VendorBridge Procurement`, formatMySqlDate(getDateAgo(po.daysAgo - 3))]
        );
      }
      if (invStatus === 'Paid') {
        await db.execute(
          `INSERT INTO invoice_history (invoice_id, action_type, action_by, action_date, remarks)
           VALUES (?, 'Paid', 1, ?, 'Payment received and confirmed.')`,
          [invId, formatMySqlDate(getDateAgo(po.daysAgo - 5))]
        );
      }

      invCount++;
    }
    console.log(`   Seeded ${invCount - 1} invoices with items and history.\n`);

    // ── Step 11: Seed 300+ Activity Logs ──
    console.log('📝 Seeding activity logs (300+)...');
    let logCount = 0;

    const actionsPool = [
      { action: 'USER_LOGIN', desc: 'User logged in successfully', mod: 'Authentication' },
      { action: 'USER_LOGOUT', desc: 'User logged out', mod: 'Authentication' },
      { action: 'VENDOR_CREATED', desc: 'New vendor profile created', mod: 'Vendors' },
      { action: 'VENDOR_UPDATED', desc: 'Vendor company details updated', mod: 'Vendors' },
      { action: 'RFQ_CREATED', desc: 'Created request for quotation', mod: 'RFQs' },
      { action: 'RFQ_PUBLISHED', desc: 'RFQ published and sent to assigned suppliers', mod: 'RFQs' },
      { action: 'QUOTATION_SUBMITTED', desc: 'Supplier quotation submitted', mod: 'Quotations' },
      { action: 'QUOTATION_SELECTED', desc: 'Winning quotation selected by Procurement Officer', mod: 'Quotations' },
      { action: 'APPROVAL_REQUESTED', desc: 'Sent winning quotation for manager approval', mod: 'Approval Workflow' },
      { action: 'APPROVAL_APPROVED', desc: 'RFQ quotation selection approved', mod: 'Approval Workflow' },
      { action: 'PO_GENERATED', desc: 'Purchase Order generated automatically from approved quotation', mod: 'Purchase Orders' },
      { action: 'PO_SENT', desc: 'Purchase Order dispatched to vendor', mod: 'Purchase Orders' },
      { action: 'INVOICE_GENERATED', desc: 'Tax invoice generated from Purchase Order', mod: 'Invoices' },
      { action: 'INVOICE_EMAILED', desc: 'Tax invoice emailed to supplier', mod: 'Invoices' },
      { action: 'INVOICE_PAID', desc: 'Invoice payment status updated to paid', mod: 'Invoices' },
    ];

    // Build specific sequential activity logs for the 20 complete PO workflows
    for (const po of poMap) {
      const days = po.daysAgo;
      const refId = po.id;
      const rfqId = po.rfqId;
      const vId = po.vendorId;

      const sequentialLogs = [
        [1, 'Priya Shah', 'officer', 'RFQs', 'rfq', rfqId, 'RFQ_CREATED', `Created RFQ (ID: ${rfqId})`, days + 5],
        [1, 'Priya Shah', 'officer', 'RFQs', 'rfq', rfqId, 'RFQ_PUBLISHED', `Published RFQ and invited vendors (ID: ${rfqId})`, days + 4],
        [4, 'Arjun Patel', 'vendor', 'Quotations', 'quotation', refId, 'QUOTATION_SUBMITTED', `Quotation bid submitted by supplier`, days + 3],
        [1, 'Priya Shah', 'officer', 'Quotations', 'quotation', refId, 'QUOTATION_SELECTED', `Selected winning vendor proposal (ID: ${refId})`, days + 2],
        [2, 'Vikram Mehta', 'manager', 'Approval Workflow', 'approval', refId, 'APPROVAL_APPROVED', `Manager approved procurement selection (ID: ${refId})`, days + 1],
        [2, 'Vikram Mehta', 'manager', 'Purchase Orders', 'purchase_order', refId, 'PO_GENERATED', `PO generated sequentially: ${po.poNumber}`, days],
        [1, 'Priya Shah', 'officer', 'Invoices', 'invoice', refId, 'INVOICE_GENERATED', `Tax invoice generated from PO`, days],
      ];

      for (const [uId, uName, uRole, mod, eType, eId, act, desc, ago] of sequentialLogs) {
        await db.execute(
          `INSERT INTO activity_logs (user_id, user_name, role, module_name, entity_type, entity_id, action_type, description, ip_address, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [uId, uName, uRole, mod, eType, eId, act, desc, `192.168.1.${Math.floor(Math.random() * 254) + 1}`, formatMySqlDate(getDateAgo(ago))]
        );
        logCount++;
      }
    }

    // Insert additional random noise logs to exceed 300+ target
    while (logCount < 320) {
      const rUser = users[Math.floor(Math.random() * users.length)];
      const act = actionsPool[Math.floor(Math.random() * actionsPool.length)];
      const daysAgo = Math.floor(Math.random() * 180) + 1; // 6 months distribution
      const entityId = Math.floor(Math.random() * 15) + 1;
      const entityType = act.mod.toLowerCase().replace(' ', '_');

      await db.execute(
        `INSERT INTO activity_logs (user_id, user_name, role, module_name, entity_type, entity_id, action_type, description, ip_address, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, '192.168.1.100', DATE_SUB(NOW(), INTERVAL ? DAY))`,
        [
          Math.floor(Math.random() * 8) + 1,
          rUser[0],
          rUser[3],
          act.mod,
          entityType,
          entityId,
          act.action,
          `${act.desc} (Reference ID: ${entityId})`,
          daysAgo
        ]
      );
      logCount++;
    }
    console.log(`   Seeded ${logCount} activity logs.\n`);

    // ── Step 12: Seed 150+ User Notifications ──
    console.log('🔔 Seeding user notifications (150+)...');
    let notifCount = 0;
    const notificationTemplates = [
      { title: 'New RFQ Assigned', msg: 'You have been selected to bid for RFQ', type: 'rfq' },
      { title: 'Quotation Submitted', msg: 'A supplier submitted a quotation for RFQ', type: 'quotation' },
      { title: 'Quotation Selected', msg: 'Your quotation was selected for RFQ', type: 'quotation' },
      { title: 'Approval Requested', msg: 'Approval request created for RFQ', type: 'approval' },
      { title: 'Approval Granted', msg: 'Your procurement request was approved', type: 'approval' },
      { title: 'PO Dispatched', msg: 'Purchase Order generated and sent', type: 'purchase_order' },
      { title: 'Invoice Paid', msg: 'Payment processed successfully for Invoice', type: 'invoice' }
    ];

    // Seed specific notification flows for our complete cycles
    for (let cIdx = 1; cIdx <= 20; cIdx++) {
      const daysAgo = Math.floor(Math.random() * 60) + 5;
      const refId = cIdx;

      const cycleNotifs = [
        [4, 'New RFQ Assigned', 'You have been selected to bid for RFQ', 'rfq', daysAgo + 3],
        [1, 'Quotation Submitted', 'A supplier submitted a quotation for RFQ', 'quotation', daysAgo + 2],
        [2, 'Approval Requested', 'Approval request created for RFQ', 'approval', daysAgo + 1],
        [1, 'Approval Granted', 'Your procurement request was approved', 'approval', daysAgo],
        [4, 'PO Dispatched', 'Purchase Order generated and sent', 'purchase_order', daysAgo]
      ];

      for (const [uId, title, msg, type, ago] of cycleNotifs) {
        await db.execute(
          `INSERT INTO notifications (user_id, title, message, status, notification_type, reference_module, reference_id, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [uId, title, `${msg} (Ref ID: ${refId})`, Math.random() > 0.3 ? 'Read' : 'Unread', type, type, refId, formatMySqlDate(getDateAgo(ago))]
        );
        notifCount++;
      }
    }

    // Seed random notification noise to exceed 150+ target
    while (notifCount < 165) {
      const uId = Math.floor(Math.random() * 10) + 1;
      const temp = notificationTemplates[Math.floor(Math.random() * notificationTemplates.length)];
      const isRead = Math.random() > 0.4 ? 1 : 0;
      const refId = Math.floor(Math.random() * 20) + 1;
      const daysAgo = Math.floor(Math.random() * 180) + 1;

      await db.execute(
        `INSERT INTO notifications (user_id, title, message, status, notification_type, reference_module, reference_id, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))`,
        [uId, temp.title, `${temp.msg} (Ref ID: ${refId})`, isRead ? 'Read' : 'Unread', temp.type, temp.type, refId, daysAgo]
      );
      notifCount++;
    }
    console.log(`   Seeded ${notifCount} notifications.\n`);

    console.log('═════════════════════════════════════════════════════════');
    console.log('🎉 Database Reset and Seeding Completed Successfully!');
    console.log('═════════════════════════════════════════════════════════');
    console.log(`   System Users:          ${users.length}`);
    console.log(`   Vendor Categories:     ${categories.length}`);
    console.log(`   Vendors:               ${vendorData.length}`);
    console.log(`   RFQs:                  ${rfqIds.length}`);
    console.log(`   Quotations Bids:       ${quotations.length}`);
    console.log(`   Approvals:             ${approvalMap.length}`);
    console.log(`   Purchase Orders:       ${poMap.length}`);
    console.log(`   Invoices:              ${poMap.length}`);
    console.log(`   Activity Logs:         ${logCount}`);
    console.log(`   Notifications:         ${notifCount}`);
    console.log('═════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed with error:', error);
    process.exit(1);
  }
};

seed();
