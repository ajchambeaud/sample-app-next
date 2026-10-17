export async function register() {
  // Only the Node.js server runtime talks to SQLite; skip the edge bundle.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runMigrations } = await import("./lib/db/migrate");
    await runMigrations();
    console.log("Database migrations applied");
  }
}
