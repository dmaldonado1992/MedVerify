const brevo = require('@getbrevo/brevo');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configurar API client (key se establece por envío)
const apiInstance = new brevo.TransactionalEmailsApi();

async function sendEmail(to, subject, html) {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY not configured in environment');
    }
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    const sendSmtpEmail = {
      sender: {
        email: process.env.EMAIL_FROM,
        name: process.env.EMAIL_FROM_NAME || 'MedVerify'
      },
      to: [{ email: to }],
      subject,
      htmlContent: html
    };

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Brevo: Email enviado exitosamente:', data);
    return data;
  } catch (error) {
    console.error('❌ Brevo: Error enviando email:', error);
    throw error;
  }
}

async function sendVideoReadyEmail(to, videoUrl, userName, sendFn) {
  const subject = 'Tu video está listo';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #4CAF50; 
          color: white; 
          text-decoration: none; 
          border-radius: 4px; 
        }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>¡Hola ${userName || 'Usuario'}!</h1>
        <p>Tu video ha sido procesado exitosamente y está listo para ver.</p>
        <p>
          <a href="${videoUrl}" class="button">Ver Video</a>
        </p>
        <p>El link estará disponible por 48 horas.</p>
        <div class="footer">
          <p>Este es un email automático de MedVerify.</p>
          <p>Si tienes problemas, responde este email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const sender = sendFn || sendEmail;
  return await sender(to, subject, html);
}

module.exports = { sendEmail, sendVideoReadyEmail };

async function sendEmailGmail(to, subject, html) {
  try {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;
    if (!user || !pass) throw new Error('Gmail credentials not configured (GMAIL_USER/GMAIL_APP_PASSWORD)');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || user,
      to,
      subject,
      html,
    });

    console.log('✅ Gmail service: Email sent:', info && info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Gmail service: Error sending email:', error && error.message);
    throw error;
  }
}

module.exports.sendEmailGmail = sendEmailGmail;
