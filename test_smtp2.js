const nodemailer = require('nodemailer');

async function test() {
  // Try port 465 (SSL)
  const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: 'contact@portraitpayai.com',
      pass: 'wHxxBfpzPqdnxT2j'
    }
  });

  try {
    const info = await transporter.sendMail({
      from: '"PortraitPay AI" <contact@portraitpayai.com>',
      to: '799096322@qq.com',
      subject: 'Test email port 465 - PortraitPay AI',
      text: 'Test via port 465',
    });
    console.log('Sent:', info.messageId);
  } catch (err) {
    console.error('Port 465 error:', err.message);
    
    // Try different auth
    console.log('Trying auth...');
  }
}

test();