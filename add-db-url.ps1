$ErrorActionPreference = "Continue"
$token = "vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P"
$dbUrl = "postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Set in process env
$env:DATABASE_URL = $dbUrl

Set-Location C:\Users\Administrator\.openclaw\workspace\portraitpay

Write-Host "Removing existing DATABASE_URL..."
& npx.cmd --yes vercel env rm DATABASE_URL production --token $token --yes 2>`$null

Write-Host "Adding DATABASE_URL..."
$output = & npx.cmd --yes vercel env add DATABASE_URL production --token $token --value $dbUrl --yes 2>&1
Write-Host $output

Write-Host "Done. Exit code: $LASTEXITCODE"