# Nightly PostgreSQL backup for the ChayilResources pilot laptop.
# Run manually or add to Task Scheduler (runs as you — no admin needed).
$pgBin = "$env:LOCALAPPDATA\Programs\pgsql16\bin"
$backupDir = "$env:LOCALAPPDATA\ChayilData\backups"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
$stamp = Get-Date -Format "yyyy-MM-dd"
$out = Join-Path $backupDir "chayil_resources-$stamp.sql"
& "$pgBin\pg_dump.exe" -U chayil -h localhost chayil_resources > $out
if ($LASTEXITCODE -eq 0) {
  # Keep the last 14 backups.
  Get-ChildItem -LiteralPath $backupDir -Filter "chayil_resources-*.sql" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -Skip 14 |
    Remove-Item -Force
  Write-Output "Backup OK: $out"
} else {
  Write-Output "Backup FAILED (exit $LASTEXITCODE)"
  exit 1
}
