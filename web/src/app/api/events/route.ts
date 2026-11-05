import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("organization_id");

    const sql = `
      SELECT 
        e.id, 
        e.name, 
        e.slug, 
        e.description, 
        e.location, 
        e.starts_at, 
        e.ends_at, 
        e.capacity, 
        e.is_active,
        COUNT(t.id)::int as total_issued,
        COUNT(CASE WHEN t.status = 'used' THEN 1 END)::int as total_scanned
      FROM events e
      LEFT JOIN tickets t ON t.event_id = e.id
      ${orgId ? "WHERE e.organization_id = $1" : ""}
      GROUP BY e.id
      ORDER BY e.starts_at DESC;
    `;

    const events = await query(sql, orgId ? [orgId] : []);

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error: any) {
    console.warn("[API Events] Base de datos no disponible, usando eventos de respaldo:", error.message);
    return NextResponse.json({
      success: true,
      offline_mode: true,
      events: [
        {
          id: "3beac8d9-ba09-4fb6-9829-45ad560de121",
          name: "UNL Tech Summit 2026",
          slug: "unl-tech-summit-2026",
          description: "Encuentro de Telecomunicaciones, Inteligencia Artificial y Control de Acceso",
          location: "Campus Guillermo Falconí Espinosa, UNL, Loja",
          starts_at: "2026-11-20T20:00:00Z",
          capacity: 650,
          is_active: true,
          total_issued: 500,
          total_scanned: 1,
          tiers: [
            { id: "t-1", name: "Entrada General", price: 5.0 },
            { id: "t-2", name: "Pase VIP", price: 15.0 },
            { id: "t-3", name: "Pase Ponente / Staff", price: 0.0 },
          ],
        },
      ],
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { organization_id, name, description, location, starts_at, capacity = 500, tiers = [] } = body;

    if (!name || !starts_at) {
      return NextResponse.json(
        { success: false, error: "Nombre y fecha de inicio son requeridos" },
        { status: 400 }
      );
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    // Si no se envía organization_id, buscamos la primera o creamos una por defecto
    let orgId = organization_id;
    if (!orgId) {
      const orgRows = await query(`SELECT id FROM organizations LIMIT 1;`);
      if (orgRows.length > 0) {
        orgId = orgRows[0].id;
      } else {
        const newOrg = await query(
          `INSERT INTO organizations (name, slug) VALUES ('Datelar Events', 'datelar-events') RETURNING id;`
        );
        orgId = newOrg[0].id;
      }
    }

    // Insertar evento
    const eventRows = await query(
      `INSERT INTO events (organization_id, name, slug, description, location, starts_at, capacity)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *;`,
      [orgId, name, slug, description || "", location || "Por definir", starts_at, capacity]
    );

    const event = eventRows[0];

    // Crear tipos de pases
    const tiersToCreate = tiers.length > 0 ? tiers : [
      { name: "General", price: 10.00, quantity_total: capacity, color_hex: "#3CC6D9" },
    ];

    for (const t of tiersToCreate) {
      await query(
        `INSERT INTO ticket_tiers (event_id, name, price, quantity_total, color_hex)
         VALUES ($1, $2, $3, $4, $5);`,
        [event.id, t.name, t.price, t.quantity_total, t.color_hex || "#3CC6D9"]
      );
    }

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
