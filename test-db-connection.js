const pool = require('./src/config/database');

async function testConnection() {
  console.log('🔍 Probando conexión a la base de datos...\n');

  try {
    // Test 1: Conexión básica
    console.log('Test 1: Conexión básica');
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa');
    console.log('   Hora del servidor:', result.rows[0].now);

    // Test 2: Verificar tablas
    console.log('\nTest 2: Verificar tablas existentes');
    const tables = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    
    console.log(`✅ Se encontraron ${tables.rows.length} tablas:`);
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Test 3: Verificar estructura de tabla users
    console.log('\nTest 3: Verificar estructura de tabla "users"');
    const columns = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`
    );

    if (columns.rows.length === 0) {
      console.log('⚠️  La tabla "users" no existe');
    } else {
      console.log('✅ Tabla "users" existe con estas columnas:');
      columns.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }

    // Test 4: Probar inserción de usuario de prueba
    console.log('\nTest 4: Intentar crear usuario de prueba');
    const testUser = await pool.query(
      `INSERT INTO users (user_id, email, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      ['test_' + Date.now(), 'test_' + Date.now() + '@example.com', 'Test', 'User']
    );
    console.log('✅ Usuario de prueba creado:');
    console.log(testUser.rows[0]);

    console.log('\n✅ Todos los tests pasaron correctamente');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nDetalles del error:');
    console.error(error);

    if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Parece que no puedes conectar al servidor. Verifica:');
      console.error('   - La URL del host es correcta');
      console.error('   - Tienes conexión a internet');
      console.error('   - El firewall no está bloqueando la conexión');
    } else if (error.code === '28P01') {
      console.error('\n💡 Error de autenticación. Verifica:');
      console.error('   - El usuario es correcto');
      console.error('   - La contraseña es correcta');
    } else if (error.code === '3D000') {
      console.error('\n💡 La base de datos no existe. Verifica:');
      console.error('   - El nombre de la base de datos es correcto');
    }
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testConnection();
