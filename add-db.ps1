$token = "vcp_5ncyM443hStOubqQknKZfGWKB7buARDOsaVNNsk9rje3xPZyc5306v3P"
$dbUrl = "postgresql://neondb_owner:npg_hU6BKHJISyj5@ep-lucky-rice-an2ac9ib-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require"

Set-Location "C:\Users\Administrator\.openclaw\workspace\portraitpay"

# Remove old
Write-Host "Removing old..."
& npx.cmd --yes vercel env rm DATABASE_URL production --token $token --yes 2>$null

# Add new  
Write-Host "Adding new..."
$proc = Start-Process -FilePath "npx.cmd" -ArgumentList "--yes","vercel","env","add","DATABASE_URL","production","--token",$token,"--value",$dbUrl,"--yes" -NoNewWindow -Wait -PassThru -RedirectStandardOutput "C:\Users\Administrator\.openclaw\workspace\portraitpay\db-add-out.txt" -RedirectStandardError "C:\Users\Administrator\.openclaw\workspace\portraitpay\db-add-err.txt"
Write-Host "Exit: $LASTEXITCODE"
Get-Content "C:\Users\Administrator\.openclaw\workspace\portraitpay\db-add-out.txt"
Get-Content "C:\Users\Administrator\.openclaw\workspace\portraitpay\db-add-err.txt"