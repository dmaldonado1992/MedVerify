const { S3Client, ListBucketsCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

async function testWasabiConnection() {
  console.log('🔍 Probando conexión a Wasabi...\n');

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

    // Test 1: Listar buckets
    console.log('Test 1: Listar buckets en Wasabi');
    const listCommand = new ListBucketsCommand({});
    const bucketsResponse = await client.send(listCommand);
    
    console.log(`✅ Autenticación exitosa`);
    console.log(`   Buckets encontrados: ${bucketsResponse.Buckets.length}`);
    bucketsResponse.Buckets.forEach(bucket => {
      console.log(`   - ${bucket.Name} (Creado: ${bucket.CreationDate})`);
    });

    // Test 2: Verificar que el bucket configurado existe
    console.log('\nTest 2: Verificar bucket configurado');
    const bucketName = process.env.STORAGE_BUCKET;
    
    if (!bucketsResponse.Buckets.find(b => b.Name === bucketName)) {
      console.warn(`⚠️  El bucket "${bucketName}" no existe`);
      console.log('\n💡 Para crear el bucket:');
      console.log('   1. Ve a https://console.wasabisys.com/');
      console.log('   2. Crea un nuevo bucket llamado: ' + bucketName);
      console.log('   3. Selecciona la región: ' + process.env.STORAGE_REGION);
    } else {
      console.log(`✅ Bucket "${bucketName}" existe`);
      
      // Test 3: Verificar acceso al bucket
      console.log('\nTest 3: Verificar acceso al bucket');
      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await client.send(headCommand);
      console.log(`✅ Acceso al bucket confirmado`);
    }

    console.log('\n✅ Conexión a Wasabi configurada correctamente');
    console.log('\nDetalles de la configuración:');
    console.log(`   Endpoint: ${process.env.STORAGE_ENDPOINT}`);
    console.log(`   Region: ${process.env.STORAGE_REGION}`);
    console.log(`   Bucket: ${process.env.STORAGE_BUCKET}`);
    console.log(`   Access Key: ${process.env.STORAGE_ACCESS_KEY.substring(0, 5)}...`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'InvalidAccessKeyId' || error.code === 'SignatureDoesNotMatch') {
      console.error('\n💡 Error de autenticación. Verifica:');
      console.error('   - STORAGE_ACCESS_KEY es correcto');
      console.error('   - STORAGE_SECRET_KEY es correcto');
    } else if (error.code === 'NoSuchBucket') {
      console.error('\n💡 El bucket no existe. Crea uno en https://console.wasabisys.com/');
    }
    
    console.error('\nConfigración actual:');
    console.error('   Endpoint:', process.env.STORAGE_ENDPOINT);
    console.error('   Region:', process.env.STORAGE_REGION);
    console.error('   Bucket:', process.env.STORAGE_BUCKET);
    console.error('   Access Key:', process.env.STORAGE_ACCESS_KEY);
  }
}

testWasabiConnection();
