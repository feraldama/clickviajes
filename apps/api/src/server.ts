import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { prismaBase } from "./lib/prisma.js";

const app = createApp();

const server = app.listen(env.API_PORT, () => {
  console.log(`🚀 API Click Viajes escuchando en http://localhost:${env.API_PORT}`);
  console.log(`   Entorno: ${env.NODE_ENV}`);
  console.log(`   Health:  http://localhost:${env.API_PORT}/health`);
});

// Apagado ordenado
async function shutdown(signal: string) {
  console.log(`\n${signal} recibido, cerrando…`);
  server.close();
  await prismaBase.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
