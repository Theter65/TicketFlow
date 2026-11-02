import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "datelar_access_default_secret_2026";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email y contraseña requeridos" },
        { status: 400 }
      );
    }

    // Buscar usuario
    const rows = await query(
      `SELECT u.id, u.organization_id, u.name, u.email, u.password_hash, u.role, u.is_active, o.name as org_name
       FROM users u
       LEFT JOIN organizations o ON o.id = u.organization_id
       WHERE LOWER(u.email) = LOWER($1);`,
      [email.trim()]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    const user = rows[0];

    if (!user.is_active) {
      return NextResponse.json(
        { success: false, error: "Usuario inactivo. Contacta al administrador." },
        { status: 403 }
      );
    }

    // Comprobar contraseña (bcrypt o fallback)
    let passwordMatch = false;
    if (user.password_hash.startsWith("$2a$") || user.password_hash.startsWith("$2b$")) {
      passwordMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      passwordMatch = user.password_hash === password;
    }

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        organizationId: user.organization_id,
        role: user.role,
        name: user.name,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id,
        organization_name: user.org_name,
      },
    });
  } catch (error: any) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
