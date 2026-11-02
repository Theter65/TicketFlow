#!/usr/bin/env bash
# ==========================================================
# DATELAR ACCESS - SCRIPT DE INSTALACIÓN Y CONFIGURACIÓN POSTGRES
# Raspberry Pi 5 / Debian / Ubuntu
# ==========================================================

set -e

DB_NAME="datelar_access"
DB_USER="datelar"
DB_PASS="DatelarAccess2026*"

echo "==> 1. Actualizando paquetes del sistema..."
sudo apt-get update -y
sudo apt-get install -y postgresql postgresql-contrib curl ufw

echo "==> 2. Iniciando y habilitando servicio de PostgreSQL..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

echo "==> 3. Configurando usuario y base de datos en PostgreSQL..."
sudo -u postgres psql -c "DO \$\$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
        CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}' SUPERUSER;
    ELSE
        ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASS}';
    END IF;
END \$\$;"

sudo -u postgres psql -c "SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec"

echo "==> 4. Habilitando conexiones remotas en postgresql.conf..."
PG_CONF=$(sudo -u postgres psql -t -P format=unaligned -c "SHOW config_file;")
PG_HBA=$(sudo -u postgres psql -t -P format=unaligned -c "SHOW hba_file;")

sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" "$PG_CONF"
sudo sed -i "s/listen_addresses = 'localhost'/listen_addresses = '*'/g" "$PG_CONF"

# Permitir conexiones seguras con contraseña md5/scram-sha-256
if ! grep -q "host    ${DB_NAME}     ${DB_USER}     0.0.0.0/0" "$PG_HBA"; then
    echo "host    ${DB_NAME}     ${DB_USER}     0.0.0.0/0            scram-sha-256" | sudo tee -a "$PG_HBA"
    echo "host    all            ${DB_USER}     0.0.0.0/0            scram-sha-256" | sudo tee -a "$PG_HBA"
fi

echo "==> 5. Reiniciando PostgreSQL para aplicar cambios de red..."
sudo systemctl restart postgresql

echo "==> 6. Creando tablas y funciones desde schema.sql..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/schema.sql" ]; then
    PGPASSWORD="${DB_PASS}" psql -h localhost -U "${DB_USER}" -d "${DB_NAME}" -f "$SCRIPT_DIR/schema.sql"
    echo "✓ Tablas, índices y función validate_ticket creados con éxito."
else
    echo "⚠ No se encontró schema.sql en $SCRIPT_DIR. Ejecútalo manualmente después."
fi

echo "=========================================================="
echo "✓ POSTGRESQL EN RASPBERRY PI 5 CONFIGURADO CON ÉXITO"
echo "  Base de datos: ${DB_NAME}"
echo "  Usuario:       ${DB_USER}"
echo "  Puerto:        5432"
echo "  IP Local Pi:   $(hostname -I | awk '{print $1}')"
echo "=========================================================="
