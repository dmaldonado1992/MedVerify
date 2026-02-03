const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login (valida existencia de usuario)
 *     description: Acepta `email` y `password` pero solo verifica que el usuario exista en la base de datos.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *       400:
 *         description: Parámetros faltantes
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', login);

module.exports = router;
