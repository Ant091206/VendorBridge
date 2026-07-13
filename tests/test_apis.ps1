$token = Get-Content "d:\vendorbridge\test_token.txt"
$headers = @{"Authorization"="Bearer $token"}
$results = @()

function Test-API($name, $uri, $method = "GET", $body = $null) {
    try {
        if ($body) {
            $r = Invoke-RestMethod -Uri $uri -Headers $headers -Method $method -Body ($body | ConvertTo-Json) -ContentType "application/json"
        } else {
            $r = Invoke-RestMethod -Uri $uri -Headers $headers -Method $method
        }
        $script:results += "${name}: PASS"
        Write-Host "${name}: PASS" -ForegroundColor Green
        return $r
    } catch {
        $errMsg = $_.ToString()
        $script:results += "${name}: FAIL - $errMsg"
        Write-Host "${name}: FAIL - $errMsg" -ForegroundColor Red
        return $null
    }
}

Write-Host "=== VendorBridge Full API Verification ===" -ForegroundColor Cyan
Write-Host ""

# Auth
Test-API "Auth Health" "http://localhost:5000/api/health" | Out-Null

# Dashboard
Test-API "Dashboard Admin" "http://localhost:5000/api/dashboard/admin" | Out-Null
Test-API "Dashboard Officer" "http://localhost:5000/api/dashboard/officer" | Out-Null
Test-API "Dashboard Manager" "http://localhost:5000/api/dashboard/manager" | Out-Null

# Vendors
Test-API "Vendors List" "http://localhost:5000/api/vendors" | Out-Null
Test-API "Vendor Detail (ID=1)" "http://localhost:5000/api/vendors/1" | Out-Null

# RFQs
Test-API "RFQs List" "http://localhost:5000/api/rfqs" | Out-Null
Test-API "RFQ Detail (ID=1)" "http://localhost:5000/api/rfqs/1" | Out-Null

# Quotations
Test-API "Quotations List" "http://localhost:5000/api/quotations" | Out-Null

# Approvals
Test-API "Approvals List" "http://localhost:5000/api/approvals" | Out-Null

# Purchase Orders
Test-API "PO List" "http://localhost:5000/api/purchase-orders" | Out-Null
Test-API "PO Detail (ID=1)" "http://localhost:5000/api/purchase-orders/1" | Out-Null
Test-API "PO History (ID=1)" "http://localhost:5000/api/purchase-orders/1/history" | Out-Null

# Invoices
Test-API "Invoices List" "http://localhost:5000/api/invoices" | Out-Null
Test-API "Invoice Detail (ID=1)" "http://localhost:5000/api/invoices/1" | Out-Null

# Activity & Notifications
Test-API "Activity Logs" "http://localhost:5000/api/activity-logs" | Out-Null
Test-API "Notifications" "http://localhost:5000/api/notifications" | Out-Null

# Reports
Test-API "Reports Summary" "http://localhost:5000/api/reports/summary" | Out-Null
Test-API "Reports Vendors" "http://localhost:5000/api/reports/vendors" | Out-Null
Test-API "Reports Spending" "http://localhost:5000/api/reports/spending" | Out-Null

# Analytics
Test-API "Analytics Overview" "http://localhost:5000/api/analytics/overview" | Out-Null

# Users
Test-API "Users List" "http://localhost:5000/api/users" | Out-Null

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
$passed = ($results | Where-Object { $_ -like "*PASS*" }).Count
$failed = ($results | Where-Object { $_ -like "*FAIL*" }).Count
Write-Host "PASSED: $passed / $($results.Count)" -ForegroundColor Green
Write-Host "FAILED: $failed / $($results.Count)" -ForegroundColor Red
Write-Host ""
$results | Where-Object { $_ -like "*FAIL*" } | ForEach-Object { Write-Host $_ -ForegroundColor Red }
