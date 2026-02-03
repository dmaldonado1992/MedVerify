const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
require('dotenv').config();

async function testVideoUpload() {
  console.log('🎥 Probando carga de video...\n');

  try {
    // Crear un archivo de prueba pequeño
    const testVideoPath = path.join(__dirname, 'test-video.mp4');
    const testContent = Buffer.from('Mock video content for testing');
    fs.writeFileSync(testVideoPath, testContent);

    console.log('✅ Archivo de prueba creado: test-video.mp4 (29 bytes)');

    // Preparar FormData
    const form = new FormData();
    form.append('video', fs.createReadStream(testVideoPath), 'test-video.mp4');
    form.append('userId', 'test_user_' + Date.now());
    form.append('userEmail', 'test@example.com');

    console.log('\n📤 Enviando video al servidor...');
    console.log('   URL: http://localhost:3000/api/videos/upload');

    const response = await axios.post(
      'http://localhost:3000/api/videos/upload',
      form,
      {
        headers: form.getHeaders(),
        timeout: 30000
      }
    );

    console.log('\n✅ Respuesta recibida:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.data.url) {
      console.log('\n✅ URL generada y guardada correctamente:');
      console.log(response.data.data.url.substring(0, 100) + '...');
    } else {
      console.log('\n❌ La URL no fue retornada');
    }

    // Limpiar archivo de prueba
    fs.unlinkSync(testVideoPath);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.data);
    }
  }
}

// Esperar a que el servidor esté listo
console.log('💡 Asegúrate de que el servidor esté corriendo: npm start\n');
setTimeout(testVideoUpload, 2000);
