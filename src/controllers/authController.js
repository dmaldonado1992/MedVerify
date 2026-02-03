const pool = require('../config/database');

// POST /api/auth/login
// Valida que exista un usuario con el email proporcionado.
async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ status: 400, error: 'email y password son requeridos' });
    }

    const result = await pool.query(
      'SELECT id, user_id, email, first_name, last_name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ status: 401, error: 'Credenciales inválidas' });
    }

    // Solo validamos existencia; no comprobamos contraseña aquí
    const user = result.rows[0];
    return res.status(200).json({ status: 200, success: true, data: user });
  } catch (error) {
    console.error('Error en /auth/login:', error && error.message);
    return res.status(500).json({ status: 500, error: 'Error interno', details: error.message });
  }
}

module.exports = { login };
