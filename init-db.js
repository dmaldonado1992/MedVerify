const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de conexión a Neon
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_aOb4pP7MWoTh@ep-bold-snow-ahobrvb8-pooler.c-3.us-east-1.aws.neon.tech/MedVerify?sslmode=require&channel_binding=require'
});

async function initializeDatabase() {
  try {
    console.log('🔄 Conectando a Neon...');
    
    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, 'database.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Ejecutar el script SQL
    console.log('📋 Ejecutando script SQL...');
    await pool.query(sql);
    
    console.log('✅ Base de datos inicializada correctamente');
    console.log('');
    console.log('📊 Tablas creadas:');
    console.log('  ✓ users');
    console.log('  ✓ videos');
    console.log('  ✓ video_processing');
    console.log('  ✓ email_logs');
    console.log('  ✓ audit_logs');
    console.log('  ✓ api_keys');
    
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initializeDatabase();
