with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find en-US start
for i, line in enumerate(lines):
    stripped = line.strip()
    if stripped.startswith('"en-US"') and ':' in line and stripped.count(':') == 1:
        print(f'en-US starts at line {i+1}')
        for j in range(i, min(i+8, len(lines))):
            print(f'  {j+1}: {lines[j].rstrip()[:100]}')
        break