const brevo = require('@getbrevo/brevo');
require('dotenv').config();

// Configurar API
const apiInstance = new brevo.TransactionalEmailsApi();
if (process.env.BREVO_API_KEY) {
  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
  );
}

async function sendEmail(to, subject, html) {
  try {
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

async function sendVideoReadyEmail(to, videoUrl, userName) {
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

  return await sendEmail(to, subject, html);
}

module.exports = { sendEmail, sendVideoReadyEmail };
