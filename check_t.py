with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

with open('t_check.txt', 'w', encoding='utf-8') as out:
    idx_zh = content.find('"zh-Hant":')
    idx_en = content.find('"en-US":')
    idx_es = content.find('"es-ES":')
    
    out.write(f'zh-Hant at: {idx_zh}, en-US at: {idx_en}, es-ES at: {idx_es}\n\n')
    
    # Show zh-Hant lawyerRegistration
    if idx_zh >= 0:
        block = content[idx_zh:idx_en]
        lr_idx = block.find('lawyerRegistration')
        if lr_idx >= 0:
            lr_block = block[lr_idx:lr_idx+1500]
            out.write('zh-Hant lawyerRegistration:\n')
            out.write(lr_block[:500])
            out.write('\n\n')
    
    # Show en-US lawyerRegistration  
    en_block = content[idx_en:]
    lr_idx_en = en_block.find('lawyerRegistration')
    if lr_idx_en >= 0:
        lr_block_en = en_block[lr_idx_en:lr_idx_en+1500]
        out.write('en-US lawyerRegistration:\n')
        out.write(lr_block_en[:500])

print('Check complete')
