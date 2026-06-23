import { execSync } from "node:child_process";

const TEST_DATABASE_URL = "postgresql://postgres:12345@localhost:5432/clickviajes_test?schema=public";

/** Aplica las migraciones Prisma sobre la BD de test antes de correr la suite. */
export default function setup() {
  execSync("pnpm exec prisma migrate deploy", {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });
}
