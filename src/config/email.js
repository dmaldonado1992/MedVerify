const { Resend } = require('resend');
const nodemailer = require('nodemailer');
require('dotenv').config();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const brevoService = require('../services/emailService');

function buildVideoEmailHtml(filename, videoUrl) {
  return `
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
