param(
  [string]$RepoRoot = (Resolve-Path "$PSScriptRoot\..\").Path
)

Write-Host "Starting repository cleanup..." -ForegroundColor Cyan
Write-Host "RepoRoot: $RepoRoot" -ForegroundColor DarkGray

function Remove-Safe {
  param(
    [string]$Path
  )
  if (Test-Path -LiteralPath $Path) {
    try {
      Remove-Item -LiteralPath $Path -Force -Recurse -ErrorAction Stop
      Write-Host "Deleted: $Path" -ForegroundColor Green
    } catch {
      Write-Warning "Failed to delete: $Path => $($_.Exception.Message)"
    }
  } else {
    Write-Host "Skip (not found): $Path" -ForegroundColor DarkGray
  }
}

$targets = @(
  # Root
  Join-Path $RepoRoot 'debug-admin.html'

  # Backend debug/test helpers
  Join-Path $RepoRoot 'backend/debug-doanh-nghiep.js'
  Join-Path $RepoRoot 'backend/debug-excel-file.js'
  Join-Path $RepoRoot 'backend/debug-excel.js'
  Join-Path $RepoRoot 'backend/debug-giang-vien-table.js'
  Join-Path $RepoRoot 'backend/debug-import.js'
  Join-Path $RepoRoot 'backend/debug-login-detail.js'
  Join-Path $RepoRoot 'backend/debug-server.js'
  Join-Path $RepoRoot 'backend/test-admin-query.js'
  Join-Path $RepoRoot 'backend/test-api.js'
  Join-Path $RepoRoot 'backend/test-cv-upload.js'
  Join-Path $RepoRoot 'backend/test-excel-full.js'
  Join-Path $RepoRoot 'backend/test-excel-headers.js'
  Join-Path $RepoRoot 'backend/test-header-detection.js'
  Join-Path $RepoRoot 'backend/test-2-columns.xlsx'
  Join-Path $RepoRoot 'backend/test-import.xlsx'

  # Backend sample/seed generators (not used by runtime scripts)
  Join-Path $RepoRoot 'backend/create-sample-fixed.js'
  Join-Path $RepoRoot 'backend/create-sample-users.js'
  Join-Path $RepoRoot 'backend/create-sample.js'
  Join-Path $RepoRoot 'backend/insert-sample-data.js'
  Join-Path $RepoRoot 'backend/seed-data-simple.js'
  Join-Path $RepoRoot 'backend/seed-data.js'
  Join-Path $RepoRoot 'backend/seed-sample-data.sql'

  # Legacy migration runners and SQL packs
  Join-Path $RepoRoot 'backend/run-migrations.js'
  Join-Path $RepoRoot 'backend/run-new-migration.js'
  Join-Path $RepoRoot 'backend/run-cv-migration.js'
  Join-Path $RepoRoot 'backend/run-sinh-vien-huong-dan-migration.js'
  Join-Path $RepoRoot 'backend/migrations/003_create_accounts_table.sql'
  Join-Path $RepoRoot 'backend/migrations/004_create_separate_tables.sql'
  Join-Path $RepoRoot 'backend/migrations/010_create_sinh_vien_huong_dan_table.sql'
  Join-Path $RepoRoot 'backend/migrations/011_create_bao_cao_table.sql'
  Join-Path $RepoRoot 'backend/migrations/add_nguyen_vong_thuc_tap_column.sql'
  Join-Path $RepoRoot 'backend/migrations/create_internship_registration_table.sql'
  Join-Path $RepoRoot 'backend/database/add_columns_sinh_vien.sql'
  Join-Path $RepoRoot 'backend/database/create_password_reset_codes.sql'
  Join-Path $RepoRoot 'backend/database/database_updates_internship.sql'
  Join-Path $RepoRoot 'backend/database/database_updates.sql'
  Join-Path $RepoRoot 'backend/database/MANUAL_DB_UPDATE.sql'
  Join-Path $RepoRoot 'backend/database/TAO_COT_DANG_KY_THUC_TAP.sql'
  Join-Path $RepoRoot 'backend/database/tao_cot_moi.sql'

  # Legacy template generators (runtime uses src/templates/* instead)
  Join-Path $RepoRoot 'backend/create-doanh-nghiep-template.js'
  Join-Path $RepoRoot 'backend/create-templates.js'
  Join-Path $RepoRoot 'backend/template-doanh-nghiep.xlsx'

  # Unused config packs
  Join-Path $RepoRoot 'backend/package-db.json'
  Join-Path $RepoRoot 'backend/setup-package.json'

  # Frontend unused assets
  Join-Path $RepoRoot 'quanly-thuctap/src/assets/react.svg'
  Join-Path $RepoRoot 'quanly-thuctap/src/assets/dainamtoancanh.jpg'
)

foreach ($t in $targets) { Remove-Safe -Path $t }

# Optionally clean empty directories left behind
$maybeEmptyDirs = @(
  Join-Path $RepoRoot 'backend/migrations'
  Join-Path $RepoRoot 'backend/database'
)
foreach ($d in $maybeEmptyDirs) {
  if (Test-Path -LiteralPath $d) {
    $hasContent = Get-ChildItem -LiteralPath $d -Recurse -Force | Where-Object { -not $_.PSIsContainer } | Select-Object -First 1
    if (-not $hasContent) {
      try {
        Remove-Item -LiteralPath $d -Force -Recurse
        Write-Host "Deleted empty dir: $d" -ForegroundColor Green
      } catch {
        Write-Warning ("Could not delete dir {0}: {1}" -f $d, ${_.Exception}.Message)
      }
    }
  }
}

Write-Host "Cleanup completed." -ForegroundColor Cyan
