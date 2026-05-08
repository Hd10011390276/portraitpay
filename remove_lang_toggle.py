with open('src/app/enterprise/lawyer-registration/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Remove LanguageToggle import
c = c.replace('import { LanguageToggle } from "@/components/layout/LanguageToggle";\n', '')

# Remove LanguageToggle usage in header (2 instances)
c = c.replace('\n              <LanguageToggle />', '')
c = c.replace('\n            <LanguageToggle />', '')

with open('src/app/enterprise/lawyer-registration/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

# Verify
with open('src/app/enterprise/lawyer-registration/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

with open('verify2.txt', 'w', encoding='utf-8') as out:
    out.write(f'LanguageToggle import: {"LanguageToggle" in content}\n')
    out.write(f'LanguageToggle usage: {content.count("LanguageToggle")}\n')
    # Show first 10 lines
    for i, line in enumerate(content.split('\n')[:15]):
        out.write(f'{i+1}: {line}\n')

print('Done')