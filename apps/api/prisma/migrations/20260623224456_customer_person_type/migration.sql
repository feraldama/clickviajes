-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('PHYSICAL', 'JURIDICAL');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "personType" "PersonType" NOT NULL DEFAULT 'PHYSICAL',
ALTER COLUMN "lastName" SET DEFAULT '';
