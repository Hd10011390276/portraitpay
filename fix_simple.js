const fs = require('fs');
const content = fs.readFileSync('src/lib/i18n/translations.ts', 'utf8');

let result = content;

// Step 1: Change "zh-CN" to "zh-Hant" 
result = result.replace(/"zh-CN": \{/g, '"zh-Hant": {');

// Step 2: Update TranslationKeys type  
result = result.replace(
  'export type TranslationKeys = (typeof translations)["zh-CN"];',
  'export type TranslationKeys = (typeof translations)["en-US"];'
);

// Step 3: Find where the translations object closes (the }; before export)
// and insert es-ES before it
const endMarker = 'export type TranslationKeys';
const endIdx = result.indexOf(endMarker);
if (endIdx === -1) { console.log('Could not find end marker'); process.exit(1); }

// Go back to find the last "}," before "export type"
const beforeExport = result.slice(0, endIdx);
// The last "}," in beforeExport is the closing of the last locale block
const lastCommaClose = beforeExport.lastIndexOf('  },');
console.log('Insert es-ES at character position:', lastCommaClose);

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

result = result.slice(0, lastCommaClose + '  },'.length) + esESBlock + result.slice(lastCommaClose + '  },'.length);

fs.writeFileSync('src/lib/i18n/translations.ts', result);
console.log('Done. Lines:', result.split('\n').length);
console.log('Has zh-Hant:', result.includes('"zh-Hant": {'));
console.log('Has es-ES:', result.includes('"es-ES": {'));