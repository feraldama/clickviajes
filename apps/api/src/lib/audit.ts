import { prismaBase } from "./prisma.js";
import { getTenantContext } from "./tenant-context.js";

/**
 * Registra una acción en la auditoría. Es best-effort: si falla, NO interrumpe
 * la operación de negocio (solo se loguea). Lee tenant/usuario del contexto.
 */
export async function recordAudit(
  action: string,
  entity: string,
  entityId: string | null,
  summary: string,
): Promise<void> {
  const ctx = getTenantContext();
  try {
    await prismaBase.auditLog.create({
      data: {
        tenantId: ctx?.tenantId ?? null,
        userId: ctx?.userId ?? null,
        action,
        entity,
        entityId,
        summary,
      },
    });
  } catch (err) {
    console.error("⚠️ No se pudo registrar la auditoría:", err);
  }
}
