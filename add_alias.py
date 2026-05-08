with open('src/lib/export/portrait-certificate.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Add alias after the buildCertificateImage function
# Find the closing brace of the function
old = '  return result;\n}'

new = '''  return result;
}

// Alias for backward compatibility
export const buildPortraitCertificate = buildCertificateImage;
'''

if old in content:
    content = content.replace(old, new)
    print('Added alias export')
else:
    print('Pattern not found')
    # Show last 5 lines
    for i, line in enumerate(content.split('\n')[-10:]):
        print(f'L{len(content.split(chr(10)))-10+i}: {repr(line)}')

with open('src/lib/export/portrait-certificate.ts', 'w', encoding='utf-8') as f:
    f.write(content)

# Verify
with open('src/lib/export/portrait-certificate.ts', 'r', encoding='utf-8') as f:
    c = f.read()
print(f'buildPortraitCertificate in file: {"buildPortraitCertificate" in c}')