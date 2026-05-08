with open('src/app/enterprise/lawyer-registration/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

with open('country_check.txt', 'w', encoding='utf-8') as out:
    # Find COUNTRIES section
    idx = content.find('const COUNTRIES')
    if idx >= 0:
        chunk = content[idx:idx+2000]
        out.write(f'Found at char {idx}\n\n')
        for i, line in enumerate(chunk.split('\n')[:10]):
            out.write(f'Line {i}: {line}\n')
    else:
        out.write('COUNTRIES not found')
