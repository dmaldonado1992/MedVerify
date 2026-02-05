const pool = require('../config/database');

// ============================================
// GENERAR PASSWORD RANDOM (6 dígitos numéricos)
// ============================================
function generateRandomPassword() {
  let password = '';
  for (let i = 0; i < 6; i++) {
    password += Math.floor(Math.random() * 10).toString();
  }
  return password;
}

// ============================================
// CREAR USUARIO
// ============================================
async function createUser(req, res) {
  try {
    const { user_id, email, first_name, last_name } = req.body;

    // Validar campos requeridos
    if (!user_id || !email) {
      return res.status(400).json({
        status: 400,
        error: 'Los campos user_id y email son requeridos'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 400,
        error: 'Formato de email inválido'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR user_id = $2',
      [email, user_id]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        status: 409,
        error: 'El usuario ya existe con ese email o user_id'
      });
    }

    // Generar password random de 6 dígitos
    const password = generateRandomPassword();

    // Crear usuario
    const result = await pool.query(
      `INSERT INTO users (user_id, email, first_name, last_name, password)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, email, first_name, last_name, password, created_at`,
      [user_id, email, first_name || null, last_name || null, password]
    );

    const user = result.rows[0];

    res.status(201).json({
      status: 201,
      success: true,
      message: 'Usuario creado exitosamente',
      data: user
    });

  } catch (error) {
    console.error('Error creando usuario:', error.message);
    console.error('Error details:', error);
    res.status(500).json({
      status: 500,
      error: 'Error al crear el usuario',
      details: error.message
    });
  }
}

// ============================================
// OBTENER USUARIO POR ID
// ============================================
async function getUserById(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        status: 400,
        error: 'El parámetro userId es requerido'
      });
    }

    const result = await pool.query(
      `SELECT id, user_id, email, first_name, last_name, created_at, updated_at
       FROM users WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        error: 'Usuario no encontrado'
      });
    }

    const user = result.rows[0];

    res.status(200).json({
      status: 200,
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Error obteniendo usuario:', error.message);
    res.status(500).json({
      status: 500,
      error: 'Error al obtener el usuario',
      details: error.message
    });
  }
}

// ============================================
// OBTENER USUARIO POR EMAIL
// ============================================
async function getUserByEmail(req, res) {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        status: 400,
        error: 'El parámetro email es requerido'
      });
    }

    const result = await pool.query(
      `SELECT id, user_id, email, first_name, last_name, created_at, updated_at
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        error: 'Usuario no encontrado'
      });
    }

    const user = result.rows[0];

    res.status(200).json({
      status: 200,
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Error obteniendo usuario por email:', error.message);
    res.status(500).json({
      status: 500,
      error: 'Error al obtener el usuario',
      details: error.message
    });
  }
}

// ============================================
// LISTAR TODOS LOS USUARIOS
// ============================================
async function getAllUsers(req, res) {
  try {
    const { limit = 10, offset = 0 } = req.query;

    // Validar parámetros
    const limitNum = Math.min(parseInt(limit) || 10, 100);
    const offsetNum = Math.max(parseInt(offset) || 0, 0);

    // Obtener total de usuarios
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(countResult.rows[0].count);

    // Obtener usuarios
    const result = await pool.query(
      `SELECT id, user_id, email, first_name, last_name, created_at, updated_at
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limitNum, offsetNum]
    );

    res.status(200).json({
      status: 200,
      success: true,
      data: result.rows,
      pagination: {
        total: totalUsers,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < totalUsers
      }
    });

  } catch (error) {
    console.error('Error listando usuarios:', error.message);
    res.status(500).json({
      status: 500,
      error: 'Error al listar usuarios',
      details: error.message
    });
  }
}

// ============================================
// ACTUALIZAR USUARIO
// ============================================
async function updateUser(req, res) {
  try {
    const { userId } = req.params;
    const { email, first_name, last_name } = req.body;

    if (!userId) {
      return res.status(400).json({
        status: 400,
        error: 'El parámetro userId es requerido'
      });
    }

    // Verificar que el usuario existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE user_id = $1',
      [userId]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        error: 'Usuario no encontrado'
      });
    }

    // Validar email si se proporciona
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: 400,
          error: 'Formato de email inválido'
        });
      }

      // Verificar que el email no esté usado por otro usuario
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND user_id != $2',
        [email, userId]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(409).json({
          status: 409,
          error: 'El email ya está registrado para otro usuario'
        });
      }
    }

    // Construir query dinámico
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (email !== undefined) {
      updateFields.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (first_name !== undefined) {
      updateFields.push(`first_name = $${paramCount++}`);
      values.push(first_name);
    }

    if (last_name !== undefined) {
      updateFields.push(`last_name = $${paramCount++}`);
      values.push(last_name);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        status: 400,
        error: 'No hay campos para actualizar'
      });
    }

    // Agregar user_id al final
    values.push(userId);

    // Ejecutar actualización
    const result = await pool.query(
      `UPDATE users 
       SET ${updateFields.join(', ')}
       WHERE user_id = $${paramCount}
       RETURNING id, user_id, email, first_name, last_name, password, created_at, updated_at`,
      values
    );

    const user = result.rows[0];

    res.status(200).json({
      status: 200,
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: user
    });

  } catch (error) {
    console.error('Error actualizando usuario:', error.message);
    res.status(500).json({
      status: 500,
      error: 'Error al actualizar el usuario',
      details: error.message
    });
  }
}

// ============================================
// ELIMINAR USUARIO
// ============================================
async function deleteUser(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        status: 400,
        error: 'El parámetro userId es requerido'
      });
    }

    // Verificar que el usuario existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE user_id = $1',
      [userId]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        error: 'Usuario no encontrado'
      });
    }

    // Eliminar usuario (los videos se eliminarán en cascada)
    await pool.query(
      'DELETE FROM users WHERE user_id = $1',
      [userId]
    );

    res.status(200).json({
      status: 200,
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando usuario:', error.message);
    res.status(500).json({
      status: 500,
      error: 'Error al eliminar el usuario',
      details: error.message
    });
  }
}

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  getAllUsers,
  updateUser,
  deleteUser
};
