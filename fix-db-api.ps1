param([string]$Token, [string]$ProjectId, [string]$DbUrl)
$ErrorActionPreference = "Continue"

$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

$baseUrl = "https://api.vercel.com/v6/projects/$ProjectId/env"

# Find and delete existing DATABASE_URL
Write-Host "Fetching env list..."
try {
    $resp = Invoke-RestMethod -Uri "$baseUrl`?teamId=team_3a84Ago9pVArL5PFYLY0IEp4" -Headers $headers -Method Get
    $dbEnv = $resp.envs | Where-Object { $_.key -eq "DATABASE_URL" }
    if ($dbEnv) {
        Write-Host "Found DATABASE_URL id=$($dbEnv.id), deleting..."
        Invoke-RestMethod -Uri "$baseUrl/$($dbEnv.id)?teamId=team_3a84Ago9pVArL5PFYLY0IEp4" -Headers $headers -Method Delete | Out-Null
        Write-Host "Deleted."
    } else {
        Write-Host "DATABASE_URL not found, skipping delete."
    }
} catch {
    Write-Host "Delete error (may be ok): $($_.Exception.Message)"
}

# Wait a moment
Start-Sleep -Seconds 2

# Add fresh DATABASE_URL
Write-Host "Adding fresh DATABASE_URL..."
$body = @{
    key = "DATABASE_URL"
    value = $DbUrl
    type = "encrypted"
    environment = "production"
} | ConvertTo-Json -Compress

try {
    $result = Invoke-RestMethod -Uri "$baseUrl`?teamId=team_3a84Ago9pVArL5PFYLY0IEp4" -Headers $headers -Method Post -Body $body
    Write-Host "✅ Added DATABASE_URL successfully"
} catch {
    Write-Host "❌ Add failed: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
}

Write-Host "Done."