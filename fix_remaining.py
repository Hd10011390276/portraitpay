with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# en-US block boundaries
en_start = content.index('"en-US":')
# Find end by counting braces
depth = 0
i = en_start
while i < len(content):
    if content[i] == '{':
        depth += 1
    elif content[i] == '}':
        depth -= 1
        if depth == 0:
            en_end = i + 1
            break
    i += 1

en_block = content[en_start:en_end]

# Fix remaining old text in en-US block
fixes = [
    ('sub: "Register your portrait rights on the Ethereum blockchain with immutable timestamps and smart-contract licensing. Own your image identity \u2014 once and for all."',
     'sub: "For LA actors and creators: collect consent, define usage rights, and generate a verifiable license packet before creating digital human videos."'),
    ('cta1: "Start Free \u2014 Register Now"',
     'cta1: "For Actors: Create Free Consent Passport"'),
    ('sub: "No crypto expertise required. We handle the blockchain complexity \u2014 you keep control."',
     'sub: "Create a consent passport in minutes. No wallet, no crypto required."'),
    ('step4Desc: "Set terms. Accept license requests, collect royalties, withdraw earnings \u2014 all handled automatically."',
     'step4Desc: "Share your verification link. Creators verify your consent before publishing."'),
    ('desc: "Set your terms. Accept license requests, collect royalties, withdraw earnings \u2014 all from your dashboard."',
     'desc: "Share your verification link. Creators verify your consent before publishing."'),
]

for old, new in fixes:
    if old in en_block:
        en_block = en_block.replace(old, new)
        print(f'Fixed: {old[:50]}')
    else:
        print(f'Still missing: {old[:60]}')
        # Try to find it
        keyword = old.split(':')[0]
        idx = en_block.find(keyword)
        if idx >= 0:
            print(f'  Found keyword at: {repr(en_block[idx:idx+150])}')

new_content = content[:en_start] + en_block + content[en_end:]

with open('src/lib/i18n/translations.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('\nDone')