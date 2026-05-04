with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remove line 2986 (index 2985) which has TWO values on one line: step2Title + supportedDocs merged
if 'step2Title: "Upload Document", "Please ensure' in lines[2985]:
    del lines[2985]
    print('Deleted corrupted line at index 2985')

with open('src/lib/i18n/translations.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')