#!/bin/bash
# Script para ejecutar la inicialización de la base de datos
# Uso: ./init-db.sh

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-videos_db}
DB_USER=${DB_USER:-postgres}

echo "Inicializando base de datos en $DB_HOST:$DB_PORT/$DB_NAME..."

PGPASSWORD=$DB_PASSWORD psql \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -f database.sql

if [ $? -eq 0 ]; then
  echo "✅ Base de datos inicializada correctamente"
else
  echo "❌ Error al inicializar la base de datos"
  exit 1
fi
