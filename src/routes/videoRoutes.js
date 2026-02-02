const express = require('express');
const upload = require('../middleware/upload');
const { uploadVideo, getVideoUrl, listVideos } = require('../controllers/videoController');

const router = express.Router();

/**
 * @swagger
 * /api/videos/upload:
 *   post:
 *     tags:
 *       - Videos
 *     summary: Subir un nuevo video
 *     description: Carga un archivo de video al almacenamiento S3-compatible y guarda los metadatos en la base de datos
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de video (máximo 500MB)
 *               userId:
 *                 type: string
 *                 description: ID del usuario
 *                 example: user123
 *               userEmail:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario para notificación
 *                 example: user@example.com
 *             required:
 *               - video
 *               - userId
 *     responses:
 *       201:
 *         description: Video subido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: No se recibió archivo o archivo inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error al subir el video
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/upload', upload.single('video'), uploadVideo);

/**
 * @swagger
 * /api/videos/{videoId}/url:
 *   get:
 *     tags:
 *       - Videos
 *     summary: Obtener URL temporal del video
 *     description: Genera una URL temporal con firma S3 válida por 1 hora para descargar el video
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del video
 *         example: 1
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario propietario del video
 *         example: user123
 *     responses:
 *       200:
 *         description: URL temporal obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VideoUrl'
 *       404:
 *         description: Video no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error al obtener el video
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:videoId/url', getVideoUrl);

/**
 * @swagger
 * /api/videos/list:
 *   get:
 *     tags:
 *       - Videos
 *     summary: Listar videos del usuario
 *     description: Obtiene todos los videos subidos por un usuario específico, ordenados por fecha de creación
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *         example: user123
 *     responses:
 *       200:
 *         description: Lista de videos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       filename:
 *                         type: string
 *                         example: video.mp4
 *                       size:
 *                         type: integer
 *                         example: 524288000
 *                       mime_type:
 *                         type: string
 *                         example: video/mp4
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-02-02T10:30:00Z
 *       500:
 *         description: Error al listar videos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/list', listVideos);

module.exports = router;
