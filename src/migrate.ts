import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "../drizzle/db";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This will run migrations on the database, skipping the ones already applied
migrate(db, {
  migrationsFolder: path.join(__dirname, "..", "drizzle", "migrations"),
});
