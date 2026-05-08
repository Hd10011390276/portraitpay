with open('src/app/enterprise/lawyer-registration/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

with open('verify.txt', 'w', encoding='utf-8') as out:
    # Check COUNTRIES
    idx = content.find('const COUNTRIES')
    chunk = content[idx:idx+800]
    out.write('COUNTRIES section:\n')
    for line in chunk.split('\n')[:5]:
        out.write(line + '\n')
    
    # Check lawyerType comment
    lt = content.find('lawyerType:')
    out.write('\nlawyerType comment:\n')
    out.write(content[lt:lt+100] + '\n')
    
    # Check for any remaining Chinese
    chinese_chars = [c for c in content if '\u4e00' <= c <= '\u9fff']
    out.write(f'\nTotal Chinese chars in file: {len(chinese_chars)}\n')
    
    # Check if es-ES block has lawyerRegistration
with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    t_content = f.read()

idx_es = t_content.find('"es-ES":')
en_start = t_content.find('"en-US":')
es_block = t_content[idx_es:idx_es+80000] if idx_es >= 0 else ''
en_block = t_content[en_start:en_start+80000]
has_lr_es = 'lawyerRegistration' in es_block
has_lr_en = 'lawyerRegistration' in en_block
with open('verify.txt', 'a', encoding='utf-8') as out:
    out.write(f'\nes-ES has lawyerRegistration: {has_lr_es}\n')
    out.write(f'en-US has lawyerRegistration: {has_lr_en}\n')
    
    # Find what locale section the page is actually rendering from
    # by checking what t.navbar would be
    t_sample = t_content[t_content.find('navbar'):t_content.find('navbar')+200] if 'navbar' in t_content else ''
    out.write(f'\nFirst navbar reference: {repr(t_sample[:100])}\n')

print('Verification complete')
