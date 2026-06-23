import { PrismaClient } from "@prisma/client";
import { tenantStore } from "./tenant-context.js";

/**
 * Modelos de negocio que llevan columna `tenantId` y deben aislarse
 * automáticamente por agencia.
 *
 * Quedan FUERA a propósito:
 *  - Tenant, Plan, User, RefreshToken: entidades de plataforma/auth.
 *  - PackageDestination, PackageItineraryItem, TripDestination,
 *    TripItineraryItem: tablas hijas/join sin `tenantId` propio; se protegen
 *    a través de su entidad padre (que sí está aislada).
 */
const TENANT_MODELS = new Set<string>([
  "Customer",
  "CustomerDocument",
  "Destination",
  "Attraction",
  "Supplier",
  "Package",
  "Trip",
  "TripSupplier",
  "Quote",
  "Booking",
  "Passenger",
  "Installment",
  "Payment",
  "ExchangeRate",
]);

/** Cliente base, SIN aislamiento. Úsese solo para operaciones de plataforma
 *  (SUPER_ADMIN), autenticación y healthchecks. */
export const prismaBase = new PrismaClient();

/**
 * Cliente con aislamiento multi-tenant.
 *
 * Capa central: en cada query a un modelo con `tenantId`, inyecta el filtro
 * `where.tenantId` (lecturas/updates/deletes) o `data.tenantId` (creates) a
 * partir del contexto de tenant activo. Así ningún endpoint puede "olvidarse"
 * de filtrar por agencia.
 *
 * Usa `extendedWhereUnique` de Prisma (GA): se puede combinar la clave única
 * con `tenantId` también en findUnique/update/delete.
 *
 * Si no hay tenant en contexto (operación de plataforma), no inyecta nada.
 */
export const prisma = prismaBase.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        // Modelos de plataforma (sin tenantId propio): pasan directo.
        if (!model || !TENANT_MODELS.has(model)) {
          return query(args);
        }

        const tenantId = tenantStore.getStore()?.tenantId;
        if (!tenantId) {
          // Defensa en profundidad: nunca tocar datos de un tenant sin contexto.
          // Las operaciones de plataforma deben usar `prismaBase` (sin extensión).
          throw new Error(
            `Operación '${operation}' sobre '${model}' sin contexto de agencia. Usá 'prismaBase' para operaciones de plataforma.`,
          );
        }

        const a = (args ?? {}) as Record<string, unknown>;

        switch (operation) {
          case "findUnique":
          case "findUniqueOrThrow":
          case "findFirst":
          case "findFirstOrThrow":
          case "findMany":
          case "count":
          case "aggregate":
          case "groupBy":
          case "update":
          case "updateMany":
          case "delete":
          case "deleteMany": {
            a.where = { ...((a.where as object) ?? {}), tenantId };
            break;
          }
          case "create": {
            a.data = { ...((a.data as object) ?? {}), tenantId };
            break;
          }
          case "createMany":
          case "createManyAndReturn": {
            const data = a.data;
            a.data = Array.isArray(data)
              ? data.map((d) => ({ ...(d as object), tenantId }))
              : { ...((data as object) ?? {}), tenantId };
            break;
          }
          case "upsert": {
            a.where = { ...((a.where as object) ?? {}), tenantId };
            a.create = { ...((a.create as object) ?? {}), tenantId };
            break;
          }
          default:
            break;
        }

        return query(a);
      },
    },
  },
});

export type ExtendedPrismaClient = typeof prisma;
