with open('src/app/enterprise/lawyer-registration/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find COUNTRIES section
idx = content.find('const COUNTRIES')
chunk = content[idx:idx+3000]
lines = chunk.split('\n')

with open('step4_check.txt', 'w', encoding='utf-8') as out:
    out.write(f'Total content length: {len(content)}\n\n')
    out.write('COUNTRIES section:\n')
    for i, line in enumerate(lines[:5]):
        out.write(f'  {i}: {repr(line)}\n')
    
    # Check for lawyerType comment
    lt_idx = content.find('lawyerType:')
    if lt_idx >= 0:
        out.write(f'\nlawyerType context:\n')
        out.write(repr(content[lt_idx:lt_idx+200]) + '\n')
