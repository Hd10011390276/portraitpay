# Fix Prisma DLL lock
$ErrorActionPreference = 'SilentlyContinue'

# Find and kill any process holding the DLL
$prismaDll = "C:\Users\Administrator\portraitpay-next\node_modules\.prisma\client\query_engine-windows.dll.node"
$tmpFiles = Get-ChildItem -Path "C:\Users\Administrator\portraitpay-next\node_modules\.prisma\client" -Filter "*.tmp*" -ErrorAction SilentlyContinue

foreach ($tmp in $tmpFiles) {
    Remove-Item -Path $tmp.FullName -Force -ErrorAction SilentlyContinue
}

# Check what process is locking the DLL
$processes = Get-Process
foreach ($proc in $processes) {
    try {
        $modules = $proc.Modules
        foreach ($mod in $modules) {
            if ($mod.FileName -like "*query_engine*") {
                Write-Host "Process $($proc.Id) ($($proc.ProcessName)) is locking DLL"
            }
        }
    } catch {
        # Ignore access denied
    }
}

# Remove the lock files from handles
Write-Host "Attempting to clear locks..."