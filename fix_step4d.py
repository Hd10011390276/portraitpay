import re

with open('src/app/enterprise/lawyer-registration/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix lawyerType comment
c = c.replace('// "firm" = 寰嬪笀妤? "personal" = 涓\x1d汉寰嬪笀', '// "firm" = law firm, "personal" = solo lawyer')

# Fix COUNTRIES - strip all non-ASCII chars from name values
# Find the COUNTRIES array and process line by line
lines = c.split('\n')
in_countries = False
new_lines = []
for line in lines:
    if 'const COUNTRIES' in line:
        in_countries = True
    if in_countries and 'available: true' in line:
        # Extract code and English name
        # Format: { code: "XX", name: "...", available: true },
        m = re.search(r'(code: "([A-Z]{2})", name: ")([^"]+)(")', line)
        if m:
            prefix = m.group(1)
            name = m.group(3)
            suffix = m.group(4)
            # Strip non-ASCII characters from name
            clean_name = name.encode('ascii', 'ignore').decode('ascii').strip()
            if not clean_name:
                clean_name = m.group(2)
            line = prefix + clean_name + suffix
    new_lines.append(line)

c = '\n'.join(new_lines)

with open('src/app/enterprise/lawyer-registration/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Done')
# Quick verify
with open('src/app/enterprise/lawyer-registration/page.tsx', 'r', encoding='utf-8') as f:
    lines2 = f.readlines()
for i, line in enumerate(lines2):
    if 'const COUNTRIES' in line:
        for j in range(i, min(i+6, len(lines2))):
            print(f'L{j+1}: {repr(lines2[j][:80])}')
        break
