with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()
lines[2986] = '      step2Title: "Upload Document",\n'
lines.insert(2987, '      supportedDocs: "Please ensure the photo is clear and readable",\n')
with open('src/lib/i18n/translations.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Fixed')