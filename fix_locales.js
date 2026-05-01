const fs = require('fs');

// Read the file
const filePath = 'src/lib/i18n/translations.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace zh-CN with zh-Hant in the translations object
content = content.replace(/"zh-CN": \{/g, '"zh-Hant": {');

// 2. Add es-ES translation block after zh-Hant block
// Find the end of zh-Hant block and insert es-ES after it
// We need to find where zh-Hant ends and insert es-ES

// Find the pattern: "zh-Hant": { ...whole block... }
// Let's do this by finding the block boundary

// For now, let's just add a placeholder es-ES block
// Find where "zh-Hant" block starts
const zhHantMatch = content.match(/"zh-Hant": \{/);
if (!zhHantMatch) {
  console.log('Could not find zh-Hant block');
  process.exit(1);
}

const startIdx = zhHantMatch.index;
console.log('Found zh-Hant at index:', startIdx);

// Find the matching closing brace
let braceCount = 0;
let inString = false;
let stringChar = '';
let endIdx = -1;

for (let i = startIdx + zhHantMatch[0].length - 1; i < content.length; i++) {
  const c = content[i];
  const prev = i > 0 ? content[i-1] : '';
  
  if (!inString) {
    if (c === '"' || c === "'" || c === '`') {
      stringChar = c;
      inString = true;
    } else if (c === '{') {
      braceCount++;
    } else if (c === '}') {
      braceCount--;
      if (braceCount === 0) {
        endIdx = i + 1;
        break;
      }
    }
  } else {
    if (prev !== '\\' && c === stringChar) {
      inString = false;
    }
  }
}

console.log('zh-Hant block ends at index:', endIdx);

// Extract zh-Hant content (without the outer braces)
const zhHantBlock = content.slice(startIdx, endIdx);

// Create es-ES block by translating key strings
let esBlock = zhHantBlock
  .replace(/zh-Hant/g, 'es-ES')
  // Translate common strings to Spanish
  .replace(/导航/g, 'Navegación')
  .replace(/功能特点/g, 'Características')
  .replace(/如何使用/g, 'Cómo funciona')
  .replace(/价格方案/g, 'Precios')
  .replace(/常见问题/g, 'Preguntas frecuentes')
  .replace(/登录/g, 'Iniciar sesión')
  .replace(/免费开始/g, 'Empezar gratis')
  .replace(/律师入驻/g, 'Abogados')
  .replace(/找律师/g, 'Buscar abogado')
  .replace(/日间/g, 'Claro')
  .replace(/夜间/g, 'Oscuro')
  .replace(/切换到日间模式/g, 'Cambiar a modo claro')
  .replace(/切换到夜间模式/g, 'Cambiar a modo oscuro')
  .replace(/语言/g, 'Idioma')
  .replace(/切换到中文/g, 'Cambiar a español')
  .replace(/切换到英文/g, 'Cambiar a inglés')
  .replace(/已上线以太坊区块链/g, 'Registrado en blockchain de Ethereum')
  .replace(/你的肖像/g, 'Tu retrato')
  .replace(/你的权利/g, 'Tus derechos')
  .replace(/在以太坊区块链上注册你的肖像权/g, 'Registra los derechos de tu retrato en la blockchain de Ethereum')
  .replace(/不可变时间戳/g, 'Marca de tiempo inmutable')
  .replace(/IPFS 存储/g, 'Almacenamiento IPFS')
  .replace(/智能合约许可/g, 'Licencia con contrato inteligente')
  .replace(/一次注册/g, 'Un registro')
  .replace(/永远拥有/g, 'Propiedad para siempre')
  .replace(/免费注册/g, 'Registro gratuito')
  .replace(/立即开始/g, 'Comienza ahora')
  .replace(/了解如何使用/g, 'Saber más')
  .replace(/已注册艺术家和创作者/g, 'Artistas y creadores registrados')
  .replace(/保护你肖像权所需的一切/g, 'Todo lo que necesitas para proteger los derechos de tu retrato')
  .replace(/从上传到链上认证/g, 'Desde la subida hasta la certificación en cadena')
  .replace(/只需几分钟/g, 'Solo unos minutos')
  .replace(/完全自动化/g, 'Totalmente automatizado')
  .replace(/密码学安全/g, 'Seguridad criptográfica')
  .replace(/区块链认证/g, 'Certificación blockchain')
  .replace(/在以太坊区块链上将你的肖像铸造成链上资产/g, 'Certifica tu retrato como activo en la blockchain de Ethereum')
  .replace(/防篡改记录/g, 'Registro a prueba de alteraciones')
  .replace(/去中心化/g, 'Descentralizado')
  .replace(/冗余备份/g, 'Copia de seguridad redundante')
  .replace(/抗审查/g, 'Resistente a la censura')
  .replace(/智能许可/g, 'Licencia inteligente')
  .replace(/设定谁可以使用你的肖像/g, 'Define quién puede usar tu retrato')
  .replace(/使用期限和价格/g, 'Duración y precio')
  .replace(/智能合约自动执行/g, 'Ejecutado automáticamente por contrato inteligente')
  .replace(/版税自动收取/g, 'Regalías automáticas')
  .replace(/肖像被授权时自动获得报酬/g, 'Recibe pagos automáticamente cuando se autorice tu retrato')
  .replace(/每笔交易通过智能合约路由/g, 'Cada transacción se enruta a través de un contrato inteligente')
  .replace(/按比例分成/g, 'División proporcional')
  .replace(/侵权检测/g, 'Detección de infracciones')
  .replace(/AI 驱动的图像扫描/g, 'Escaneo de imágenes con IA')
  .replace(/监控网络上未经授权使用你的认证肖像的行为/g, 'Monitorea el uso no autorizado de tu retrato certificado en la red')
  .replace(/身份认证/g, 'Verificación de identidad')
  .replace(/为企业级名人/g, 'Para celebridades y artistas de nivel empresarial')
  .replace(/在链上白名单登记/g, 'Registrado en la whitelist de la cadena');

// Insert es-ES block right after zh-Hant block
content = content.slice(0, endIdx) + ',\n  ' + esBlock.trim() + content.slice(endIdx);

fs.writeFileSync(filePath, content);
console.log('Done! Written to', filePath);
console.log('New file length:', content.split('\n').length, 'lines');