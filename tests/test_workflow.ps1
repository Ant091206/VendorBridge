$token = Get-Content "d:\vendorbridge\test_token.txt"
$headers = @{"Authorization"="Bearer $token"}

Write-Host "=== VendorBridge Complete Workflow Verification ===" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$passes = @()

function Test-Step($stepName, $block) {
    try {
        $result = & $block
        Write-Host "[PASS] $stepName" -ForegroundColor Green
        if ($result) { Write-Host "       Result: $result" -ForegroundColor Gray }
        $script:passes += $stepName
    } catch {
        $errMsg = $_.ToString()
        Write-Host "[FAIL] $stepName" -ForegroundColor Red
        Write-Host "       Error: $errMsg" -ForegroundColor DarkRed
        $script:errors += "${stepName}: $errMsg"
    }
}

# ===================== STEP 1: AUTH =====================
Write-Host "--- [STEP 1] Authentication ---" -ForegroundColor Yellow

Test-Step "Admin Login" {
    $body = '{"email":"admin@vendorbridge.com","password":"Admin@123"}'
    $r = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
    "Token obtained: $($r.token.Substring(0,20))..."
}

Test-Step "Officer Login Check" {
    $body = '{"email":"priya.shah@vendorbridge.com","password":"Officer@123"}'
    $r = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
    "Token obtained, role=$($r.user.role)"
}

# ===================== STEP 2: DASHBOARDS =====================
Write-Host "" 
Write-Host "--- [STEP 2] Dashboards ---" -ForegroundColor Yellow

Test-Step "Admin Dashboard" {
    $r = Invoke-RestMethod -Uri "http://localhost:5000/api/dashboard/admin" -Headers $headers
    "KPIs count=$($r.data.kpis.Count), recentPOs=$($r.data.recentPOs.Count)"
}

Test-Step "Officer Dashboard" {
    $r = Invoke-RestMethod -Uri "http://localhost:5000/api/dashboard/officer" -Headers $headers
    "KPIs count=$($r.data.kpis.Count)"
}

Test-Step "Manager Dashboard" {
    $r = Invoke-RestMethod -Uri "http://localhost:5000/api/dashboard/manager" -Headers $headers
    "KPIs count=$($r.data.kpis.Count), approvalQueue=$($r.data.approvalQueue.Count)"
}

# ===================== STEP 3: PURCHASE ORDERS =====================
Write-Host ""
Write-Host "--- [STEP 3] Purchase Order CRUD ---" -ForegroundColor Yellow

Test-Step "PO List (all)" {
    $r = Invoke-RestMethod -Uri "http://localhost:5000/api/purchase-orders" -Headers $headers
    "Total=$($r.pagination.total), Stats: issued=$($r.stats.issued), fulfilled=$($r.stats.fulfilled)"
}

Test-Step "PO List (Draft status filter)" {
    $r = Invoke-RestMethod -Uri "http://localhost:5000/api/purchase-orders?status=Draft" -Headers $headers
    "Draft POs: $($r.pagination.total)"
}

Test-Step "PO List (search)" {
    $r = Invoke-RestMethod -Uri "http://localhost:5000/api/purchase-orders?search=PO-" -Headers $headers
    "Search results: $($r.pagination.total)"
}

# Get a Draft PO for testing
$draftPOs = Invoke-RestMethod -Uri "http://localhost:5000/api/purchase-orders?status=Draft" -Headers $headers
$draftPO = $draftPOs.data | Select-Object -First 1

if ($draftPO) {
    $draftId = $draftPO.id
    Write-Host "   Using Draft PO: #$draftId ($($draftPO.po_number))" -ForegroundColor Cyan
    
    Test-Step "PO Detail (Draft)" {
        $r = Invoke-RestMethod -Uri "http://localhost:5000/api/purchase-orders/$draftId" -Headers $headers
        "PO#=$($r.data.po_number), status=$($r.data.status), items=$($r.data.line_items.Count), history=$($r.data.history.Count)"
    }
    
    Test-Step "PO History (Draft)" {
        $r = Invoke-RestMethod -Uri "http://localhost:5000/api/purchase-orders/$draftId/history" -Headers $headers
        "History events: $($r.data.Count)"
    }
    
    Test-Step "Update Draft PO (notes/delivery)" {
        $body = '{"notes":"Updated via verification test","delivery_address":"123 Test Street, Mumbai"}'
        $r = Invoke-RestMethod -Uri "http://localhost:5000/api/purchase-orders/$draftId" -Method PUT -Body $body -ContentType "application/json" -Headers $headers
        "Updated: id=$($r.data.id), status=$($r.data.status)"
    }
    
    Test-Step "Issue Draft PO" {
        $r = Invoke-RestMethod -Uri "http://localhost:5000/api/purchase-orders/$draftId/issue" -Method PATCH -Headers $headers
        "Issued: id=$($r.data.id), status=$($r.data.status)"
    }
    
    # Now test the Issued PO
    Test-Step "Issued PO Detail (after issue)" {
        $r = Invoke-RestMethod -Uri "http://localhost:5000/api/purchase-orders/$draftId" -Headers $headers
        "PO#=$($r.data.po_number), status=$($r.data.status), historyEvents=$($r.data.history.Count)"
    }
    
    Test-Step "Mark PO as Partially Fulfilled" {
        $body = '{"status":"Partially Fulfilled","remarks":"Some items delivered"}'
        $r = Invoke-RestMethod -Uri "http://localhost:5000/api/purchase-orders/$draftId/status" -Method PATCH -Body $body -ContentType "application/json" -Headers $headers
        "Updated: id=$($r.data.id), status=$($r.data.status)"
    }
    
    Test-Step "Mark PO as Fulfilled" {
        $body = '{"status":"Fulfilled","remarks":"All items delivered and verified"}'
        $r = Invoke-RestMethod -Uri "http://localhost:5000/api/purchase-orders/$draftId/status" -Method PATCH -Body $body -ContentType "application/json" -Headers $headers
        "Updated: id=$($r.data.id), status=$($r.data.status)"
    }
    
    Test-Step "Final PO History (all events)" {
        $r = Invoke-RestMethod -Uri "http://localhost:5000/api/purchase-orders/$draftId/history" -Headers $headers
        $events = $r.data | ForEach-Object { $_.action_type }
        "Events: $($events -join ', ')"
    }
} else {
    Write-Host "[SKIP] No Draft POs available for workflow testing" -ForegroundColor Yellow
}

# Test Cancel flow with another Draft PO
$draftPOs2 = Invoke-RestMethod -Uri "http://localhost:5000/api/purchase-orders?status=Draft" -Headers $headers
$draftPO2 = $draftPOs2.data | Select-Object -First 1

if ($draftPO2) {
    $cancelId = $draftPO2.id
    Write-Host "   Using Draft PO #$cancelId for cancel test" -ForegroundColor Cyan
    
    Test-Step "Cancel Draft PO" {
        $body = '{"remarks":"Cancelled for testing purposes"}'
        $r = Invoke-RestMethod -Uri "http://localhost:5000/api/purchase-orders/$cancelId/cancel" -Method PATCH -Body $body -ContentType "application/json" -Headers $headers
        "Cancelled: id=$($r.data.id), status=$($r.data.status)"
    }
    
    Test-Step "Verify Cancelled PO cannot be issued" {
        try {
            $r = Invoke-RestMethod -Uri "http://localhost:5000/api/purchase-orders/$cancelId/issue" -Method PATCH -Headers $headers
            throw "ERROR: Should have been rejected"
        } catch {
            if ($_ -like "*Only Draft*" -or $_ -like "*400*") {
                "Correctly rejected: Cancelled PO cannot be issued"
            } else {
                throw $_
            }
        }
    }
} else {
    Write-Host "[SKIP] No additional Draft POs for cancel test" -ForegroundColor Yellow
}

# ===================== STEP 4: APPROVALS =====================
Write-Host ""
Write-Host "--- [STEP 4] Approvals ---" -ForegroundColor Yellow

Test-Step "Approvals List" {
    $r = Invoke-RestMethod -Uri "http://localhost:5000/api/approvals" -Headers $headers
    "Total: $($r.data.Count), pending=$($r.data | Where-Object { $_.status -eq 'Pending Approval' } | Measure-Object | Select-Object -ExpandProperty Count)"
}

# ===================== STEP 5: INVOICES =====================
Write-Host ""
Write-Host "--- [STEP 5] Invoices ---" -ForegroundColor Yellow

Test-Step "Invoices List" {
    $r = Invoke-RestMethod -Uri "http://localhost:5000/api/invoices" -Headers $headers
    "Total: $($r.pagination.total)"
}

Test-Step "Invoice Detail (ID=1)" {
    $r = Invoke-RestMethod -Uri "http://localhost:5000/api/invoices/1" -Headers $headers
    "Invoice#=$($r.data.invoice_number), status=$($r.data.status), total=$($r.data.grand_total)"
}

# ===================== STEP 6: REPORTS =====================
Write-Host ""
Write-Host "--- [STEP 6] Reports ---" -ForegroundColor Yellow

Test-Step "Reports Summary" {
    $r = Invoke-RestMethod -Uri "http://localhost:5000/api/reports/summary" -Headers $headers
    "vendors=$($r.data.total_vendors), rfqs=$($r.data.total_rfqs), pos=$($r.data.total_purchase_orders)"
}

Test-Step "Reports Vendor Performance" {
    $r = Invoke-RestMethod -Uri "http://localhost:5000/api/reports/vendors" -Headers $headers
    "Vendors with data: $($r.data.Count)"
}

Test-Step "Reports Spending (current year)" {
    $r = Invoke-RestMethod -Uri "http://localhost:5000/api/reports/spending" -Headers $headers
    "Months with data: $($r.data.Count)"
}

# ===================== FINAL SUMMARY =====================
Write-Host ""
Write-Host "=== FINAL VERIFICATION SUMMARY ===" -ForegroundColor Cyan
Write-Host "PASSED: $($passes.Count)" -ForegroundColor Green
Write-Host "FAILED: $($errors.Count)" -ForegroundColor Red
Write-Host ""
if ($errors.Count -gt 0) {
    Write-Host "FAILURES:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor DarkRed }
}
