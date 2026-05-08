with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

with open('es_check.txt', 'w', encoding='utf-8') as out:
    idx_es = content.find('"es-ES":')
    # Find end of es-ES block (it's the last block)
    # Count depth from es-ES start
    depth = 0
    started = False
    end_pos = len(content)
    for i in range(idx_es, len(content)):
        if content[i] == '{':
            depth += 1
            started = True
        elif content[i] == '}':
            depth -= 1
            if started and depth == 0:
                end_pos = i + 1
                break
    
    es_block = content[idx_es:end_pos]
    out.write(f'es-ES block length: {len(es_block)}\n')
    
    # Check for lawyerRegistration
    if 'lawyerRegistration' in es_block:
        idx = es_block.index('lawyerRegistration')
        chunk = es_block[idx:idx+800]
        out.write('es-ES lawyerRegistration FOUND:\n')
        out.write(chunk[:600])
    else:
        out.write('es-ES lawyerRegistration NOT FOUND\n')
        # Show what sections es-ES has
        sections = ['hero', 'features', 'howItWorks', 'pricing', 'FAQ', 'register', 'lawyerRegistration']
        for s in sections:
            out.write(f'  {s}: {s in es_block}\n')
        # Show last 500 chars
        out.write('\nLast 500 chars of es-ES:\n')
        out.write(es_block[-500:])

print('Done')
