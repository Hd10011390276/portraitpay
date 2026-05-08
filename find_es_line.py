with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

idx_es = content.find('"es-ES":')
idx_en = content.find('"en-US":')
idx_zh = content.find('"zh-Hant":')

print(f'es-ES at char {idx_es}')
print(f'en-US at char {idx_en}')
print(f'zh-Hant at char {idx_zh}')

with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'Total lines: {len(lines)}')
print(f'Line 4427 (0-indexed 4426): {repr(lines[4426][:80])}')
print(f'Line 4428: {repr(lines[4427][:80])}')

# Show the locale headers
for i, line in enumerate(lines):
    stripped = line.strip()[:60]
    if '"en-US"' in stripped or '"es-ES"' in stripped or '"zh-Hant"' in stripped:
        print(f'L{i+1}: {stripped}')