const fs = require('fs');
const content = fs.readFileSync('src/lib/i18n/translations.ts', 'utf8');

// Replace the double-comma and es-ES block before the closing };
const badPattern = /  },\n},\n  "es-ES": \{[^}]+\}[^}]+\}\n\};\n\nexport type TranslationKeys/g;
const fixed = content.replace(badPattern, '  }\n};\n\nexport type TranslationKeys');

fs.writeFileSync('src/lib/i18n/translations.ts', fixed);
console.log('Fixed. Lines:', fixed.split('\n').length);
console.log('Has double comma:', fixed.includes('},\n},')); // should be false