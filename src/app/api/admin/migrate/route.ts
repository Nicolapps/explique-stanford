export async function POST(req: Request) {
  try {
    const path = await import("path");
    const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
    const { db } = await import("../../../../../drizzle/db");
    const { fileURLToPath } = await import("url");

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // This will run migrations on the database, skipping the ones already applied
    await migrate(db, {
      migrationsFolder: path.join(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        "..",
        "drizzle",
        "migrations",
      ),
    });
    return new Response("OK");
  } catch (err) {
    return new Response("Error: " + err);
  }
}
