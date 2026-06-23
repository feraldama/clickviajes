# Click Viajes

Sistema de gestión integral (ERP/CRM ligero) **multi-tenant** para agencias de viajes y
turismo. Monorepo con frontend Next.js, backend Express y base de datos PostgreSQL.

> Diseño completo en [docs/fase-0-diseno.md](docs/fase-0-diseno.md).

## Stack

- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind CSS + TanStack Query
- **Backend:** Node.js + Express (TypeScript), arquitectura por capas
- **BD:** PostgreSQL · **ORM:** Prisma
- **Compartido:** Zod, tipos, constantes, cálculo de RUC (módulo 11) y helpers de fecha
- **Auth (Fase 2):** JWT access/refresh con roles

## Estructura

```
apps/
  api/        API REST (Express + Prisma) — multi-tenant
  web/        Next.js (App Router) + Tailwind
packages/
  shared/     Zod + tipos + RUC + helpers de fecha (front + back)
```

## Requisitos

- Node.js >= 20 · pnpm >= 9
- PostgreSQL (BD `clickviajes` ya creada)

## Puesta en marcha

```bash
# 1. Instalar dependencias (desde la raíz)
pnpm install

# 2. Configurar entorno: copiar y ajustar si hace falta
cp .env.example .env   # el .env ya viene con la conexión local

# 3. Generar cliente Prisma y crear las tablas
pnpm db:generate
pnpm db:migrate        # crea la migración inicial y las tablas

# 4. Cargar datos de ejemplo (super-admin, agencia demo, usuarios)
pnpm db:seed

# 5. Levantar todo (API en :4000, web en :3000)
pnpm dev
```

### Scripts útiles (raíz)

| Script | Acción |
|--------|--------|
| `pnpm dev` | Levanta API y web en paralelo |
| `pnpm dev:api` / `pnpm dev:web` | Levanta solo uno |
| `pnpm db:migrate` | Aplica migraciones Prisma |
| `pnpm db:seed` | Carga datos de ejemplo |
| `pnpm db:studio` | Abre Prisma Studio |
| `pnpm test` | Tests (incluye los del RUC) |
| `pnpm typecheck` | Chequeo de tipos en todo el monorepo |

## Multi-tenant

Aislamiento por fila compartida (`tenantId`). El filtrado es automático mediante una extensión
de Prisma Client que lee el tenant del contexto (`AsyncLocalStorage`) establecido por el
middleware tras autenticar. Ver `apps/api/src/lib/prisma.ts` y `tenant-context.ts`.

## Convención de git

Los commits los realiza únicamente el responsable del repositorio.
