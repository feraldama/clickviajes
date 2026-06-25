import { z } from "zod";

export interface AuditLogRecord {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  summary: string;
  createdAt: string;
  user: { fullName: string } | null;
}

export const auditListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(30),
});
export type AuditListQuery = z.infer<typeof auditListQuerySchema>;
