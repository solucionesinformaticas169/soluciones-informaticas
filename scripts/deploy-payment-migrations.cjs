const { readdirSync } = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");
const { PrismaClient } = require("@prisma/client");

const paymentMigrations = new Set([
  "20261026120000_payments",
  "20261026130000_payment_settings",
  "20261026140000_payment_total_only",
  "20261027120000_simple_payment"
]);

async function main() {
  if (process.env.VERCEL_ENV !== "production") {
    console.log("Payment migrations: skipped outside Vercel production.");
    return;
  }
  const connection = process.env.DATABASE_URL?.trim();
  if (!connection || connection === "[SENSITIVE]") throw new Error("DATABASE_URL is unavailable.");
  const prisma = new PrismaClient();
  let pending;
  try {
    const history = await prisma.$queryRaw`SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"`;
    if (history.some((row) => !row.finished_at && !row.rolled_back_at)) throw new Error("An unfinished database migration requires review.");
    const completed = new Set(history.filter((row) => row.finished_at && !row.rolled_back_at).map((row) => row.migration_name));
    pending = readdirSync(join(__dirname, "..", "prisma", "migrations"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !completed.has(entry.name)).map((entry) => entry.name);
    // Never apply unrelated historical changes as a side effect of enabling payments.
    if (pending.some((name) => !paymentMigrations.has(name))) throw new Error("Unrelated pending migrations require review before deploying payments.");
  } finally {
    await prisma.$disconnect();
  }
  if (!pending.length) {
    console.log("Payment migrations: database is up to date.");
    return;
  }
  console.log(`Applying payment migrations: ${pending.join(", ")}`);
  const result = spawnSync(process.execPath, [require.resolve("prisma/build/index.js"), "migrate", "deploy"], { stdio: "inherit", env: process.env });
  if (result.error || result.status !== 0) throw new Error("Payment migration deployment did not complete.");
}

main().catch((error) => {
  console.error("Payment migration preflight failed:", error instanceof Error && !error.message.includes("Invalid `") ? error.message : "Database connection or migration history requires review.");
  process.exitCode = 1;
});
