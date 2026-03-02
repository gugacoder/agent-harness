/**
 * db:seed:test — cria empresa + usuarios de teste para desenvolvimento local.
 *
 * Usuarios criados (senha: 12345678):
 *   admin@mail.com     — Admin (operador)
 *   central@mail.com   — Central (operador)
 *   lojista@mail.com   — Lojista
 *   motoboy@mail.com   — Motoboy
 *
 * Uso: npm run db:seed:test  (na raiz do monorepo)
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema/index.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_PUBLIC_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const connStr = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/postgres`;
const sql = postgres(connStr);
const db = drizzle(sql, { schema });

const PASSWORD = "12345678";

const USERS = [
  { email: "admin@mail.com",    role: "operator", full_name: "Admin Teste",   phone: "11900000000" },
  { email: "central@mail.com",  role: "operator", full_name: "Central Teste", phone: "11900000001" },
  { email: "lojista@mail.com",  role: "shop",     full_name: "Lojista Teste", phone: "11900000002" },
  { email: "motoboy@mail.com",  role: "courier",  full_name: "Motoboy Teste", phone: "11900000003" },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function gotrueAdmin(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GoTrue ${path} failed (${res.status}): ${JSON.stringify(err)}`);
  }
  return res.json() as Promise<{ id: string }>;
}

async function deleteUserByEmail(email: string) {
  // List users and find by email
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
    },
  });
  if (!res.ok) return;
  const data = (await res.json()) as { users: { id: string; email: string }[] };
  const existing = data.users.find((u) => u.email === email);
  if (!existing) return;

  // Delete cascades via FK, but we clean profiles/shops/couriers ourselves
  // because auth.users → profiles FK is managed in raw SQL
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existing.id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
    },
  });
  console.log(`  deleted existing user ${email}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("--- db:seed:test ---\n");

  // 1. Upsert test company
  const companyData = {
    name: "Empresa Teste",
    cnpj: "00000000000100",
    phone: "11900000000",
    email: "empresa@mail.com",
    address: "Rua Teste 123, São Paulo - SP",
    lat: "-23.5505199",
    lng: "-46.6333094",
  };

  const [company] = await db
    .insert(schema.companies)
    .values(companyData)
    .onConflictDoUpdate({ target: schema.companies.cnpj, set: { name: companyData.name } })
    .returning();

  console.log(`company: ${company.name} (${company.id})\n`);

  // 2. Create auth users via GoTrue admin API
  for (const u of USERS) {
    // Clean previous if exists
    await deleteUserByEmail(u.email);

    const authUser = await gotrueAdmin("/users", {
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
      app_metadata: { company_id: company.id, role: u.role },
      user_metadata: { full_name: u.full_name, phone: u.phone },
    });

    console.log(`auth: ${u.email} → ${authUser.id} (${u.role})`);

    // 3. Insert profile
    await db
      .insert(schema.profiles)
      .values({
        id: authUser.id,
        company_id: company.id,
        role: u.role,
        full_name: u.full_name,
        phone: u.phone,
      })
      .onConflictDoNothing();

    // 4. Insert role-specific record
    if (u.role === "shop") {
      await db
        .insert(schema.shops)
        .values({
          company_id: company.id,
          profile_id: authUser.id,
          trade_name: "Loja Teste",
          phone: u.phone,
          address: "Rua da Loja 456, São Paulo - SP",
          lat: "-23.5489",
          lng: "-46.6388",
        })
        .onConflictDoNothing();
    }

    if (u.role === "courier") {
      await db
        .insert(schema.couriers)
        .values({
          company_id: company.id,
          profile_id: authUser.id,
          full_name: u.full_name,
          phone: u.phone,
        })
        .onConflictDoNothing();
    }
  }

  console.log("\n--- seed complete ---");
  console.log(`\nLogin credentials (all passwords: ${PASSWORD}):`);
  for (const u of USERS) {
    console.log(`  ${u.role.padEnd(8)} → ${u.email}`);
  }

  await sql.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
