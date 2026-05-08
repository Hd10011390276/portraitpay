import os

files_to_check = [
    r'src\app\api\portraits\[id]\mint\route.ts',
    r'src\app\api\portraits\[id]\certify\route.ts',
    r'src\lib\export\portrait-certificate.ts'
]

for f in files_to_check:
    print(f'=== {f} ===')
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as fh:
            lines = fh.readlines()
        for i, line in enumerate(lines[:30]):
            print(f'L{i+1}: {line.rstrip()}')
    else:
        print('FILE NOT FOUND')
    print()