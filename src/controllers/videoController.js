const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { storageClient, bucket } = require('../config/storage');
const { sendVideoEmail } = require('../config/email');
const pool = require('../config/database');
require('dotenv').config();

// Subir video
async function uploadVideo(req, res) {
  try {
    const file = req.file;
    const { userId, userEmail } = req.body;

    if (!file) {
      return res.status(400).json({
        status: 400,
        error: 'No se recibió ningún archivo'
      });
    }

    if (!userId) {
      return res.status(400).json({
        status: 400,
        error: 'El userId es requerido'
      });
    }

    // Generar key único
    const videoKey = `users/${userId}/videos/${Date.now()}_${file.originalname}`;

    console.log('📤 Subiendo video a Wasabi...');
    console.log(`   Key: ${videoKey}`);

    // Subir a storage (Wasabi)
    await storageClient.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: videoKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          userId,
          originalName: file.originalname,
          uploadDate: new Date().toISOString(),
        },
      })
    );

    console.log('✅ Video subido a Wasabi');

    // Generar URL temporal (24 horas) ANTES de guardar en BD
    console.log('🔗 Generando URL signed...');
    const videoUrl = await getSignedUrl(
      storageClient,
      new GetObjectCommand({ Bucket: bucket, Key: videoKey }),
      { expiresIn: 86400 }
    );

    // Normalizar URL para Wasabi
    const normalizedUrl = normalizeWasabiUrl(videoUrl);
    console.log('✅ URL generada y normalizada');

    // Guardar en base de datos con URL completa
    console.log('💾 Guardando en base de datos...');
    const result = await pool.query(
      `INSERT INTO videos (user_id, video_key, filename, size, mime_type, url) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, videoKey, file.originalname, file.size, file.mimetype, normalizedUrl]
    );

    console.log('✅ Video guardado en BD');

    // Enviar email
    if (userEmail) {
      console.log('📧 Enviando email de notificación...');
      await sendVideoEmail(userEmail, normalizedUrl, file.originalname);
    }

    res.status(201).json({
      status: 201,
      success: true,
      message: 'Video subido exitosamente',
      data: {
        videoId: result.rows[0].id,
        filename: file.originalname,
        size: file.size,
        mime_type: file.mimetype,
        url: normalizedUrl,
        created_at: result.rows[0].created_at,
      },
    });

  } catch (error) {
    console.error('❌ Error uploading video:', error.message);
    console.error('   Details:', error);
    res.status(500).json({
      status: 500,
      error: 'Error al subir el video',
      details: error.message
    });
  }
}

// Obtener URL de video
async function getVideoUrl(req, res) {
  try {
    const { videoId } = req.params;
    const { userId } = req.query;

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
    const videoUrl = await getSignedUrl(
      storageClient,
      new GetObjectCommand({ Bucket: bucket, Key: video.video_key }),
      { expiresIn: 3600 }
    );

    // Normalizar URL para Wasabi
    const normalizedUrl = normalizeWasabiUrl(videoUrl);

    res.status(200).json({
      status: 200,
      success: true,
      data: {
        url: normalizedUrl,
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
        error: 'El parámetro userId es requerido'
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

// ============================================
// FUNCIÓN AUXILIAR: Normalizar URL de Wasabi
// ============================================
function normalizeWasabiUrl(url) {
  /**
   * Convierte la URL generada por getSignedUrl a una URL correcta para Wasabi
   * El problema: getSignedUrl genera URLs con /bucket/key pero Wasabi usa /key
   */
  try {
    const urlObj = new URL(url);
    const endpoint = process.env.STORAGE_ENDPOINT;
    const bucket = process.env.STORAGE_BUCKET;
    
    let pathname = urlObj.pathname;
    
    // Si el path comienza con /bucket/, remover solo el /bucket parte
    const bucketPath = `/${bucket}`;
    if (pathname.startsWith(bucketPath)) {
      pathname = pathname.substring(bucketPath.length); // Solo remover /bucket, dejar el resto
    }
    
    // Reconstruir URL con el path correcto
    const normalizedUrl = `${endpoint}${pathname}${urlObj.search}`;
    
    return normalizedUrl;
  } catch (error) {
    console.error('Error normalizando URL:', error.message);
    return url; // Retornar URL original si hay error
  }
}

module.exports = { uploadVideo, getVideoUrl, listVideos };
