const fs = require('fs');
let c = fs.readFileSync('src/lib/i18n/translations.ts', 'utf8');

const replacements = [
  ['已上线 Ethereum Sepolia 测试网', '已上线以太坊区块链'],
  ['在 Sepolia 测试网上将你的肖像铸造成链上资产。不可变时间戳，防篡改记录。', '在以太坊区块链上将你的肖像铸造成链上资产。不可变时间戳，防篡改记录。'],
  ['KYC 身份认证', '身份认证'],
  ['完成 KYC', '完成身份认证'],
  ['一键在 Sepolia 测试网上铸造。你的肖像哈希、元数据和时间戳被永久记录。', '一键在以太坊区块链上铸造。你的肖像哈希、元数据和时间戳被永久记录。'],
  ['基础 KYC（自我声明）', '基础身份认证（自我声明）'],
  ['完整 KYC 认证', '完整身份认证'],
  ['什么是 KYC？为什么需要它？', '什么是身份认证？为什么需要它？'],
  ['KYC（了解你的客户）验证你的身份以防止欺诈。对于公众人物和名人，需要完整 KYC 才能认证肖像并访问企业授权功能。', '身份认证验证你的身份以防止欺诈。对于公众人物和名人，需要完整身份认证才能认证肖像并访问企业授权功能。'],
];

replacements.forEach(([oldStr, newStr]) => {
  const escaped = oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const countBefore = (c.match(new RegExp(escaped, 'g')) || []).length;
  c = c.split(oldStr).join(newStr);
  console.log('Replaced:', oldStr.substring(0, 40), '-> count:', countBefore);
});

fs.writeFileSync('src/lib/i18n/translations.ts', c);
console.log('Done');