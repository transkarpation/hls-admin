import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { users } from "../src/db/schema";
import admins from "../config/admins.json";

config({ path: ".env.local" });

const BCRYPT_ROUNDS = 12;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  for (const admin of admins) {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, admin.email))
      .limit(1);

    if (existing) {
      console.log(`Skipping ${admin.email} — already exists`);
      continue;
    }

    const passwordHash = await bcrypt.hash(admin.password, BCRYPT_ROUNDS);
    await db.insert(users).values({
      name: admin.name,
      email: admin.email,
      passwordHash,
      role: "admin",
    });
    console.log(`Created admin: ${admin.email}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
