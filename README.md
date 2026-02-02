# Video Backend API

Backend para sistema de gestión y almacenamiento de videos.

## Instalación

```bash
npm install
```

## Configuración

1. Copia `.env.example` a `.env`
2. Configura las variables de entorno
3. Crea la base de datos PostgreSQL

## Desarrollo

```bash
npm run dev
```

## Producción

```bash
npm start
```

## Endpoints

- `POST /api/videos/upload` - Subir video
- `GET /api/videos/:videoId/url` - Obtener URL del video
- `GET /api/videos/list` - Listar videos del usuario

## Estructura de Base de Datos

```sql
CREATE TABLE videos (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  video_key VARCHAR(500) NOT NULL UNIQUE,
  filename VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_id ON videos(user_id);
CREATE INDEX idx_created_at ON videos(created_at DESC);
```
