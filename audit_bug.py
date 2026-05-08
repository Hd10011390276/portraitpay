import glob, os

# Check current state
files = [
    r'src\app\api\portraits\[id]\mint\route.ts',
    r'src\app\api\portraits\[id]\certify\route.ts',
    r'src\lib\export\portrait-certificate.ts',
]

for f in files:
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as fh:
            content = fh.read()
        exports = [l.strip() for l in content.split('\n') if 'export' in l and 'function' in l]
        imports = [l.strip() for l in content.split('\n') if 'buildPortrait' in l or 'buildCertificate' in l]
        print(f'=== {f} ===')
        print('Exports:', exports)
        print('Refs:', imports)
        print()