const fs = require('fs');
const content = fs.readFileSync('src/lib/i18n/translations.ts', 'utf8');
const lines = content.split('\n');
console.log('Total lines:', lines.length);
console.log('Last 5 lines:');
for (let i = Math.max(0, lines.length - 5); i < lines.length; i++) {
  const line = lines[i];
  console.log('Line', i+1, '|', JSON.stringify(line.slice(0, 80)));
}
const count = (content.match(/\*\//g) || []).length;
console.log('Count of "*/":', count);
console.log('File ends with:', JSON.stringify(content.slice(-20)));
console.log('Last char code:', content.charCodeAt(content.length-1));
console.log('Has trailing newline:', content.endsWith('\n'));
console.log('Has carriage return:', content.includes('\r'));
console.log('CRLF count:', (content.match(/\r\n/g) || []).length);
console.log('LF only count:', (content.match(/[^\r]\n/g) || []).length);
