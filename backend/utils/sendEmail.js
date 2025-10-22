const nodemailer = require('nodemailer');

async function getTransport() {
  let { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  // Nếu không có account SMTP -> tạo Ethereal dev
  if (!SMTP_USER || !SMTP_PASS) {
    const test = await nodemailer.createTestAccount();
    SMTP_USER = test.user; SMTP_PASS = test.pass;
    console.log('[EMAIL] Using Ethereal dev account:', { user: SMTP_USER, pass: SMTP_PASS });
  }

  return nodemailer.createTransport({
    host: SMTP_HOST || 'smtp.ethereal.email',
    port: Number(SMTP_PORT) || 587,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

module.exports = async function sendEmail(to, subject, html) {
  const transporter = await getTransport();
  const info = await transporter.sendMail({
    from: '"Group8 App" <no-reply@group8.local>',
    to, subject, html
  });
  const preview = require('nodemailer').getTestMessageUrl(info);
  if (preview) console.log('[EMAIL PREVIEW]', preview);
  return { messageId: info.messageId, preview };
};
