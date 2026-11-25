# SHEWWINA — Local PostgreSQL Test Database Setup Script
# Safely checks for and creates the isolated test database 'shewwina_test'.
# Authentication is performed via psql's native interactive password prompt.

$ErrorActionPreference = "Stop"

$psqlPath = "C:\Program Files\PostgreSQL\19\bin\psql.exe"
$hostAddress = "127.0.0.1"
$port = 5432
$user = "postgres"
$targetDb = "shewwina_test"

if (-not (Test-Path $psqlPath)) {
    Write-Error "PostgreSQL psql executable not found at: $psqlPath"
    exit 1
}

Write-Host "`n=== SHEWWINA Local Test Database Setup ===" -ForegroundColor Cyan
Write-Host "Target: $user@$hostAddress`:$port" -ForegroundColor Gray
Write-Host "Please enter the PostgreSQL password when prompted by psql.`n" -ForegroundColor Yellow

# Step 1: Check if the test database already exists
$checkQuery = "SELECT 1 FROM pg_database WHERE datname = '$targetDb';"
$checkResult = & $psqlPath -h $hostAddress -p $port -U $user -d postgres -t -A -c $checkQuery

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to query pg_database. Check credentials and local server status."
    exit $LASTEXITCODE
}

# Step 2: Create database only if it does not already exist
if ($checkResult.Trim() -eq "1") {
    Write-Host "[INFO] Database '$targetDb' already exists. Preserving existing database without modifications." -ForegroundColor Yellow
} else {
    Write-Host "[INFO] Database '$targetDb' not found. Creating empty database..." -ForegroundColor Cyan
    & $psqlPath -h $hostAddress -p $port -U $user -d postgres -c "CREATE DATABASE $targetDb;"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create database '$targetDb'."
        exit $LASTEXITCODE
    }
    Write-Host "[SUCCESS] Database '$targetDb' created successfully." -ForegroundColor Green
}

# Step 3: Verify active connection to shewwina_test and display version
Write-Host "`n[INFO] Verifying active connection to '$targetDb'..." -ForegroundColor Cyan
& $psqlPath -h $hostAddress -p $port -U $user -d $targetDb -c "SELECT current_database(), version();"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Verification query failed on '$targetDb'."
    exit $LASTEXITCODE
}

Write-Host "`n[SUCCESS] Local test database '$targetDb' is ready and verified." -ForegroundColor Green
Write-Host "Supabase target and application configuration remain completely untouched.`n" -ForegroundColor Gray
