import { defineConfig } from "vitest/config";

const TEST_DATABASE_URL = "postgresql://postgres:12345@localhost:5432/clickviajes_test?schema=public";

export default defineConfig({
  // El código fuente usa imports con extensión .js (ESM); mapeamos a .ts para vitest.
  resolve: {
    extensionAlias: { ".js": [".ts", ".js"] },
  },
  test: {
    globalSetup: ["./test/globalSetup.ts"],
    fileParallelism: false, // los tests comparten una sola BD de test
    hookTimeout: 60000,
    testTimeout: 30000,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      NODE_ENV: "test",
      JWT_ACCESS_SECRET: "test_access_secret",
      JWT_REFRESH_SECRET: "test_refresh_secret",
      JWT_ACCESS_EXPIRES: "15m",
      JWT_REFRESH_EXPIRES: "7d",
      BCRYPT_ROUNDS: "4",
      API_PORT: "4999",
      CORS_ORIGIN: "http://localhost:3000",
    },
  },
});
