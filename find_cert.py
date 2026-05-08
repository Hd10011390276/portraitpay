import os, glob

for f in glob.glob('src/**/*certificate*.ts', recursive=True):
    print(f)
    
# Search for the import
for f in glob.glob('src/**/*.ts', recursive=True):
    try:
        with open(f, 'r', encoding='utf-8') as fh:
            content = fh.read()
        if 'buildPortraitCertificate' in content:
            print(f'FOUND in: {f}')
            # Show context
            for i, line in enumerate(content.split('\n')):
                if 'buildPortraitCertificate' in line:
                    print(f'  Line {i+1}: {line.strip()}')
    except:
        pass