const nodemailer = require('nodemailer');

async function test() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 587,
    secure: false,
    auth: {
      user: 'contact@portraitpayai.com',
      pass: 'wHxxBfpzPqdnxT2j'  // New password we just set
    }
  });

  try {
    const info = await transporter.sendMail({
      from: '"PortraitPay AI" <contact@portraitpayai.com>',
      to: '799096322@qq.com',
      subject: 'Test email - PortraitPay AI',
      text: 'This is a test email.',
      html: '<p>This is a test email.</p>'
    });
    console.log('Email sent:', info.messageId);
    console.log('Response:', info.response);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();