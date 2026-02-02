const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVideoEmail(userEmail, videoUrl, filename) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: `Tu video "${filename}" está listo`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">¡Video disponible!</h2>
          <p>Tu video <strong>${filename}</strong> ha sido procesado correctamente.</p>
          <a href="${videoUrl}" 
             style="display: inline-block; padding: 12px 24px; background: #007bff; 
                    color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Ver Video
          </a>
          <p style="color: #666; font-size: 12px;">
            Este enlace expira en 24 horas por seguridad.
          </p>
        </div>
      `,
    });
    console.log('✅ Email sent to:', userEmail);
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
}

module.exports = { sendVideoEmail };
