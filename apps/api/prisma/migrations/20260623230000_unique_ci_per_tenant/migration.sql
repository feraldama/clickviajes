-- DropIndex
DROP INDEX "Customer_tenantId_ci_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Customer_tenantId_ci_key" ON "Customer"("tenantId", "ci");
