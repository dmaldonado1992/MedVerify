const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const emailService = require('../services/emailService');
const { sendVideoReadyEmail } = emailService;
const { buildVideoEmailHtml, sendVideoEmail } = require('../config/email');

/**
 * @swagger
 * /api/emails/brevo-send:
 *   post:
 *     tags:
 *       - Emails
 *     summary: Enviar email vía Brevo
 *     description: Envía un email transaccional usando Brevo (requiere `BREVO_API_KEY`).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *               subject:
 *                 type: string
 *               html:
 *                 type: string
 *             required:
 *               - to
 *               - subject
 *               - html
 *     responses:
 *       200:
 *         description: Email enviado correctamente
 *       400:
 *         description: Parámetros faltantes
 *       500:
 *         description: Error al enviar email
 */
// POST /api/emails/brevo-send - enviar email sencillo
router.post('/brevo-send', async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    if (!to || !subject || !html) return res.status(400).json({ error: 'to, subject and html required' });
    const result = await require('../services/emailService').sendEmail(to, subject, html);
    res.json({ success: true, result });
  } catch (err) {
    console.error('Error /brevo-send:', err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

/**
 * @swagger
 * /api/emails/video-processed:
 *   post:
 *     tags:
 *       - Emails
 *     summary: Notificar que un video está listo
 *     description: Envía un email al usuario indicando que su video ha sido procesado y está disponible.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userEmail:
 *                 type: string
 *                 format: email
 *               videoUrl:
 *                 type: string
 *               userName:
 *                 type: string
 *             required:
 *               - userEmail
 *               - videoUrl
 *     responses:
 *       200:
 *         description: Email de notificación enviado
 *       400:
 *         description: Parámetros faltantes
 *       500:
 *         description: Error al enviar email
 */
// POST /api/emails/video-processed - enviar email cuando video listo
router.post('/video-processed', async (req, res) => {
    try {
      const { userEmail, videoUrl, userName } = req.body;
      if (!userEmail || !videoUrl) return res.status(400).json({ error: 'userEmail and videoUrl required' });
      let result = null;   

      if (userEmail) {
        let userPassword = null;
      try {
        const userResult = await pool.query(
          'SELECT password FROM users WHERE email = $1',
          [userEmail]
        );
        if (userResult.rows.length > 0) {
          userPassword = userResult.rows[0].password;
          console.log('✅ Password obtenido del usuario');
        }
      } catch (err) {
        console.error('Error obteniendo password del usuario:', err.message);
      }

      const provider = (process.env.EMAIL_PROVIDER || '').toLowerCase();
      console.log('✉️ Enviando email de notificación...', userEmail, 'via', provider || 'default');
      try {
        if (provider === 'gmail') {
          result = await emailService.sendVideoReadyEmail(userEmail, videoUrl, userName || 'Estudio', emailService.sendEmailGmail);
          console.log('Gmail send result:', result && (result.messageId || result));
        } else if (provider === 'brevo') {
          const subject = 'Tu video está listo';
          const html = buildVideoEmailHtml(userName || 'Estudio', videoUrl, userPassword, userEmail);
          result = await emailService.sendEmail(userEmail, subject, html);
          console.log('Brevo send result:', result && result.messageId ? result.messageId : result);
        } else {
          result = await sendVideoEmail(userEmail, videoUrl, userName || 'Estudio');
          console.log('Default send result:', result && (result.messageId || result));
        }
      } catch (err) {
        console.error('Error sending notification email routes:', err && err.message);
      }
    }

    res.json({ success: true, result });
  } catch (err) {
    console.error('Error /video-processed:', err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

/**
 * @swagger
 * /api/emails/gmail-send:
 *   post:
 *     tags:
 *       - Emails
 *     summary: Enviar notificación de video vía Gmail
 *     description: Reutiliza la plantilla de notificación de video pero envía el correo usando Gmail (requiere credenciales GMAIL_USER y GMAIL_APP_PASSWORD).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userEmail:
 *                 type: string
 *                 format: email
 *               videoUrl:
 *                 type: string
 *               userName:
 *                 type: string
 *             required:
 *               - userEmail
 *               - videoUrl
 *     responses:
 *       200:
 *         description: Email enviado correctamente vía Gmail
 *       400:
 *         description: Parámetros faltantes
 *       500:
 *         description: Error al enviar email
 */
router.post('/gmail-send', async (req, res) => {
  try {
    const { userEmail, videoUrl, userName } = req.body;
    if (!userEmail || !videoUrl) return res.status(400).json({ error: 'userEmail and videoUrl required' });
    const result = await emailService.sendVideoReadyEmail(userEmail, videoUrl, userName, emailService.sendEmailGmail);
    res.json({ success: true, result });
  } catch (err) {
    console.error('Error /gmail-send:', err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

module.exports = router;
