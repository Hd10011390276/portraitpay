$env:DATABASE_URL = "postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require"
Set-Location "C:\Users\Administrator\.openclaw\workspace\portraitpay"
$token = "vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P"
$payload = @{
    key = "DATABASE_URL"
    value = "postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require"
    target = @("production")
    type = "encrypted"
} | ConvertTo-Json -Compress

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$response = Invoke-RestMethod -Uri "https://api.vercel.com/v13/projects/portraitpay/env" -Method POST -Headers $headers -Body $payload
Write-Host "Result: $($response | ConvertTo-Json -Compress)"
