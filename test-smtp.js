const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.exmail.qq.com',
  port: 465,
  secure: true,
  auth: { user: 'contact@portraitpayai.com', pass: 'wHxxBfpzPqdnxT2j' }
});
transporter.sendMail({
  from: '"PortraitPay AI" <contact@portraitpayai.com>',
  to: '2100113902@qq.com',
  subject: 'SMTP测试邮件',
  text: '这是一封SMTP测试邮件，收到请忽略。'
}).then(() => console.log('✅ 邮件发送成功')).catch(e => console.error('❌ 失败:', e.message));
