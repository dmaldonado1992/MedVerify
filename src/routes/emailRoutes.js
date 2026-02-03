const express = require('express');
const router = express.Router();
const { sendVideoReadyEmail } = require('../services/emailService');

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

// POST /api/emails/video-processed - enviar email cuando video listo
router.post('/video-processed', async (req, res) => {
  try {
    const { userEmail, videoUrl, userName } = req.body;
    if (!userEmail || !videoUrl) return res.status(400).json({ error: 'userEmail and videoUrl required' });
    const result = await sendVideoReadyEmail(userEmail, videoUrl, userName);
    res.json({ success: true, result });
  } catch (err) {
    console.error('Error /video-processed:', err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

module.exports = router;
