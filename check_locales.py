with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()
print(f'Total lines: {len(lines)}')
for i, line in enumerate(lines):
    stripped = line.strip()[:60]
    if any(loc in stripped for loc in ['"en-US":', '"es-ES":', '"zh-Hant":', '"zh-CN":']):
        print(f'L{i+1}: {stripped}')
    if 2220 <= i < 2245:
        print(f'L{i+1}: {stripped}')
