const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { storageClient, bucket } = require('../config/storage');
const { sendVideoEmail } = require('../config/email');
const pool = require('../config/database');

// Subir video
async function uploadVideo(req, res) {
  try {
    const file = req.file;
    const { userId, userEmail } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    // Generar key único
    const videoKey = `users/${userId}/videos/${Date.now()}_${file.originalname}`;

    // Subir a storage (Backblaze/Oracle)
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

    // Guardar en base de datos
    const result = await pool.query(
      `INSERT INTO videos (user_id, video_key, filename, size, mime_type) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, videoKey, file.originalname, file.size, file.mimetype]
    );

    // Generar URL temporal (24 horas)
    const videoUrl = await getSignedUrl(
      storageClient,
      new GetObjectCommand({ Bucket: bucket, Key: videoKey }),
      { expiresIn: 86400 }
    );

    // Enviar email
    if (userEmail) {
      await sendVideoEmail(userEmail, videoUrl, file.originalname);
    }

    res.status(201).json({
      success: true,
      message: 'Video subido exitosamente',
      data: {
        videoId: result.rows[0].id,
        filename: file.originalname,
        size: file.size,
        url: videoUrl,
      },
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Error al subir el video' });
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
      return res.status(404).json({ error: 'Video no encontrado' });
    }

    const video = result.rows[0];

    // Generar URL temporal (1 hora)
    const videoUrl = await getSignedUrl(
      storageClient,
      new GetObjectCommand({ Bucket: bucket, Key: video.video_key }),
      { expiresIn: 3600 }
    );

    res.json({
      success: true,
      data: {
        url: videoUrl,
        filename: video.filename,
        size: video.size,
      },
    });
  } catch (error) {
    console.error('Error getting video URL:', error);
    res.status(500).json({ error: 'Error al obtener el video' });
  }
}

// Listar videos del usuario
async function listVideos(req, res) {
  try {
    const { userId } = req.query;

    const result = await pool.query(
      'SELECT id, filename, size, mime_type, created_at FROM videos WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error listing videos:', error);
    res.status(500).json({ error: 'Error al listar videos' });
  }
}

module.exports = { uploadVideo, getVideoUrl, listVideos };
