import re

file_path = r'C:\Users\Administrator\portraitpay-next\src\lib\i18n\translations.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')

# Keys to remove - match "  key:" at start of line (with possible whitespace before key)
keys_to_remove_patterns = [
    'contactEuRep',
    'internationalTransfers',
    'internationalTransfersDesc',
    'kycDeletion',
    'kycDeletionDesc',
    'kycDeletionContact',
    'kycDeletionSteps',
    'gdpr',
    'gdprDesc',
    'gdprList',
    'pipl',
    'piplDesc',
    'piplList',
]

# Find all lines where the key appears at the start of a JS property
remove_ranges = []
i = 0
while i < len(lines):
    line = lines[i].strip()
    matched_key = None
    for key in keys_to_remove_patterns:
        # Match "key:" at start of line (with possible indentation)
        if re.match(r'^' + re.escape(key) + r':', line):
            matched_key = key
            break
    
    if matched_key:
        start = i
        # Count braces/brackets to find the full block end
        brace_count = 0
        bracket_count = 0
        started = False
        for j in range(i, len(lines)):
            for c in lines[j]:
                if c == '{':
                    brace_count += 1
                    started = True
                elif c == '}':
                    brace_count -= 1
                elif c == '[':
                    bracket_count += 1
                    started = True
                elif c == ']':
                    bracket_count -= 1
            if started and brace_count == 0 and bracket_count == 0:
                end = j
                remove_ranges.append((start, end))
                print(f"Removing {matched_key}: lines {start+1}-{end+1}")
                i = j + 1
                break
        if not started:
            # Simple scalar value, just one line
            remove_ranges.append((start, start))
            print(f"Removing {matched_key}: line {start+1}")
            i = start + 1
    else:
        i += 1

# Build new content
new_lines = []
for idx, line in enumerate(lines):
    skip = False
    for start, end in remove_ranges:
        if start <= idx <= end:
            skip = True
            break
    if not skip:
        new_lines.append(line)

new_content = '\n'.join(new_lines)
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"\nDone. Removed {len(remove_ranges)} blocks.")
