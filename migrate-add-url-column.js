const pool = require('./src/config/database');

async function addUrlColumnToVideos() {
  try {
    console.log('🔄 Agregando columna URL a tabla videos...\n');

    // Verificar si la columna ya existe
    const checkColumn = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'videos' AND column_name = 'url'`
    );

    if (checkColumn.rows.length > 0) {
      console.log('✅ La columna URL ya existe en la tabla videos');
      return;
    }

    // Agregar columna
    await pool.query(
      `ALTER TABLE videos ADD COLUMN url TEXT`
    );

    console.log('✅ Columna URL agregada exitosamente');

    // Verificar la estructura
    const columns = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns 
       WHERE table_name = 'videos' ORDER BY ordinal_position`
    );

    console.log('\n📊 Estructura actual de tabla videos:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addUrlColumnToVideos();
