const pool = require('../config/database');

// POST /api/auth/login
// Valida email y password del usuario
async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ status: 400, error: 'email y password son requeridos' });
    }

    const result = await pool.query(
      'SELECT id, user_id, email, first_name, last_name, password FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ status: 401, error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    // Validar que el password coincida
    if (user.password !== password) {
      return res.status(401).json({ status: 401, error: 'Credenciales inválidas' });
    }

    // Password correcto, retornar datos del usuario (sin el password)
    const { password: _, ...userDataWithoutPassword } = user;
    return res.status(200).json({ status: 200, success: true, data: userDataWithoutPassword });
  } catch (error) {
    console.error('Error en /auth/login:', error && error.message);
    return res.status(500).json({ status: 500, error: 'Error interno', details: error.message });
  }
}

module.exports = { login };
