const fs = require('fs');

// Read the file
const content = fs.readFileSync('src/lib/i18n/translations.ts', 'utf8');
const lines = content.split('\n');
console.log('Total lines:', lines.length);

// Strategy: 
// 1. Change "zh-CN" everywhere to "zh-Hant" in the file text
// 2. Add "es-ES" block as a copy of "zh-Hant" but with Spanish translations
// 3. Remove the zh-CN block entirely

let result = content
  .replace(/"zh-CN": \{/g, '"zh-Hant": {')
  .replace(/switchToChinese: "切换到中文"/g, 'switchToChinese: "切換到繁體中文"')
  .replace(/switchToSpanish: "切换到西班牙语"/g, 'switchToSpanish: "Cambiar a español"')
  .replace(/switchToTraditionalChinese: "切换到繁体中文"/g, 'switchToTraditionalChinese: "切換到繁體中文"')
  // Basic zh-CN → zh-Hant character conversions (most common)
  .replace(/注册/g, '註冊')
  .replace(/认证/g, '認證')
  .replace(/授权/g, '授權')
  .replace(/功能/g, '功能')
  .replace(/特点/g, '特點')
  .replace(/使用/g, '使用')
  .replace(/如何/g, '如何')
  .replace(/价格/g, '價格')
  .replace(/方案/g, '方案')
  .replace(/常见/g, '常見')
  .replace(/问题/g, '問題')
  .replace(/登录/g, '登入')
  .replace(/免费/g, '免費')
  .replace(/开始/g, '開始')
  .replace(/律师/g, '律師')
  .replace(/入驻/g, '入駐')
  .replace(/找律师/g, '找律師')
  .replace(/日间/g, '日間')
  .replace(/夜间/g, '夜間')
  .replace(/切换/g, '切換')
  .replace(/模式/g, '模式')
  .replace(/语言/g, '語言')
  .replace(/已上线/g, '已上線')
  .replace(/以太坊/g, '以太坊')
  .replace(/区块链/g, '區塊鏈')
  .replace(/你的/g, '你的')
  .replace(/肖像/g, '肖像')
  .replace(/权利/g, '權利')
  .replace(/不可变/g, '不可變')
  .replace(/时间戳/g, '時間戳')
  .replace(/存储/g, '存儲')
  .replace(/智能/g, '智能')
  .replace(/合约/g, '合約')
  .replace(/许可/g, '許可')
  .replace(/一次/g, '一次')
  .replace(/永远/g, '永遠')
  .replace(/拥有/g, '擁有')
  .replace(/立即/g, '立即')
  .replace(/了解/g, '了解')
  .replace(/艺术家/g, '藝術家')
  .replace(/创作者/g, '創作者')
  .replace(/保护/g, '保護')
  .replace(/所需/g, '所需')
  .replace(/上传/g, '上傳')
  .replace(/链上/g, '鏈上')
  .replace(/只需/g, '只需')
  .replace(/几分钟/g, '幾分鐘')
  .replace(/完全/g, '完全')
  .replace(/自动化/g, '自動化')
  .replace(/密码学/g, '密碼學')
  .replace(/安全/g, '安全')
  .replace(/以太坊区块链上/g, '以太坊區塊鏈上')
  .replace(/铸造成/g, '鑄造為')
  .replace(/链上资产/g, '鏈上資產')
  .replace(/防篡改/g, '防篡改')
  .replace(/记录/g, '記錄')
  .replace(/去中心化/g, '去中心化')
  .replace(/冗余/g, '冗餘')
  .replace(/备份/g, '備份')
  .replace(/抗审查/g, '抗審查')
  .replace(/设定/g, '設定')
  .replace(/可以使用/g, '可以使用')
  .replace(/使用期限/g, '使用期限')
  .replace(/自动执行/g, '自動執行')
  .replace(/版税/g, '版稅')
  .replace(/自动收取/g, '自動收取')
  .replace(/被授权/g, '被授權')
  .replace(/获得报酬/g, '獲得報酬')
  .replace(/每笔/g, '每筆')
  .replace(/交易/g, '交易')
  .replace(/通过/g, '通過')
  .replace(/路由/g, '路由')
  .replace(/按比例/g, '按比例')
  .replace(/分成/g, '分成')
  .replace(/侵权/g, '侵權')
  .replace(/检测/g, '檢測')
  .replace(/驱动/g, '驅動')
  .replace(/图像/g, '圖像')
  .replace(/扫描/g, '掃描')
  .replace(/监控/g, '監控')
  .replace(/网络/g, '網絡')
  .replace(/未经/g, '未經')
  .replace(/未经授权/g, '未經授權')
  .replace(/行为/g, '行為')
  .replace(/身份/g, '身份')
  .replace(/企业/g, '企業')
  .replace(/级/g, '級')
  .replace(/名人/g, '名人')
  .replace(/艺术家/g, '藝術家')
  .replace(/公众/g, '公眾')
  .replace(/人物/g, '人物')
  .replace(/验证/g, '驗證')
  .replace(/在链上/g, '在鏈上')
  .replace(/白名单/g, '白名單')
  .replace(/登记/g, '登記')
  .replace(/描述/g, '描述')
  .replace(/步骤/g, '步驟')
  .replace(/简单/g, '簡單')
  .replace(/分钟/g, '分鐘')
  .replace(/完成/g, '完成')
  .replace(/立即/g, '立即')
  .replace(/上传/g, '上傳')
  .replace(/铸造/g, '鑄造')
  .replace(/获得/g, '獲得')
  .replace(/永久/g, '永久')
  .replace(/链接/g, '鏈接')
  .replace(/查看/g, '查看')
  .replace(/区块链/g, '區塊鏈')
  .replace(/浏览器/g, '瀏覽器')
  .replace(/存储/g, '存儲')
  .replace(/数据/g, '數據')
  .replace(/费用/g, '費用')
  .replace(/免费/g, '免費')
  .replace(/开始/g, '開始')
  .replace(/免费注册/g, '免費註冊')
  .replace(/了解更多/g, '了解更多')
  .replace(/查看/g, '查看')
  .replace(/所有/g, '所有')
  .replace(/常见/g, '常見')
  .replace(/问题/g, '問題')
  .replace(/搜索/g, '搜索')
  .replace(/没有找到/g, '沒有找到')
  .replace(/您有什么问题？/g, '您有什麼問題？')
  .replace(/常见问题/g, '常見問題')
  .replace(/关于我们/g, '關於我們')
  .replace(/联系我们/g, '聯繫我們')
  .replace(/隐私/g, '隱私')
  .replace(/政策/g, '政策')
  .replace(/条款/g, '條款')
  .replace(/Cookie/g, 'Cookie')
  .replace(/政策/g, '政策')
  .replace(/保留/g, '保留')
  .replace(/所有/g, '所有')
  .replace(/权利/g, '權利')
  .replace(/联系我们/g, '聯繫我們')
  .replace(/联系/g, '聯繫')
  .replace(/我们/g, '我們');

// Find the end of zh-Hant block to add es-ES after it
// The file ends with:
//   },
// };

const endMarker = 'export type TranslationKeys = (typeof translations)["zh-CN"];';
const newEndMarker = 'export type TranslationKeys = (typeof translations)["zh-Hant"];';
result = result.replace(endMarker, newEndMarker);

// Create es-ES block from zh-Hant
const zhHantStart = result.indexOf('"zh-Hant": {');
const closingBrace = findClosingBrace(result, zhHantStart + '"zh-Hant": {'.length - 1);
const zhHantBlock = result.slice(zhHantStart, closingBrace + 1);

// Create es-ES block
const esBlock = `
  "es-ES": {
    meta: {
      title: "PortraitPay AI - Tu Retrato, Tus Derechos",
      description: "Certifica y protege tus derechos de retrato en la blockchain de Ethereum con timestamps inmutables y licencias inteligentes.",
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
  },`;

// Insert es-ES before the last closing braces
const lastClosing = result.lastIndexOf('  },');
const insertPos = lastClosing + '  },'.length;
result = result.slice(0, insertPos) + ',' + esBlock + result.slice(insertPos);

fs.writeFileSync('src/lib/i18n/translations.ts', result);
console.log('Done! Lines:', result.split('\n').length);

function findClosingBrace(str, start) {
  let count = 0;
  for (let i = start; i < str.length; i++) {
    if (str[i] === '{') count++;
    else if (str[i] === '}') {
      count--;
      if (count === 0) return i;
    }
  }
  return -1;
}