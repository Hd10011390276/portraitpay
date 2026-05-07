const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 587,
  secure: false,
  auth: {
    user: 'contact@portraitpayai.com',
    pass: 'e54gqTGgzSKnCAVg'
  }
});

transporter.verify()
  .then(() => console.log('SMTP connection OK'))
  .catch(e => console.log('SMTP error:', e.message));