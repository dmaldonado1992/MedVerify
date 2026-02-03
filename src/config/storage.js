const { S3Client } = require('@aws-sdk/client-s3');
const { removeChecksumMiddleware } = require('@aws-sdk/middleware-flexible-checksums');
require('dotenv').config();

// Validar que las variables requeridas estén configuradas
const requiredVars = ['STORAGE_ENDPOINT', 'STORAGE_REGION', 'STORAGE_ACCESS_KEY', 'STORAGE_SECRET_KEY', 'STORAGE_BUCKET'];
const missingVars = requiredVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingVars.join(', '));
  console.error('Por favor, configura estas variables en tu archivo .env');
  process.exit(1);
}

// Configuración de Wasabi (S3-compatible)
// CRÍTICO: Wasabi no soporta el parámetro x-amz-checksum-mode
// Necesitamos deshabilitar checksums completamente
const storageClient = new S3Client({
  region: process.env.STORAGE_REGION || 'us-east-1',
  endpoint: process.env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.STORAGE_SECRET_KEY,
  },
  // Configuración específica para Wasabi
  forcePathStyle: true,
  s3BucketEndpoint: false,
  // Deshabilitar checksums: AWS SDK v3 agrega x-amz-checksum-mode automaticamente
  // Esto lo evita completamente
  requestChecksumCalculation: 'when_required',
  serviceId: 's3',
});

// Remover TODAS las middleware relacionadas con checksums
try {
  storageClient.middlewareStack.remove('flexibleChecksumRequestHandler');
} catch (e) {
  // Ignorar si ya no existe
}

console.log('✅ Storage configurado con Wasabi');
console.log(`   Endpoint: ${process.env.STORAGE_ENDPOINT}`);
console.log(`   Region: ${process.env.STORAGE_REGION}`);
console.log(`   Bucket: ${process.env.STORAGE_BUCKET}`);

module.exports = { storageClient, bucket: process.env.STORAGE_BUCKET };
