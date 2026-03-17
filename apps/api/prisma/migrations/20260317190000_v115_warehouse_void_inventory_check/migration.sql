-- v1.1.5: warehouse void/reversal + inventory check workflow

-- CreateEnum
CREATE TYPE "WarehouseOrderStatus" AS ENUM ('POSTED', 'VOIDED');

-- CreateEnum
CREATE TYPE "InventoryCheckStatus" AS ENUM ('DRAFT', 'APPROVED');

-- AlterTable
ALTER TABLE "WarehouseOrder"
ADD COLUMN     "status" "WarehouseOrderStatus" NOT NULL DEFAULT 'POSTED',
ADD COLUMN     "reversalOfId" TEXT,
ADD COLUMN     "reversalOrderId" TEXT,
ADD COLUMN     "voidReason" TEXT,
ADD COLUMN     "voidedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "WarehouseOrder_status_idx" ON "WarehouseOrder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseOrder_reversalOfId_key" ON "WarehouseOrder"("reversalOfId");

-- AddForeignKey
ALTER TABLE "WarehouseOrder" ADD CONSTRAINT "WarehouseOrder_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "WarehouseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "InventoryCheck" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" "InventoryCheckStatus" NOT NULL DEFAULT 'DRAFT',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approverId" TEXT,

    CONSTRAINT "InventoryCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryCheckItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "systemQty" INTEGER NOT NULL,
    "countedQty" INTEGER NOT NULL,
    "diffQty" INTEGER NOT NULL,
    "remark" TEXT,

    CONSTRAINT "InventoryCheckItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryCheckOrder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryCheckOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryCheck_tenantId_idx" ON "InventoryCheck"("tenantId");

-- CreateIndex
CREATE INDEX "InventoryCheck_status_idx" ON "InventoryCheck"("status");

-- CreateIndex
CREATE INDEX "InventoryCheck_createdAt_idx" ON "InventoryCheck"("createdAt");

-- CreateIndex
CREATE INDEX "InventoryCheckItem_tenantId_idx" ON "InventoryCheckItem"("tenantId");

-- CreateIndex
CREATE INDEX "InventoryCheckItem_checkId_idx" ON "InventoryCheckItem"("checkId");

-- CreateIndex
CREATE INDEX "InventoryCheckItem_productId_idx" ON "InventoryCheckItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryCheckItem_tenantId_checkId_productId_key" ON "InventoryCheckItem"("tenantId", "checkId", "productId");

-- CreateIndex
CREATE INDEX "InventoryCheckOrder_tenantId_idx" ON "InventoryCheckOrder"("tenantId");

-- CreateIndex
CREATE INDEX "InventoryCheckOrder_checkId_idx" ON "InventoryCheckOrder"("checkId");

-- CreateIndex
CREATE INDEX "InventoryCheckOrder_orderId_idx" ON "InventoryCheckOrder"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryCheckOrder_tenantId_checkId_orderId_key" ON "InventoryCheckOrder"("tenantId", "checkId", "orderId");

-- AddForeignKey
ALTER TABLE "InventoryCheck" ADD CONSTRAINT "InventoryCheck_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryCheck" ADD CONSTRAINT "InventoryCheck_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryCheckItem" ADD CONSTRAINT "InventoryCheckItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryCheckItem" ADD CONSTRAINT "InventoryCheckItem_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "InventoryCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryCheckItem" ADD CONSTRAINT "InventoryCheckItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryCheckOrder" ADD CONSTRAINT "InventoryCheckOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryCheckOrder" ADD CONSTRAINT "InventoryCheckOrder_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "InventoryCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryCheckOrder" ADD CONSTRAINT "InventoryCheckOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "WarehouseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

