const { S3RequestPresigner } = require('@aws-sdk/s3-request-presigner');
const { HttpRequest } = require('@smithy/protocol-http');
const { parseUrl } = require('@smithy/url-parser');
const { Hash } = require('@smithy/hash-node');

const { PutObjectCommand, GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { storageClient, bucket } = require('../config/storage');
const { sendVideoEmail } = require('../config/email');
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
    const { userId, userEmail } = req.body;

    if (!file) {
      return res.status(400).json({
        status: 400,
        error: 'No se recibiÃ³ ningÃºn archivo'
      });
    }

    if (!userId) {
      return res.status(400).json({
        status: 400,
        error: 'El userId es requerido'
      });
    }

    // âœ… SOLUCIÃ“N 2: Generar nombre simple sin caracteres especiales
    const timestamp = Date.now();
    const extension = file.originalname.split('.').pop().toLowerCase();
    const videoKey = `users/${userId}/videos/${timestamp}.${extension}`;

    console.log('ðŸ“¤ Subiendo video a Wasabi...');
    console.log(`   Key: ${videoKey}`);
    console.log(`   Nombre original: ${file.originalname}`);

    // Subir a storage (Wasabi) - sin problemas de encoding
    await storageClient.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: videoKey,  // âœ… Key simple sin caracteres especiales
        Body: file.buffer,
        ContentType: file.mimetype,
        // âœ… Metadatos simples sin caracteres especiales (Wasabi los incluye en la firma)
        Metadata: {
          userId: String(userId),
          uploadDate: new Date().toISOString(),
        },
      })
    );

    console.log('âœ… Video subido a Wasabi');

    // Generar URL temporal (24 horas)
    const videoUrl = await generateCleanWasabiUrl(bucket, videoKey, 3600);

    // âœ… URL generada sin x-amz-checksum-mode
    console.log('âœ… URL generada');
  console.log('âœ… URL generada Video Key:', videoKey);
    console.log(`   URL: ${videoUrl.substring(0, 100)}...`);

    // Guardar en base de datos
    console.log('ðŸ’¾ Guardando en base de datos...');
    const result = await pool.query(
      `INSERT INTO videos (user_id, video_key, filename, size, mime_type, url) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, videoKey, file.originalname, file.size, file.mimetype, videoUrl]  // âœ… URL directa
    );

    console.log('âœ… Video guardado en BD');

    // Enviar email
    if (userEmail) {
      console.log('ðŸ“§ Enviando email de notificaciÃ³n...' + userEmail);
      await sendVideoEmail(userEmail, videoUrl, file.originalname);
    }

    res.status(201).json({
      status: 201,
      success: true,
      message: 'Video subido exitosamente',
      data: {
        videoId: result.rows[0].id,
        filename: file.originalname,  // âœ… Nombre original para mostrar al usuario
        simpleFilename: `${timestamp}.${extension}`,  // Nombre simple en S3
        size: file.size,
        mime_type: file.mimetype,
        url: videoUrl,  // âœ… URL directa sin parÃ¡metros problemÃ¡ticos
        created_at: result.rows[0].created_at,
      },
    });

  } catch (error) {
    console.error('âŒ Error uploading video:', error.message);
    console.error('   Details:', error);
    res.status(500).json({
      status: 500,
      error: 'Error al subir el video',
      details: error.message
    });
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











