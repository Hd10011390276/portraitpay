import re

with open('src/app/enterprise/lawyer-registration/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix lawyerType comment - replace Chinese chars with English
# Match: // "firm" = [Chinese] "personal" = [Chinese]
c = re.sub(
    r'// "firm" = [^\"]+"personal" = [^\n]+',
    '// "firm" = law firm, "personal" = solo lawyer',
    c
)

# Fix COUNTRIES array - use regex to match each line and clean country names
# Pattern: { code: "XX", name: "CJK_CHARS EnglishName", available: true },
def fix_country(m):
    code = m.group(1)
    # Extract the English name (after the CJK/emoji prefix characters)
    full_name = m.group(2)
    # Remove any non-ASCII prefix characters (CJK, emoji) from front
    english_name = full_name.encode('ascii', 'ignore').decode('ascii').strip()
    if not english_name:
        english_name = code  # fallback
    return f'  {{ code: "{code}", name: "{english_name}", available: true }}'

c = re.sub(
    r'\{ code: "([A-Z]{2})", name: "[^\"]+", available: true \}',
    fix_country,
    c
)

with open('src/app/enterprise/lawyer-registration/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Done - checking result...')
# Verify
with open('src/app/enterprise/lawyer-registration/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'const COUNTRIES' in line:
        for j in range(i, min(i+5, len(lines))):
            print(f'L{j+1}: {lines[j].rstrip()}')
        break
