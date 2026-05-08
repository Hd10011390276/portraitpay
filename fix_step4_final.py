import re

with open('src/app/enterprise/lawyer-registration/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix Chinese comment in lawyerType
content = content.replace(
    '// "firm" = 律师楼, "personal" = 个人律师',
    '// "firm" = law firm, "personal" = solo lawyer'
)

# 2. Clean emoji prefix from COUNTRIES - keep only English name
# Pattern: { code: "XX", name: "FLAGS EnglishName", available: true },
def clean_country(m):
    code = m.group(1)
    full = m.group(2)
    # Remove emoji/flag chars (U+1F1E6 to U+1F1FF are flag letters)
    # Also remove other non-ASCII
    cleaned = full.encode('ascii', 'ignore').decode('ascii').strip()
    if not cleaned:
        cleaned = code
    return f'{{ code: "{code}", name: "{cleaned}", available: true }}'

content = re.sub(
    r'\{ code: "([A-Z]{2})", name: "([^"]+)", available: true \}',
    clean_country,
    content
)

with open('src/app/enterprise/lawyer-registration/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Verify COUNTRIES
idx = content.find('const COUNTRIES')
chunk = content[idx:idx+500]
lines = chunk.split('\n')

with open('verify_step4.txt', 'w', encoding='utf-8') as out:
    out.write('COUNTRIES after fix:\n')
    for l in lines[:5]:
        out.write(l + '\n')
    lt_idx = content.find('lawyerType:')
    out.write('\nlawyerType comment:\n')
    out.write(content[lt_idx:lt_idx+100])

print('Step 4 fix complete')
