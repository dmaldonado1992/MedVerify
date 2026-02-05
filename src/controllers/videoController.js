const { S3RequestPresigner } = require('@aws-sdk/s3-request-presigner');
const { HttpRequest } = require('@smithy/protocol-http');
const { parseUrl } = require('@smithy/url-parser');
const { Hash } = require('@smithy/hash-node');

const { PutObjectCommand, GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { storageClient, bucket } = require('../config/storage');
const { sendVideoEmail, buildVideoEmailHtml } = require('../config/email');
const emailService = require('../services/emailService');
const pool = require('../config/database');
require('dotenv').config();

// Usar el mismo cliente para presigning que para uploads
// Esto asegura que la firma se calcula de la misma forma en ambos casos
const presignClient = storageClient;

const s3Client = new S3Client({
  endpoint: "https://s3.wasabisys.com",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY,
    secretAccessKey: process.env.WASABI_SECRET_KEY
  },
  forcePathStyle: false
});

/**
 * Genera una URL prefirmada nativa de Wasabi
 * @param {string} bucket - Nombre del bucket
 * @param {string} key - Ruta del objeto en el bucket
 * @param {number} expiresIn - Tiempo de expiración en segundos (default: 3600)
 * @returns {Promise<string>} URL prefirmada
 */
async function generateNativeWasabiUrl(bucket, key, expiresIn = 10) {
  try {
    const presigner = new S3RequestPresigner({
      credentials: await s3Client.config.credentials(),
      region: await s3Client.config.region(),
      sha256: Hash.bind(null, "sha256")
    });

    const endpoint = await s3Client.config.endpoint();
    const baseUrl = `${endpoint.protocol}//${bucket}.${endpoint.hostname}/${key}`;
    const url = parseUrl(baseUrl);

    const request = new HttpRequest({
      ...url,
      method: "GET",
      headers: {
        host: `${bucket}.${endpoint.hostname}`
      }
    });

    const signedRequest = await presigner.presign(request, {
      expiresIn
    });

    return formatUrl(signedRequest);
  } catch (error) {
    console.error('Error generating native Wasabi URL:', error.message);
    throw error;
  }
}

/**
 * Convierte un HttpRequest a URL string
 */
function formatUrl(request) {
  const { protocol, hostname, port, path, query } = request;
  let url = `${protocol}//${hostname}`;
  if (port) url += `:${port}`;
  url += path || '';
  if (query) {
    const queryString = Object.entries(query)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    if (queryString) url += `?${queryString}`;
  }
  return url;
}

async function generateCleanWasabiUrl(bucket, key, expiresIn = 3600) {
  try {
    // Use the SDK v3 presigner to generate a simple GetObject signed URL
    const url = await getSignedUrl(
      storageClient,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn }
    );
    return url;
  } catch (error) {
    console.error('Error generating URL:', error.message);
    throw error;
  }
}

function pickPresignMode(mode) {
  if (mode === 'native') return 'native';
  if (mode === 'clean') return 'clean';
  return 'clean';
}

async function generatePreviewUrl(bucket, key, expiresIn, mode) {
  const selected = pickPresignMode(mode);
  if (selected === 'native') {
    return generateNativeWasabiUrl(bucket, key, expiresIn);
  }
  return generateCleanWasabiUrl(bucket, key, expiresIn);
}


// Subir video
async function uploadVideo(req, res) {
  try {
    const file = req.file;
    const { userId, userEmail, userName } = req.body;

    if (!file) {
      return res.status(400).json({ status: 400, error: 'No se recibió ningún archivo' });
    }

    if (!userId) {
      return res.status(400).json({ status: 400, error: 'El userId es requerido' });
    }

    const timestamp = Date.now();
    const extension = file.originalname.split('.').pop().toLowerCase();
    const videoKey = `users/${userId}/videos/${timestamp}.${extension}`;

    console.log('📤 Subiendo video a Wasabi...');
    console.log(`   Key: ${videoKey}`);
    console.log(`   Nombre original: ${file.originalname}`);

    await storageClient.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: videoKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: { userEmail: userEmail, uploadDate: new Date().toISOString() },
      })
    );

    console.log('✅ Video subido a Wasabi');

    const videoUrl = await generateCleanWasabiUrl(bucket, videoKey, 172800);
    console.log('✅ URL generada Video Key:', videoKey);
    console.log(`   URL: ${videoUrl.substring(0, 100)}...`);

    console.log('💾 Guardando en base de datos...');
    const result = await pool.query(
      `INSERT INTO videos (user_id, video_key, filename, size, mime_type, url) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, videoKey, file.originalname, file.size, file.mimetype, videoUrl]
    );

    console.log('✅ Video guardado en BD');

    // Obtener password del usuario
    let userPassword = null;
    try {
      const userResult = await pool.query(
        'SELECT password FROM users WHERE user_id = $1',
        [userId]
      );
      if (userResult.rows.length > 0) {
        userPassword = userResult.rows[0].password;
        console.log('✅ Password obtenido del usuario');
      }
    } catch (err) {
      console.error('Error obteniendo password del usuario:', err.message);
    }

    // Enviar email según EMAIL_PROVIDER (gmail | brevo | fallback)
    if (userEmail) {
      const provider = (process.env.EMAIL_PROVIDER || '').toLowerCase();
      console.log('✉️ Enviando email de notificación...', userEmail, 'via', provider || 'default');
      try {
        if (provider === 'gmail') {
          const mailResult = await emailService.sendVideoReadyEmail(userEmail, videoUrl, userName || file.originalname, emailService.sendEmailGmail);
          console.log('Gmail send result:', mailResult && (mailResult.messageId || mailResult));
        } else if (provider === 'brevo') {
          const subject = 'Tu video está listo';
          const html = buildVideoEmailHtml(file.originalname, videoUrl, userPassword, userEmail);
          const mailResult = await emailService.sendEmail(userEmail, subject, html);
          console.log('Brevo send result:', mailResult && mailResult.messageId ? mailResult.messageId : mailResult);
        } else {
          await sendVideoEmail(userEmail, videoUrl, file.originalname);
        }
      } catch (err) {
        console.error('Error sending notification email:', err && err.message);
      }
    }

    res.status(201).json({
      status: 201,
      success: true,
      message: 'Video subido exitosamente',
      data: {
        videoId: result.rows[0].id,
        filename: file.originalname,
        simpleFilename: `${timestamp}.${extension}`,
        size: file.size,
        mime_type: file.mimetype,
        url: videoUrl,
        created_at: result.rows[0].created_at,
      },
    });
  } catch (error) {
    console.error('❌ Error uploading video:', error && error.message);
    console.error('   Details:', error);
    res.status(500).json({ status: 500, error: 'Error al subir el video', details: error.message });
  }
}

// Removed preview/stream/info/player handlers per request
// FunciÃ³n auxiliar para formatear bytes a KB, MB, GB, etc.
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
// Removed `videoPlayer` (player UI endpoint) per user request

// Obtener URL de video
async function getVideoUrl(req, res) {
  try {
    const { videoId } = req.params;
    const { userId, presign } = req.query;

    // Verificar que el video pertenece al usuario
    const result = await pool.query(
      'SELECT * FROM videos WHERE id = $1 AND user_id = $2',
      [videoId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        error: 'Video no encontrado'
      });
    }

    const video = result.rows[0];

    // Generar URL temporal (1 hora)
    const videoUrl = await generatePreviewUrl(
      bucket,
      video.video_key,
      3600,
      presign || process.env.WASABI_PRESIGN_MODE
    );

    // âœ… URL generada sin x-amz-checksum-mode

    res.status(200).json({
      status: 200,
      success: true,
      data: {
        url: videoUrl,
        filename: video.filename,
        size: video.size,
      },
    });
  } catch (error) {
    console.error('Error getting video URL:', error.message);
    res.status(500).json({
      status: 500,
      error: 'Error al obtener el video',
      details: error.message
    });
  }
}

// Listar videos del usuario
async function listVideos(req, res) {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        status: 400,
        error: 'El parÃ¡metro userId es requerido'
      });
    }

    const result = await pool.query(
      'SELECT id, filename, size, mime_type, url, status, created_at FROM videos WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.status(200).json({
      status: 200,
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error listing videos:', error.message);
    res.status(500).json({
      status: 500,
      error: 'Error al listar videos',
      details: error.message
    });
  }
}

// Endpoint de prueba para enviar correos
async function testSendEmail(req, res) {
  try {
    const { email, url, filename, provider } = req.body || {};

    if (!email || !url || !filename) {
      return res.status(400).json({ status: 400, error: 'email, url y filename son requeridos' });
    }

    // Permitir override temporal del proveedor para pruebas
    const previousProvider = process.env.EMAIL_PROVIDER;
    if (provider) process.env.EMAIL_PROVIDER = provider;

    await sendVideoEmail(email, url, filename);

    // Restaurar provider previo
    if (provider) process.env.EMAIL_PROVIDER = previousProvider;

    res.status(200).json({ status: 200, success: true, message: 'Email enviado (prueba)' });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ status: 500, error: 'Error enviando email de prueba', details: error.message });
  }
}

module.exports = { uploadVideo, getVideoUrl, listVideos, testSendEmail };











