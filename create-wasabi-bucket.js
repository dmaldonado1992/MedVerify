const { S3Client, CreateBucketCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

async function createWasabiBucket() {
  console.log('🪣 Creando bucket en Wasabi...\n');

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

    const bucketName = process.env.STORAGE_BUCKET;
    const region = process.env.STORAGE_REGION;

    console.log(`Creando bucket: ${bucketName}`);
    console.log(`Region: ${region}\n`);

    const createCommand = new CreateBucketCommand({
      Bucket: bucketName,
      CreateBucketConfiguration: {
        LocationConstraint: region,
      },
    });

    const response = await client.send(createCommand);
    
    console.log('✅ Bucket creado exitosamente');
    console.log(`\nDetalles:`);
    console.log(`   Nombre: ${bucketName}`);
    console.log(`   Region: ${region}`);
    console.log(`   Location: ${response.Location}`);
    console.log(`\n💡 Puedes acceder al bucket en: https://console.wasabisys.com/`);

  } catch (error) {
    if (error.code === 'BucketAlreadyExists' || error.code === 'BucketAlreadyOwnedByYou') {
      console.log('✅ El bucket ya existe');
    } else {
      console.error('❌ Error creando bucket:', error.message);
      console.error('\nDetalles del error:', error);
    }
  }
}

createWasabiBucket();
