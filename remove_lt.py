with open('src/app/enterprise/lawyer-registration/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# L7: remove import
# L128: remove LanguageToggle usage (in header, 1st occurrence)
# L166: remove LanguageToggle usage (in success page header, 2nd occurrence)
# Remove these lines by setting to empty
lines[6] = ''  # L7 - import
lines[127] = ''  # L128 - first usage
lines[165] = ''  # L166 - second usage

with open('src/app/enterprise/lawyer-registration/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Removed LanguageToggle')

# Verify
with open('src/app/enterprise/lawyer-registration/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
remaining = c.count('LanguageToggle')
print(f'Remaining LanguageToggle references: {remaining}')