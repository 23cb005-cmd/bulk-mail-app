const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

async function sendMailTo(recipient, { subject, body }) {
  const fromName = process.env.SMTP_FROM_NAME || "Bulk Mailer";
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  await getTransporter().sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: recipient,
    subject,
    html: body,
  });
}

module.exports = { sendMailTo, getTransporter };
