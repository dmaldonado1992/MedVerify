const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Video Backend API',
      version: '1.0.0',
      description: 'API REST para gestión y almacenamiento de videos con uploads a S3-compatible storage',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production Server',
      },
    ],
    components: {
      schemas: {
        Video: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            user_id: {
              type: 'string',
              example: 'user123',
            },
            video_key: {
              type: 'string',
              example: 'users/user123/videos/1706777600000_video.mp4',
            },
            filename: {
              type: 'string',
              example: 'video.mp4',
            },
            size: {
              type: 'integer',
              example: 524288000,
              description: 'Tamaño del archivo en bytes',
            },
            mime_type: {
              type: 'string',
              example: 'video/mp4',
            },
            views: {
              type: 'integer',
              example: 5,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-02-02T10:30:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-02-02T10:30:00Z',
            },
          },
        },
        UploadResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Video subido exitosamente',
            },
            data: {
              type: 'object',
              properties: {
                videoId: {
                  type: 'integer',
                  example: 1,
                },
                filename: {
                  type: 'string',
                  example: 'video.mp4',
                },
                size: {
                  type: 'integer',
                  example: 524288000,
                },
                url: {
                  type: 'string',
                  example: 'https://s3.example.com/signed-url...',
                },
              },
            },
          },
        },
        VideoUrl: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  example: 'https://s3.example.com/signed-url...',
                },
                filename: {
                  type: 'string',
                  example: 'video.mp4',
                },
                size: {
                  type: 'integer',
                  example: 524288000,
                },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Videos',
        description: 'Operaciones de gestión de videos',
      },
      {
        name: 'Health',
        description: 'Estado de la aplicación',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
