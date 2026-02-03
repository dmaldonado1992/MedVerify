#!/bin/bash
# Script para inicializar la base de datos en Neon
# Uso: ./init-neon-db.sh

NEON_CONNECTION_STRING="postgresql://neondb_owner:npg_aOb4pP7MWoTh@ep-bold-snow-ahobrvb8-pooler.c-3.us-east-1.aws.neon.tech/MedVerify?sslmode=require&channel_binding=require"

echo "Conectando a Neon y ejecutando script SQL..."
echo "Database: MedVerify"
echo ""

psql "$NEON_CONNECTION_STRING" -f database.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Base de datos en Neon inicializada correctamente"
else
  echo ""
  echo "❌ Error al inicializar la base de datos"
  exit 1
fi
