/*
  Warnings:

  - You are about to drop the column `actorId` on the `audit_log` table. All the data in the column will be lost.
  - You are about to drop the column `entityId` on the `audit_log` table. All the data in the column will be lost.
  - You are about to drop the column `entityType` on the `audit_log` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `audit_log` table. All the data in the column will be lost.
  - Added the required column `resourceType` to the `audit_log` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('EMPLOYEE_CREATED', 'EMPLOYEE_UPDATED', 'EMPLOYEE_DELETED', 'PAYSLIP_CREATED', 'PAYSLIP_ISSUED', 'PAYSLIP_DOWNLOADED', 'PAYSLIP_SHARED', 'USER_LOGIN', 'USER_LOGOUT', 'PROFILE_UPDATED');

-- CreateEnum
CREATE TYPE "AuditResourceType" AS ENUM ('EMPLOYEE', 'PAYSLIP', 'PAY_PERIOD', 'EMPLOYER', 'USER', 'SHARE_LINK');

-- DropIndex
DROP INDEX "audit_log_actorId_idx";

-- AlterTable
ALTER TABLE "audit_log" DROP COLUMN "actorId",
DROP COLUMN "entityId",
DROP COLUMN "entityType",
DROP COLUMN "metadata",
ADD COLUMN     "details" JSONB,
ADD COLUMN     "performedByUserId" TEXT,
ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "resourceId" TEXT,
ADD COLUMN     "resourceType" TEXT NOT NULL,
ADD COLUMN     "status" "AuditStatus" NOT NULL DEFAULT 'SUCCESS';

-- CreateIndex
CREATE INDEX "audit_log_performedByUserId_idx" ON "audit_log"("performedByUserId");

-- CreateIndex
CREATE INDEX "audit_log_resourceType_idx" ON "audit_log"("resourceType");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
