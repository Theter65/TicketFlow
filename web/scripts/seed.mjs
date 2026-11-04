import pg from 'pg';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
let dbUrl = "postgresql://datelar:DatelarAccess2026*@192.168.101.21:5432/datelar_access";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
      dbUrl = trimmed.split('=')[1].replace(/["']/g, '');
    }
  }
}

console.log("Connecting to PostgreSQL at:", dbUrl.replace(/:[^:@]*@/, ':****@'));

const pool = new pg.Pool({
  connectionString: dbUrl,
  connectionTimeoutMillis: 5000,
});

async function run() {
  const client = await pool.connect();
  try {
    console.log("SUCCESS: Connected to PostgreSQL on Raspberry Pi 5!");

    // 1. Check or Insert Organization
    let orgRes = await client.query("SELECT id FROM organizations WHERE slug = 'datelar-events'");
    let orgId;
    if (orgRes.rows.length === 0) {
      const insOrg = await client.query(
        "INSERT INTO organizations (name, slug, contact_email) VALUES ($1, $2, $3) RETURNING id",
        ['Datelar Live Events', 'datelar-events', 'contacto@datelar.com']
      );
      orgId = insOrg.rows[0].id;
      console.log("Created Organization: Datelar Live Events (ID:", orgId, ")");
    } else {
      orgId = orgRes.rows[0].id;
      console.log("Organization already exists (ID:", orgId, ")");
    }

    // 2. Check or Insert Admin User
    const adminEmail = 'admin@datelar.com';
    let userRes = await client.query("SELECT id FROM users WHERE email = $1", [adminEmail]);
    if (userRes.rows.length === 0) {
      const passHash = await bcrypt.hash('admin123', 10);
      const insUser = await client.query(
        `INSERT INTO users (organization_id, name, email, password_hash, role)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [orgId, 'Gerardo Gonza', adminEmail, passHash, 'superadmin']
      );
      console.log("Created SuperAdmin User:", adminEmail, "(ID:", insUser.rows[0].id, ")");
    } else {
      console.log("Admin user already exists:", adminEmail);
    }

    // 3. Check or Insert Sample Event
    let eventRes = await client.query("SELECT id FROM events WHERE slug = 'unl-tech-summit-2026'");
    let eventId;
    if (eventRes.rows.length === 0) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 8);

      const insEvent = await client.query(
        `INSERT INTO events (organization_id, name, slug, description, location, starts_at, ends_at, capacity, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          orgId,
          'UNL Tech Summit 2026',
          'unl-tech-summit-2026',
          'Encuentro de Telecomunicaciones, Inteligencia Artificial y Control de Acceso',
          'Campus Guillermo Falconí Espinosa, UNL, Loja - Ecuador',
          startDate,
          endDate,
          650,
          true,
        ]
      );
      eventId = insEvent.rows[0].id;
      console.log("Created Event: UNL Tech Summit 2026 (ID:", eventId, ")");
    } else {
      eventId = eventRes.rows[0].id;
      console.log("Event already exists (ID:", eventId, ")");
    }

    // 4. Check or Insert Ticket Tiers
    const tiers = [
      { name: 'Entrada General', price: 5.00, capacity: 500, color: '#3CC6D9' },
      { name: 'Pase VIP', price: 15.00, capacity: 100, color: '#F59E0B' },
      { name: 'Pase Ponente / UNL Staff', price: 0.00, capacity: 50, color: '#10B981' },
    ];

    for (const t of tiers) {
      const existing = await client.query(
        "SELECT id FROM ticket_tiers WHERE event_id = $1 AND name = $2",
        [eventId, t.name]
      );
      if (existing.rows.length === 0) {
        await client.query(
          "INSERT INTO ticket_tiers (event_id, name, price, quantity_total, color_hex) VALUES ($1, $2, $3, $4, $5)",
          [eventId, t.name, t.price, t.capacity, t.color]
        );
        console.log(`Created Ticket Tier: ${t.name} ($${t.price})`);
      }
    }

    // 5. Verification count
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM organizations) AS orgs,
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM events) AS events,
        (SELECT COUNT(*) FROM ticket_tiers) AS tiers,
        (SELECT COUNT(*) FROM tickets) AS tickets
    `);
    console.log("\nDatabase Ready & Seeded Successfully:", counts.rows[0]);

  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Database seed failed:", err);
  process.exit(1);
});
