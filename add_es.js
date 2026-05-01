const fs = require('fs');
let content = fs.readFileSync('src/lib/i18n/translations.ts', 'utf8');

// Find where zh-Hant block ends and translations object closes
// We need to insert es-ES block before the closing };

// Find the closing pattern: }; before "export type TranslationKeys"
const endMarker = 'export type TranslationKeys';
const endIdx = content.indexOf(endMarker);
const beforeExport = content.slice(0, endIdx);

// Find the last "}," before the export
const lastClosing = beforeExport.lastIndexOf('  },');
console.log('Last closing at char:', lastClosing);

// Now find what comes right before it - should be the closing } of zh-Hant block
const beforeLastClosing = beforeExport.slice(0, lastClosing);
const zhHantEnd = beforeLastClosing.lastIndexOf('  }');
console.log('zh-Hant ends at char:', zhHantEnd);

// The structure before the fix should be:
// ...zh-Hant content...
//           }
//         },
// export type TranslationKeys...

// We need to change the structure to add es-ES between them
// Current ending: "  }\n};\n" (zh-Hant's closing brace then translations object close)
// We want: "  },\n  \"es-ES\": {...},\n};\n"

const esESBlock = `,
  "es-ES": {
    meta: {
      title: "PortraitPay AI - Tu Retrato, Tus Derechos",
      description: "Certifica y protege tus derechos de retrato en la blockchain de Ethereum.",
    },
    nav: {
      features: "Características",
      howItWorks: "Cómo funciona",
      pricing: "Precios",
      faq: "FAQ",
      signIn: "Iniciar sesión",
      getStarted: "Empezar gratis",
      lawyer: "Abogados",
      findLawyer: "Buscar abogado",
    },
    common: {
      lightMode: "Claro",
      darkMode: "Oscuro",
      switchToLight: "Cambiar a modo claro",
      switchToDark: "Cambiar a modo oscuro",
      language: "Idioma",
      switchToEnglish: "Cambiar a inglés",
      switchToSpanish: "Cambiar a español",
      switchToTraditionalChinese: "Cambiar a chino tradicional",
    },
  }`;

console.log('Content around zh-Hant end:');
console.log(JSON.stringify(content.slice(zhHantEnd - 10, zhHantEnd + 20)));

// Replace the ending },\nexport with },\nes-ES block,\nexport
const oldEnding = '  }\n};\n\nexport type TranslationKeys';
const newEnding = '  }' + esESBlock + '\n};\n\nexport type TranslationKeys';

const newContent = content.replace(oldEnding, newEnding);
fs.writeFileSync('src/lib/i18n/translations.ts', newContent);
console.log('Done. Lines:', newContent.split('\n').length);
console.log('Has es-ES block:', newContent.includes('"es-ES": {'));