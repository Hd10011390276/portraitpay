with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix: line 2365 ('      sub: "Create a consent passport in minutes.\n')
# and line 2366 ('No wallet, no crypto required.",\n')
# should be merged into one line with \n escape

# Find the broken lines
for i in range(len(lines)):
    if 'Create a consent passport in minutes.' in lines[i] and lines[i].rstrip().endswith('"') == False and '\\n' not in lines[i]:
        print(f'Found split at line {i+1}:')
        print(f'  Line {i+1}: {repr(lines[i])}')
        print(f'  Line {i+2}: {repr(lines[i+1])}')
        # Fix: replace both lines with proper escaped version
        lines[i] = '      sub: "Create a consent passport in minutes.\\nNo wallet, no crypto required.",\n'
        del lines[i+1]
        print('Fixed!')
        break

with open('src/lib/i18n/translations.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines)

# Verify
with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    lines2 = f.readlines()
for i in range(len(lines2)):
    if 'Create a consent passport' in lines2[i]:
        print(f'Verify line {i+1}: {repr(lines2[i])}')