import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, event_id, device_info, scanner_id } = body;

    if (!code || !event_id) {
      return NextResponse.json(
        { success: false, error: "Parámetros incompletos (code y event_id son obligatorios)" },
        { status: 400 }
      );
    }

    // Ejecuta la función atómica en PostgreSQL con bloqueo FOR UPDATE
    const sql = `
      SELECT validate_ticket(
        $1::VARCHAR, 
        $2::UUID, 
        $3::UUID, 
        $4::VARCHAR
      ) AS result;
    `;

    const rows = await query(sql, [
      code.trim(),
      event_id,
      scanner_id || null,
      device_info || "Datelar-Scanner",
    ]);

    const validation = rows[0]?.result;

    return NextResponse.json({
      success: validation?.success ?? false,
      data: validation,
    });
  } catch (error: any) {
    console.error("Error en validación de entrada:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
