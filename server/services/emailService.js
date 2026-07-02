// server/services/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '../.env' });

// Setup Nodemailer transporter
// If SMTP variables are not configured, it will log to console (useful for development)
const transporter = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
}) : null;

const FROM_EMAIL = process.env.SMTP_FROM || 'noreply@brandvox.ai';

async function sendEmail(to, subject, htmlContent) {
  if (!transporter) {
    console.log('\n--- MOCK EMAIL SENT ---');
    console.log(`To: ${to}\nSubject: ${subject}\nBody: ${htmlContent}`);
    console.log('-----------------------\n');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"BrandVox AI" <${FROM_EMAIL}>`,
      to,
      subject,
      html: htmlContent
    });
    console.log(`[EmailService] Sent email to ${to}: ${info.messageId}`);
  } catch (err) {
    console.error(`[EmailService] Failed to send email to ${to}:`, err);
  }
}

async function sendWelcomeEmail(to, name) {
  const subject = 'Welcome to BrandVox AI! 🚀';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
      <h2>Welcome, ${name || 'Creator'}!</h2>
      <p>We are thrilled to have you on board. We've deposited <b>₹50.00 free credits</b> into your account so you can start creating cinematic AI videos instantly.</p>
      <p>Head over to the Studio and unleash your creativity!</p>
      <a href="${process.env.CLIENT_URL}/studio" style="display: inline-block; padding: 10px 20px; background-color: #7c3aed; color: #fff; text-decoration: none; border-radius: 5px;">Go to Studio</a>
    </div>
  `;
  await sendEmail(to, subject, html);
}

async function sendPaymentReceipt(to, amount, credits, packageName) {
  const subject = 'Payment Receipt - BrandVox AI';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
      <h2>Payment Successful!</h2>
      <p>Thank you for purchasing the <b>${packageName}</b>.</p>
      <p>We have successfully processed your payment of <b>₹${amount}</b> and added <b>${credits} credits</b> to your account balance.</p>
      <p>Happy Creating!</p>
    </div>
  `;
  await sendEmail(to, subject, html);
}

async function sendVideoReadyEmail(to, videoTitle) {
  const subject = 'Your AI Video is Ready! 🎬';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
      <h2>Video Render Complete</h2>
      <p>Your requested video "<b>${videoTitle}</b>" has successfully finished rendering and is now available in your Studio history.</p>
      <a href="${process.env.CLIENT_URL}/studio" style="display: inline-block; padding: 10px 20px; background-color: #7c3aed; color: #fff; text-decoration: none; border-radius: 5px;">View Video</a>
    </div>
  `;
  await sendEmail(to, subject, html);
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPaymentReceipt,
  sendVideoReadyEmail
};
