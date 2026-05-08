with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()
idx = content.index('"en-US"')
with open('en_block.txt', 'w', encoding='utf-8') as f:
    f.write(content[idx:idx+14000])
print('done')