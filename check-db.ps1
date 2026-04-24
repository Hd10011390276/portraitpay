# Check current DATABASE_URL value via Vercel API
Add-Type -AssemblyName System.Net.Http
$token = "vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P"
$projectId = "portraitpay"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Try to get DATABASE_URL from Vercel
try {
    $resp = Invoke-RestMethod -Uri "https://api.vercel.com/v6/projects/$projectId/env?decrypt=true&teamId=team_3a84Ago9pVArL5PFYLY0IEp4" -Headers $headers -Method Get
    $dbEnv = $resp.envs | Where-Object { $_.key -eq "DATABASE_URL" }
    if ($dbEnv) {
        Write-Host "DATABASE_URL exists, value length: $($dbEnv.value.Length)"
    } else {
        Write-Host "DATABASE_URL NOT FOUND in Vercel"
    }
} catch {
    Write-Host "API error: $($_.Exception.Message)"
}

# Also list all envs
Write-Host "`nAll envs:"
$resp2 = Invoke-RestMethod -Uri "https://api.vercel.com/v6/projects/$projectId/env?teamId=team_3a84Ago9pVArL5PFYLY0IEp4" -Headers $headers -Method Get
$resp2.envs | ForEach-Object { Write-Host "  $($_.key) = $($_.type)" }