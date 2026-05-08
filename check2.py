with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find en-US start
en_start = content.index('"en-US":')
en_block = content[en_start:en_start+60000]

# Find zh-Hant in en_block
idx = en_block.find('智能合约授权')
if idx >= 0:
    print('FOUND zh-Hant text IN en-US block!')
    print(repr(en_block[idx-100:idx+200]))
else:
    print('zh-Hant text NOT in en-US block - good')

# Also check the hero.sub
idx2 = en_block.find('sub: "Register')
if idx2 >= 0:
    print('\nhero.sub still old:')
    print(repr(en_block[idx2:idx2+200]))

# Check cta1
idx3 = en_block.find('cta1:')
if idx3 >= 0:
    print('\ncta1:')
    print(repr(en_block[idx3:idx3+100]))