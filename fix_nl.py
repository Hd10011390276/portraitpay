with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# The \n is literal backslash+n - need actual newline
# Find and fix: sub: "Create a consent passport in minutes.\nNo wallet...
idx = content.find('sub: "Create a consent passport in minutes.')
if idx >= 0:
    end = content.find('"', idx + 10)
    old_val = content[idx:end+1]
    # Replace literal \n with actual newline
    fixed_val = old_val.replace('\\n', '\n')
    content = content.replace(old_val, fixed_val)
    with open('src/lib/i18n/translations.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed! New value:', repr(fixed_val))
else:
    print('Not found')
    idx2 = content.find('Create a consent passport')
    if idx2 >= 0:
        print(repr(content[idx2-5:idx2+120]))