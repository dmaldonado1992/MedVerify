const { Pool } = require('pg');
require('dotenv').config();

// Usar connectionString si está disponible (para Neon), sino construir desde variables
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    }
  : {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      // Neon requiere SSL - siempre habilitar ssl
      ssl: {
        rejectUnauthorized: false
      }
    };

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:');
  console.error(err);
  console.error('Error details:', {
    message: err && err.message,
    code: err && err.code,
    stack: err && err.stack
  });
});

// Test de conexión al iniciar
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Database connection test failed:');
    console.error(err);
    console.error('Error details:', {
      message: err && err.message,
      code: err && err.code,
      stack: err && err.stack
    });
    console.error('Connection details:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER
    });
    console.error('Suggestions: - Verify DB host/port/user/password; - Ensure network access (firewall, VPC rules); - For Neon, ensure SSL settings are correct');
  } else {
    console.log('✅ Database connection test passed');
  }
});

module.exports = pool;
