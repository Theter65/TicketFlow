-- ==========================================================
-- DATELAR ACCESS - POSTGRESQL DATABASE SCHEMA
-- Producción & Control de Acceso de Eventos en Tiempo Real
-- ==========================================================

-- Extensión para generación de UUIDs seguros
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ORGANIZACIONES / PROMOTORAS / EMPRESAS
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    contact_email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USUARIOS & ROLES (Admin, Organizador, Validador / Staff)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'scanner_staff' 
        CHECK (role IN ('superadmin', 'admin', 'organizer', 'scanner_staff')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. EVENTOS
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    capacity INTEGER NOT NULL DEFAULT 500,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_org_event_slug UNIQUE (organization_id, slug)
);

-- 4. TIPOS / NIVELES DE ENTRADAS (General, VIP, Preventa, Cortesía)
CREATE TABLE IF NOT EXISTS ticket_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    quantity_total INTEGER NOT NULL,
    quantity_issued INTEGER NOT NULL DEFAULT 0,
    color_hex VARCHAR(7) DEFAULT '#3CC6D9',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_event_tier_name UNIQUE (event_id, name)
);

-- 5. ENTRADAS / TICKETS INDIVIDUALES
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tier_id UUID NOT NULL REFERENCES ticket_tiers(id) ON DELETE CASCADE,
    ticket_number INTEGER NOT NULL,
    code_hash VARCHAR(255) UNIQUE NOT NULL, -- Código criptográfico firmado en el QR
    attendee_name VARCHAR(255),
    attendee_email VARCHAR(255),
    attendee_dni VARCHAR(50), -- Cédula / DNI
    status VARCHAR(50) NOT NULL DEFAULT 'issued' 
        CHECK (status IN ('issued', 'used', 'cancelled', 'refunded')),
    first_scanned_at TIMESTAMPTZ,
    last_scanned_at TIMESTAMPTZ,
    scan_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_event_ticket_number UNIQUE (event_id, ticket_number)
);

-- 6. REGISTRO DE ESCANEOS / AUDITORÍA DE PUERTA (Anti-fraude)
CREATE TABLE IF NOT EXISTS scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    scanned_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    raw_code VARCHAR(255) NOT NULL,
    result VARCHAR(50) NOT NULL 
        CHECK (result IN ('valid', 'already_used', 'invalid_code', 'wrong_event', 'cancelled')),
    device_info VARCHAR(255),
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de alto rendimiento para búsqueda en menos de 5ms en puertas
CREATE INDEX IF NOT EXISTS idx_tickets_code_hash ON tickets(code_hash);
CREATE INDEX IF NOT EXISTS idx_tickets_event_status ON tickets(event_id, status);
CREATE INDEX IF NOT EXISTS idx_scan_logs_event ON scan_logs(event_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_org ON events(organization_id);

-- ==========================================================
-- 7. FUNCIÓN ATÓMICA DE VALIDACIÓN DE ENTRADAS
-- Evita condiciones de carrera si dos puertas escanean a la vez
-- ==========================================================
CREATE OR REPLACE FUNCTION validate_ticket(
    p_code_hash VARCHAR,
    p_event_id UUID,
    p_scanner_id UUID DEFAULT NULL,
    p_device_info VARCHAR DEFAULT 'Mobile-Scanner'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_ticket RECORD;
    v_result VARCHAR(50);
    v_message VARCHAR(255);
    v_tier_name VARCHAR(100);
BEGIN
    -- Bloqueo de fila exclusivo para evitar doble acceso concurrente
    SELECT t.*, tt.name AS tier_name
    INTO v_ticket
    FROM tickets t
    JOIN ticket_tiers tt ON t.tier_id = tt.id
    WHERE t.code_hash = p_code_hash
    FOR UPDATE;

    -- Caso 1: El código QR no existe
    IF NOT FOUND THEN
        v_result := 'invalid_code';
        v_message := 'CÓDIGO NO VÁLIDO O INEXISTENTE';
        
        INSERT INTO scan_logs(event_id, scanned_by_user_id, raw_code, result, device_info)
        VALUES (p_event_id, p_scanner_id, p_code_hash, v_result, p_device_info);

        RETURN jsonb_build_object(
            'success', FALSE,
            'result', v_result,
            'message', v_message
        );
    END IF;

    -- Caso 2: El ticket pertenece a otro evento
    IF v_ticket.event_id <> p_event_id THEN
        v_result := 'wrong_event';
        v_message := 'ENTRADA PERTENECE A OTRO EVENTO';

        INSERT INTO scan_logs(ticket_id, event_id, scanned_by_user_id, raw_code, result, device_info)
        VALUES (v_ticket.id, p_event_id, p_scanner_id, p_code_hash, v_result, p_device_info);

        RETURN jsonb_build_object(
            'success', FALSE,
            'result', v_result,
            'message', v_message,
            'ticket_id', v_ticket.id
        );
    END IF;

    -- Caso 3: El ticket ya fue utilizado previamente (DUPLICADO)
    IF v_ticket.status = 'used' THEN
        v_result := 'already_used';
        v_message := 'ENTRADA YA UTILIZADA';

        UPDATE tickets
        SET scan_count = scan_count + 1,
            last_scanned_at = NOW()
        WHERE id = v_ticket.id;

        INSERT INTO scan_logs(ticket_id, event_id, scanned_by_user_id, raw_code, result, device_info)
        VALUES (v_ticket.id, p_event_id, p_scanner_id, p_code_hash, v_result, p_device_info);

        RETURN jsonb_build_object(
            'success', FALSE,
            'result', v_result,
            'message', v_message,
            'attendee_name', v_ticket.attendee_name,
            'tier', v_ticket.tier_name,
            'first_scanned_at', v_ticket.first_scanned_at,
            'scan_count', v_ticket.scan_count + 1
        );
    END IF;

    -- Caso 4: El ticket está cancelado o reembolsado
    IF v_ticket.status IN ('cancelled', 'refunded') THEN
        v_result := 'cancelled';
        v_message := 'ENTRADA CANCELADA O ANULADA';

        INSERT INTO scan_logs(ticket_id, event_id, scanned_by_user_id, raw_code, result, device_info)
        VALUES (v_ticket.id, p_event_id, p_scanner_id, p_code_hash, v_result, p_device_info);

        RETURN jsonb_build_object(
            'success', FALSE,
            'result', v_result,
            'message', v_message
        );
    END IF;

    -- Caso 5: INGRESO VÁLIDO EXITOSO
    v_result := 'valid';
    v_message := 'INGRESO AUTORIZADO';

    UPDATE tickets
    SET status = 'used',
        scan_count = 1,
        first_scanned_at = NOW(),
        last_scanned_at = NOW()
    WHERE id = v_ticket.id;

    INSERT INTO scan_logs(ticket_id, event_id, scanned_by_user_id, raw_code, result, device_info)
    VALUES (v_ticket.id, p_event_id, p_scanner_id, p_code_hash, v_result, p_device_info);

    RETURN jsonb_build_object(
        'success', TRUE,
        'result', v_result,
        'message', v_message,
        'attendee_name', v_ticket.attendee_name,
        'attendee_dni', v_ticket.attendee_dni,
        'tier', v_ticket.tier_name,
        'ticket_number', v_ticket.ticket_number
    );
END;
$$;
