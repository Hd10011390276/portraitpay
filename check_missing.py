with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find hero sub
for pattern in ['sub: "Register', 'cta1: "Start', 'sub: "No crypto', 'step4Desc: "Set', 'desc: "Set your', 'proLi4:', 'proLi5:', 'proLi6:', 'contactTitle:', 'contactPrice:', 'contactDesc:', 'period: " /']:
    idx = content.find(pattern)
    if idx >= 0:
        print(f'FOUND: {pattern}')
        print(repr(content[idx:idx+150]))
        print()
    else:
        print(f'NOT FOUND: {pattern}')