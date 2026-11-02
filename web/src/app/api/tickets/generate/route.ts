import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import crypto from "crypto";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_id, tier_id, quantity = 1, attendee_name, attendee_email, attendee_dni } = body;

    if (!event_id || !tier_id) {
      return NextResponse.json(
        { success: false, error: "event_id y tier_id son requeridos" },
        { status: 400 }
      );
    }

    const count = Math.min(Math.max(Number(quantity) || 1, 1), 500); // Límite de 500 por lote

    // Obtener información del evento y nivel
    const eventRows = await query(
      `SELECT e.slug, e.name, tt.name as tier_name, tt.quantity_issued
       FROM events e 
       JOIN ticket_tiers tt ON tt.id = $1 
       WHERE e.id = $2`,
      [tier_id, event_id]
    );

    if (eventRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Evento o tipo de entrada no encontrado" },
        { status: 404 }
      );
    }

    const { slug, tier_name } = eventRows[0];
    const createdTickets = [];

    for (let i = 0; i < count; i++) {
      // Siguiente número de ticket correlativo
      const numRow = await query(
        `SELECT COALESCE(MAX(ticket_number), 0) + 1 as next_num FROM tickets WHERE event_id = $1`,
        [event_id]
      );
      const ticketNumber = numRow[0].next_num;

      // Código criptográfico único con firma
      const randomEntropy = crypto.randomBytes(8).toString("hex").toUpperCase();
      const codeHash = `DTL-${slug.toUpperCase().slice(0, 4)}-${ticketNumber.toString().padStart(4, "0")}-${randomEntropy}`;

      // Insertar ticket
      const insertRow = await query(
        `INSERT INTO tickets (
          event_id, tier_id, ticket_number, code_hash, attendee_name, attendee_email, attendee_dni, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'issued')
        RETURNING id, ticket_number, code_hash, created_at;`,
        [
          event_id,
          tier_id,
          ticketNumber,
          codeHash,
          attendee_name || `Asistente #${ticketNumber}`,
          attendee_email || null,
          attendee_dni || null,
        ]
      );

      const ticket = insertRow[0];

      // Generar imagen QR en Base64 Data URI
      const qrDataUrl = await QRCode.toDataURL(codeHash, {
        errorCorrectionLevel: "M",
        width: 320,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      createdTickets.push({
        ...ticket,
        tier_name,
        qr_image: qrDataUrl,
      });
    }

    // Actualizar cantidad emitida en el tipo de ticket
    await query(
      `UPDATE ticket_tiers SET quantity_issued = quantity_issued + $1 WHERE id = $2`,
      [count, tier_id]
    );

    return NextResponse.json({
      success: true,
      count: createdTickets.length,
      tickets: createdTickets,
    });
  } catch (error: any) {
    console.error("Error generando tickets:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al emitir entradas" },
      { status: 500 }
    );
  }
}
