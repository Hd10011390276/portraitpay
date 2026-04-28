$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Get-SecurityHeaders($url) {
    $headers = @{}
    try {
        $resp = Invoke-WebRequest -Uri $url -Method HEAD -TimeoutSec 10 -UseBasicParsing
        $headers['X-Frame-Options']        = $resp.Headers['X-Frame-Options']
        $headers['X-Content-Type-Options'] = $resp.Headers['X-Content-Type-Options']
        $headers['X-XSS-Protection']       = $resp.Headers['X-XSS-Protection']
        $headers['Strict-Transport-Security'] = $resp.Headers['Strict-Transport-Security']
        $headers['Content-Security-Policy']   = $resp.Headers['Content-Security-Policy']
        $headers['Referrer-Policy']        = $resp.Headers['Referrer-Policy']
        $headers['Cache-Control']          = $resp.Headers['Cache-Control']
    } catch {
        $headers['ERROR'] = $_.Exception.Message
    }
    return $headers
}

function Test-Pattern($url, $pattern, $desc) {
    try {
        $html = Invoke-WebRequest -Uri $url -TimeoutSec 15 -UseBasicParsing | Select-Object -ExpandProperty Content
        $found = $html -match $pattern
        return @{found=$found; desc=$desc; pattern=$pattern}
    } catch {
        return @{found=$false; desc=$desc; pattern=$pattern; err=$_.Exception.Message}
    }
}

$base = "https://portraitpayai.com"
$RED = [Console]::Color]::Red
$GREEN = [Console]::Color]::Green
$YELLOW = [Console]::Color]::Yellow
$CYAN = [Console]::Color]::Cyan

Write-Host ""
Write-Host "=== SECURITY HEADERS ===" -ForegroundColor $CYAN
$h = Get-SecurityHeaders "$base/"
$allClear = $true
foreach ($k in $h.Keys) {
    if ($k -eq 'ERROR') { continue }
    $val = $h[$k]
    if ($val) {
        Write-Host "  [OK]   $k = $val" -ForegroundColor $GREEN
    } else {
        Write-Host "  [MISS] $k" -ForegroundColor $YELLOW
        $allClear = $false
    }
}

Write-Host ""
Write-Host "=== TERMS PAGE (LA Market Fixes) ===" -ForegroundColor $CYAN
$termsPatterns = @(
    @{p="1%|platform fee.*1"; d="1% commission"},
    @{p="California|State of California"; d="California governing law"},
    @{p="USD|Dollar"; d="USD pricing"},
    @{p="PayPal|Bank Transfer|Coinbase"; d="USD-friendly payment methods"}
)
foreach ($tp in $termsPatterns) {
    $r = Test-Pattern "$base/terms" $tp.p $tp.d
    if ($r.found) {
        Write-Host "  [OK]   $($r.desc)" -ForegroundColor $GREEN
    } else {
        Write-Host "  [FAIL] $($r.desc) (pattern: $($r.pattern))" -ForegroundColor $RED
    }
}

Write-Host ""
Write-Host "=== PRIVACY PAGE ===" -ForegroundColor $CYAN
$r = Test-Pattern "$base/privacy" "contact@portraitpayai" "contact email present"
if ($r.found) { Write-Host "  [OK]   $($r.desc)" -ForegroundColor $GREEN }
else { Write-Host "  [FAIL] $($r.desc)" -ForegroundColor $RED }

Write-Host ""
Write-Host "=== HOME PAGE ===" -ForegroundColor $CYAN
$homePatterns = @(
    @{p="FAQ"; d="FAQ section present"},
    @{p="How it Works|从肖像"; d="How it Works section"},
    @{p="区块链|blockchain|Blockchain"; d="blockchain mentioned"}
)
foreach ($hp in $homePatterns) {
    $r = Test-Pattern "$base/" $hp.p $hp.d
    if ($r.found) { Write-Host "  [OK]   $($r.desc)" -ForegroundColor $GREEN }
    else { Write-Host "  [FAIL] $($r.desc)" -ForegroundColor $RED }
}

Write-Host ""
Write-Host "=== ROBOTS.TXT ===" -ForegroundColor $CYAN
try {
    $null = Invoke-WebRequest -Uri "$base/robots.txt" -TimeoutSec 8 -UseBasicParsing
    Write-Host "  [OK]   robots.txt exists" -ForegroundColor $GREEN
} catch {
    Write-Host "  [MISS] robots.txt not found (SEO issue)" -ForegroundColor $YELLOW
}

Write-Host ""
Write-Host "=== SITEMAP.XML ===" -ForegroundColor $CYAN
try {
    $null = Invoke-WebRequest -Uri "$base/sitemap.xml" -TimeoutSec 8 -UseBasicParsing
    Write-Host "  [OK]   sitemap.xml exists" -ForegroundColor $GREEN
} catch {
    Write-Host "  [MISS] sitemap.xml not found (SEO issue)" -ForegroundColor $YELLOW
}

Write-Host ""
Write-Host "=== API HEALTH ===" -ForegroundColor $CYAN
try {
    $resp = Invoke-WebRequest -Uri "$base/api/cron/monitoring" -TimeoutSec 8 -UseBasicParsing
    Write-Host "  [OK]   API responds: $($resp.Content)" -ForegroundColor $GREEN
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "  [OK]   API auth required (401 = correct for health check)" -ForegroundColor $GREEN
    } else {
        Write-Host "  [FAIL] API error: $($_.Exception.Message)" -ForegroundColor $RED
    }
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor $CYAN
Write-Host "  X-Frame-Options:        " -NoNewline
if ($h['X-Frame-Options']) { Write-Host "OK" -ForegroundColor $GREEN } else { Write-Host "MISS (clickjacking risk)" -ForegroundColor $YELLOW }
Write-Host "  X-Content-Type-Options:  " -NoNewline
if ($h['X-Content-Type-Options']) { Write-Host "OK" -ForegroundColor $GREEN } else { Write-Host "MISS (MIME sniff risk)" -ForegroundColor $YELLOW }
Write-Host "  HSTS:                   " -NoNewline
if ($h['Strict-Transport-Security']) { Write-Host "OK" -ForegroundColor $GREEN } else { Write-Host "MISS" -ForegroundColor $YELLOW }
Write-Host ""
