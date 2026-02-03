const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const videoRoutes = require('./routes/videoRoutes');
const userRoutes = require('./routes/userRoutes');
const emailRoutes = require('./routes/emailRoutes');
const swaggerSpec = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// CORS: permitir orígenes configurables mediante FRONTEND_URL
// FRONTEND_URL puede ser una lista separada por comas (ej: https://app.example.com,https://admin.example.com)
// Construir lista de orígenes permitidos a partir de FRONTEND_URL y valores por defecto
const envOrigins = (process.env.FRONTEND_URL || '').split(',').map(s => s.trim()).filter(Boolean);
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'https://video-backend-y013.onrender.com'
];
const allowedOrigins = Array.from(new Set([...envOrigins, ...defaultOrigins]));
const corsOptions = {
  origin: function(origin, callback) {
    // permitir solicitudes sin origin (herramientas como curl, servidores)
    // y aceptar origin === 'null' (caso de file:// o algunos contextos de Swagger local)
    if (!origin || origin === 'null') return callback(null, true);
    // si no hay orígenes configurados permitir cualquiera
    if (allowedOrigins.length === 0 || allowedOrigins.includes('*')) return callback(null, true);
    // coincidencia directa con la lista permitida
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // permitir el origen que coincida con el host:port del servidor (ej: Swagger servido desde el mismo servidor)
    try {
      const u = new URL(origin);
      const originHost = `${u.hostname}${u.port ? ':' + u.port : ''}`;
      const serverHost = `${process.env.SERVER_HOST || 'localhost'}:${PORT}`;
      if (originHost === serverHost) return callback(null, true);
    } catch (e) {
      // no parseable origin - rechazar más abajo
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    url: '/api-docs/swagger.json',
  },
}));

// Ruta alternativa /swagger que lleva a api-docs
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    url: '/swagger/swagger.json',
  },
}));

// Swagger JSON endpoints
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/swagger/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Redireccionar raíz a Swagger
app.get('/', (req, res) => {
  res.redirect('/swagger');
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/emails', emailRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: err.message || 'Error interno del servidor' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});
