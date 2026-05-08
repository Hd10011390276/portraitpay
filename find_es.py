with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all locale keys
import re
matches = [(m.start(), m.group()) for m in re.finditer(r'^\s+"(en-US|es-ES|zh-Hant|zh-CN)":', content, re.MULTILINE)]
for pos, name in matches:
    line = content[:pos].count('\n') + 1
    print(f'{name} at line ~{line}')

# Find es-ES block lawyerRegistration
idx = content.find('"es-ES":')
if idx >= 0:
    # Count braces to find end of es-ES block
    depth = 0
    i = idx
    started = False
    while i < len(content):
        if content[i] == '{':
            depth += 1
            started = True
        elif content[i] == '}':
            depth -= 1
            if started and depth == 0:
                es_end = i + 1
                break
        i += 1
    es_block = content[idx:es_end]
    # Find lawyerRegistration
    if 'lawyerRegistration' in es_block:
        lridx = es_block.index('lawyerRegistration:')
        lrrange = es_block[lridx:]
        lend = lrrange.index('    },')
        es_lr = lrrange[:lend+1]
        print('\nes-ES lawyerRegistration:')
        print(es_lr[:3000])
    else:
        print('\nes-ES has NO lawyerRegistration!')
else:
    print('No es-ES block found')
