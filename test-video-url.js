const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

// Función para normalizar URLs
function normalizeWasabiUrl(url) {
  try {
    const urlObj = new URL(url);
    const endpoint = process.env.STORAGE_ENDPOINT;
    const bucket = process.env.STORAGE_BUCKET;
    
    let pathname = urlObj.pathname;
    
    // Si el path comienza con /bucket/, remover solo el /bucket parte
    const bucketPath = `/${bucket}`;
    if (pathname.startsWith(bucketPath)) {
      pathname = pathname.substring(bucketPath.length); // Solo remover /bucket, dejar el resto
    }
    
    // Reconstruir URL con el path correcto
    const normalizedUrl = `${endpoint}${pathname}${urlObj.search}`;
    return normalizedUrl;
  } catch (error) {
    console.error('Error normalizando URL:', error.message);
    return url;
  }
}

async function testVideoUrl() {
  console.log('🔍 Probando generación de URL de video con Wasabi...\n');

  try {
    const client = new S3Client({
      region: process.env.STORAGE_REGION,
      endpoint: process.env.STORAGE_ENDPOINT,
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY,
        secretAccessKey: process.env.STORAGE_SECRET_KEY,
      },
      forcePathStyle: true,
    });

    // Simular una clave de video
    const testVideoKey = `users/test_user/videos/${Date.now()}_test-video.mp4`;
    
    console.log('Test 1: Generar URL signed');
    console.log(`   Key: ${testVideoKey}`);
    console.log(`   Bucket: ${process.env.STORAGE_BUCKET}\n`);

    const command = new GetObjectCommand({
      Bucket: process.env.STORAGE_BUCKET,
      Key: testVideoKey
    });

    const signedUrl = await getSignedUrl(client, command, { expiresIn: 86400 });
    
    console.log('✅ URL SIN normalizar (INCORRECTA):');
    console.log(`   ${signedUrl.substring(0, 120)}...\n`);

    // Normalizar URL
    const normalizedUrl = normalizeWasabiUrl(signedUrl);
    
    console.log('✅ URL NORMALIZADA (CORRECTA):');
    console.log(`   ${normalizedUrl.substring(0, 120)}...\n`);

    console.log('📊 Comparación:');
    const urlObj = new URL(signedUrl);
    const normalizedUrlObj = new URL(normalizedUrl);
    
    console.log('   Path sin normalizar: ' + urlObj.pathname);
    console.log('   Path normalizado:    ' + normalizedUrlObj.pathname);
    
    console.log('\n✅ Las URLs se normalizarán automáticamente en uploadVideo()');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testVideoUrl();
