with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old = 'sub: "Create a consent passport in minutes. No wallet, no crypto required."'
new = 'sub: "Create a consent passport in minutes.\nNo wallet, no crypto required."'

if old in content:
    content = content.replace(old, new)
    with open('src/lib/i18n/translations.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK - line break fixed')
else:
    # Try to find it
    idx = content.find('Create a consent passport in minutes')
    if idx >= 0:
        print('Found at:', repr(content[idx:idx+100]))
    else:
        print('NOT FOUND')