const { Resend } = require('resend');
const nodemailer = require('nodemailer');
require('dotenv').config();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const brevoService = require('../services/emailService');

function buildVideoEmailHtml(filename, videoUrl, password) {
  const urlApplicacion = process.env.urlApplicacion || 'https://medverifyfront.onrender.com/login';
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 0;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8c 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 300;
          letter-spacing: 0.5px;
        }
        .header p {
          margin: 5px 0 0 0;
          font-size: 13px;
          opacity: 0.9;
        }
        .content {
          padding: 35px 30px;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 25px;
          color: #2d2d2d;
        }
        .message {
          background-color: #f9f9f9;
          border-left: 4px solid #2d5a8c;
          padding: 20px;
          margin: 25px 0;
          border-radius: 4px;
          font-size: 14px;
          color: #555;
        }
        .credentials-section {
          background-color: #f0f7ff;
          border: 1px solid #d0e8ff;
          border-radius: 6px;
          padding: 25px;
          margin: 30px 0;
        }
        .credentials-section h3 {
          margin: 0 0 20px 0;
          color: #1e3a5f;
          font-size: 16px;
          font-weight: 600;
        }
        .credential-item {
          display: flex;
          margin: 15px 0;
          align-items: flex-start;
        }
        .credential-label {
          font-weight: 600;
          color: #2d5a8c;
          min-width: 120px;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .credential-value {
          background-color: #ffffff;
          border: 1px solid #d0e8ff;
          padding: 8px 12px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          font-weight: 500;
          color: #1e3a5f;
          flex: 1;
          word-break: break-all;
        }
        .cta-button {
          display: inline-block;
          width: 100%;
          text-align: center;
          padding: 16px 24px;
          background: linear-gradient(135deg, #2d5a8c 0%, #1e3a5f 100%);
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 30px 0;
          font-size: 15px;
          letter-spacing: 0.5px;
          transition: opacity 0.3s;
        }
        .cta-button:hover {
          opacity: 0.9;
        }
        .instructions {
          background-color: #fafafa;
          border-radius: 6px;
          padding: 20px;
          margin: 25px 0;
          font-size: 13px;
          color: #666;
          line-height: 1.8;
        }
        .instructions h4 {
          margin: 0 0 12px 0;
          color: #1e3a5f;
          font-size: 14px;
          font-weight: 600;
        }
        .instructions ol {
          margin: 0;
          padding-left: 20px;
        }
        .instructions li {
          margin: 8px 0;
        }
        .footer {
          background-color: #f5f5f5;
          border-top: 1px solid #e0e0e0;
          padding: 25px 30px;
          text-align: center;
          font-size: 12px;
          color: #999;
        }
        .footer-link {
          color: #2d5a8c;
          text-decoration: none;
        }
        .security-notice {
          font-size: 12px;
          color: #d9534f;
          background-color: #fff5f5;
          border: 1px solid #f5c6c6;
          border-radius: 4px;
          padding: 12px 15px;
          margin: 20px 0;
        }
        .security-notice strong {
          color: #c9302c;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>MedVerify</h1>
          <p>Sistema de Gestión de Estudios Médicos</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            <p>Estimado usuario,</p>
          </div>
          
          <div class="message">
            <p>El archivo de estudio <strong>"${filename}"</strong> ha sido procesado correctamente y está listo para su revisión.</p>
          </div>
          
          <div class="credentials-section">
            <h3>Datos de Acceso</h3>
            <p style="margin: 0 0 15px 0; color: #666; font-size: 13px;">Utilice las siguientes credenciales para acceder a su estudio:</p>
            
            <div class="credential-item">
              <div class="credential-label">Correo Electrónico:</div>
              <div class="credential-value" id="emailDisplay">Cargando...</div>
            </div>
            
            ${password ? `
            <div class="credential-item">
              <div class="credential-label">Contraseña:</div>
              <div class="credential-value">${password}</div>
            </div>
            ` : ''}
          </div>
          
          <a href="${urlApplicacion}" class="cta-button">Acceder a MedVerify</a>
          
          <div class="instructions">
            <h4>Instrucciones de Acceso:</h4>
            <ol>
              <li>Haga clic en el botón "Acceder a MedVerify" o visite directamente el sitio</li>
              <li>Ingrese su correo electrónico en el campo de usuario</li>
              <li>Ingrese la contraseña proporcionada arriba</li>
              <li>Acceda a su estudio y revíselo según sea necesario</li>
            </ol>
          </div>
          
          <div class="security-notice">
            <strong>⚠ Aviso de Seguridad:</strong> Este enlace y sus credenciales son confidenciales. No comparta este correo con terceros. El acceso a este sistema está restringido únicamente a personal autorizado.
          </div>
          
          <p style="color: #999; font-size: 12px; margin-top: 20px; margin-bottom: 0;">
            Si no solicitó este acceso o tiene preguntas, comuníquese con el equipo de soporte técnico de su institución.
          </p>
        </div>
        
        <div class="footer">
          <p style="margin: 0 0 10px 0;">
            <strong>MedVerify</strong> - Sistema de Gestión de Estudios Médicos
          </p>
          <p style="margin: 0;">
            Este es un correo automático enviado por el sistema. Por favor, no responda a este mensaje.
          </p>
        </div>
      </div>
      
      <script>
        // Nota: Este script no se ejecutará en los clientes de email
        // Se incluye solo como referencia para HTML5 completo
      </script>
    </body>
    </html>
  `;
}

async function sendVideoEmailResend(userEmail, videoUrl, filename) {
  if (!resend) return console.warn('Resend API key not configured');
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: `Med Verify - El video de tu estudio "${filename}" está listo`,
      html: buildVideoEmailHtml(filename, videoUrl),
    });
    console.log('✅ Resend: Email sent to:', userEmail);
  } catch (error) {
    console.error('❌ Resend: Error sending email:', error);
    throw error;
  }
}

async function sendVideoEmailGmail(userEmail, videoUrl, filename) {
  // Requires these environment vars: GMAIL_USER, GMAIL_APP_PASSWORD (or GMAIL_PASS)
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;
  if (!user || !pass) {
    console.warn('Gmail credentials not configured (GMAIL_USER/GMAIL_PASS)');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || user,
      to: userEmail,
      subject: `Med Verify - El video de tu estudio "${filename}" está listo`,
      html: buildVideoEmailHtml(filename, videoUrl),
    });
    console.log('✅ Gmail: Email sent:', info.messageId);
  } catch (error) {
    console.error('❌ Gmail: Error sending email:', error);
    throw error;
  }
}

async function sendVideoEmail(userEmail, videoUrl, filename) {
  const provider = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase();
  
  console.log('📧 EMAIL CONFIG:');
  console.log('  Provider:', provider);
  console.log('  BREVO_API_KEY:', process.env.BREVO_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('  RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('  GMAIL_USER:', process.env.GMAIL_USER || '❌ Missing');
  console.log('  GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✅ Set' : '❌ Missing');
  console.log('  EMAIL_FROM:', process.env.EMAIL_FROM || '❌ Missing');
  console.log('  Sending to:', userEmail);
  
  if (provider === 'gmail') {
    try {
      return await sendVideoEmailGmail(userEmail, videoUrl, filename);
    } catch (err) {
      console.error('Gmail send failed, attempting fallback provider:', err && err.message);
      // fallback to Resend if available
      if (resend) {
        try {
          return await sendVideoEmailResend(userEmail, videoUrl, filename);
        } catch (err2) {
          console.error('Fallback Resend also failed:', err2 && err2.message);
          throw err2;
        }
      }
      throw err;
    }
  }
  if (provider === 'resend') {
    return sendVideoEmailResend(userEmail, videoUrl, filename);
  }

  if (provider === 'brevo') {
    try {
      return await brevoService.sendVideoReadyEmail(userEmail, videoUrl, undefined);
    } catch (err) {
      console.error('Brevo send failed, attempting fallback to Resend:', err && err.message);
      if (resend) return await sendVideoEmailResend(userEmail, videoUrl, filename);
      throw err;
    }
  }

  // default fallback
  return sendVideoEmailResend(userEmail, videoUrl, filename);
}

module.exports = { sendVideoEmail, sendVideoEmailGmail, sendVideoEmailResend, buildVideoEmailHtml };

function logEmailConfig() {
  const provider = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase();
  console.log('📧 EMAIL CONFIG:');
  console.log('  Provider:', provider);
  console.log('  RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('  GMAIL_USER:', process.env.GMAIL_USER || '❌ Missing');
  console.log('  GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✅ Set' : '❌ Missing');
  console.log('  EMAIL_FROM:', process.env.EMAIL_FROM || '❌ Missing');
}

module.exports.logEmailConfig = logEmailConfig;
