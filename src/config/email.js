const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const { emailStyles } = require('./emailStyles');
require('dotenv').config();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const brevoService = require('../services/emailService');

function buildVideoEmailHtml(filename, videoUrl, password, userEmail) {
  const urlApplicacion = process.env.urlApplicacion || 'https://medverifyfront.onrender.com/login';
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MedVerify - Su estudio está listo</title>
      <style>
        ${emailStyles}
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <!-- HEADER -->
          <div class="header">
            <div class="header-logo">MedVerify</div>
            <div class="header-subtitle">Sistema de Gestión de Estudios Médicos</div>
          </div>
          
          <!-- BODY -->
          <div class="body-content">
            <div class="greeting">Estimado usuario,</div>
            
            <div class="notification-box">
              <p>El estudio médico <strong>"${filename}"</strong> ha sido procesado correctamente y está disponible para su revisión en la plataforma MedVerify.</p>
            </div>
            
            <!-- CREDENTIALS -->
            <div style="background: #f5f5f5; border-radius: 12px; padding: 40px 30px; margin: 35px 0; text-align: center;">
              <div style="font-size: 14px; font-weight: 600; color: #555; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1.2px;">Credenciales de Acceso</div>
              
              <div style="margin-bottom: 30px;">
                <div style="font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;">📧 Correo Electrónico</div>
                <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; font-family: 'Courier New', monospace; font-size: 16px; font-weight: 600; color: #333; word-break: break-all; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">${userEmail || 'Su correo electrónico'}</div>
              </div>
              
              ${password ? `
              <div style="margin-bottom: 0;">
                <div style="font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;">🔐 Contraseña</div>
                <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; font-family: 'Courier New', monospace; font-size: 28px; font-weight: 700; color: #333; word-break: break-all; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); letter-spacing: 2px;">${password}</div>
              </div>
              ` : ''}
            </div>
            
            <!-- CTA BUTTON -->
            <a href="${urlApplicacion}" class="cta-button">Acceder a MedVerify</a>
            
            <!-- STEPS -->
            <div class="steps">
              <div class="steps-title">Cómo acceder a su estudio:</div>
              <ol>
                <li>Haga clic en el botón "Acceder a MedVerify" arriba</li>
                <li>Ingrese el correo electrónico mostrado en las credenciales</li>
                <li>Ingrese la contraseña proporcionada</li>
                <li>Acceda a sus estudios y revíselos cuando lo requiera</li>
              </ol>
            </div>
            
            <!-- SECURITY ALERT -->
            <div class="security-alert">
              <div class="security-alert-title">⚠️ Aviso de Seguridad</div>
              <p>Este correo contiene información confidencial. No lo comparta con terceros. El acceso a MedVerify está restringido únicamente a personal autorizado. Sus credenciales son de uso personal e intransferible.</p>
            </div>
            
            <p style="font-size: 13px; color: #7f8c8d; margin-top: 25px; margin-bottom: 0;">Si usted no solicitó este acceso o tiene preguntas adicionales, por favor comuníquese con el equipo de soporte técnico de su institución.</p>
          </div>
          
          <!-- FOOTER -->
          <div class="footer">
            <p class="footer-text">
              <span class="footer-brand">© MedVerify</span> - Sistema de Gestión de Estudios Médicos
            </p>
            <p class="footer-text" style="margin-top: 10px;">
              Este es un correo automático del sistema. Por favor, no responda a este mensaje.
            </p>
          </div>
        </div>
      </div>
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
      subject: `Med Verify - El estudio "${filename}" está listo para revisar`,
      html: buildVideoEmailHtml(filename, videoUrl, null, userEmail),
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
      subject: `Med Verify - El estudio "${filename}" está listo para revisar`,
      html: buildVideoEmailHtml(filename, videoUrl, null, userEmail),
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
