$token = "vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P"
$dbValue = "postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require"

$body = @{
    key = "DATABASE_URL"
    value = $dbValue
    target = @("production")
    type = "encrypted"
} | ConvertTo-Json -Compress

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$uri = "https://api.vercel.com/v13/projects/portraitpay/env"
$response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($body))

Write-Host "Response: $($response | ConvertTo-Json -Compress)"
Write-Host "DATABASE_URL added successfully"
