-- CreateEnum
CREATE TYPE "WarehouseOrderType" AS ENUM ('OUTBOUND_SALES', 'OUTBOUND_LOAN', 'OUTBOUND_AFTER_SALES', 'OUTBOUND_LOST', 'INBOUND_SALES', 'INBOUND_PURCHASE', 'INBOUND_AFTER_SALES', 'INBOUND_UNKNOWN');

-- CreateEnum
CREATE TYPE "OutboundApplicationStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "OutboundApplicationType" AS ENUM ('SALES_PRE', 'TECH_PRE');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('PAID', 'UNPAID', 'NEED_RETURN', 'RETURN_LATER', 'ON_ACCOUNT', 'GIFT', 'DESTROYED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('SALES', 'INVENTORY');

-- CreateEnum
CREATE TYPE "AlertCondition" AS ENUM ('DISCOUNT_BELOW_THRESHOLD', 'PAYMENT_BELOW_OUTBOUND', 'STOCK_BELOW_SUGGESTED', 'PROJECT_DISCOUNT_MISMATCH');

-- CreateEnum
CREATE TYPE "CurtainType" AS ENUM ('STRAIGHT_TRACK', 'L_TRACK', 'EMBEDDED_TRACK', 'EMBEDDED_L_TRACK', 'DREAM_TRACK', 'ROLLER_BLIND', 'ARC_TRACK', 'U_TRACK', 'LIFT_BLIND');

-- CreateEnum
CREATE TYPE "LayerType" AS ENUM ('SINGLE', 'DOUBLE');

-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "alertType" "AlertType" DEFAULT 'SALES';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "costPrice" DECIMAL(10,2),
ADD COLUMN     "images" JSONB,
ADD COLUMN     "isFabric" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "specification" TEXT,
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "unit" TEXT DEFAULT '个';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "serviceFee" DECIMAL(10,2),
ADD COLUMN     "signDiscountRate" DECIMAL(4,3);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "name" TEXT NOT NULL,
    "condition" "AlertCondition" NOT NULL,
    "threshold" DECIMAL(10,2),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboundApplication" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "type" "OutboundApplicationType" NOT NULL,
    "status" "OutboundApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "projectId" TEXT,
    "applicantId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboundApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboundApplicationItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "snCodes" JSONB,
    "remark" TEXT,

    CONSTRAINT "OutboundApplicationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseOrder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "orderType" "WarehouseOrderType" NOT NULL,
    "projectId" TEXT,
    "relatedOrderId" TEXT,
    "applicationId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentType" "PaymentType",
    "expressNo" TEXT,
    "images" JSONB,
    "remark" TEXT,
    "operatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseOrderItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "snCodes" JSONB,
    "unitPrice" DECIMAL(10,2),
    "remark" TEXT,

    CONSTRAINT "WarehouseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseOrderLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarehouseOrderLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurtainRoomDetail" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "roomName" TEXT NOT NULL,
    "curtainType" "CurtainType" NOT NULL,
    "hasCurtainBox" BOOLEAN NOT NULL DEFAULT false,
    "curtainBoxWidth" DECIMAL(5,2),
    "curtainBoxMaterial" TEXT,
    "leftLength" DECIMAL(5,2),
    "rightLength" DECIMAL(5,2),
    "middleLength" DECIMAL(5,2),
    "lDirection" TEXT,
    "installType" TEXT,
    "hasShell" BOOLEAN,
    "layerType" "LayerType" NOT NULL DEFAULT 'SINGLE',
    "installPosition" TEXT,
    "powerPosition" TEXT,
    "motorProductId" TEXT,
    "withFabric" BOOLEAN NOT NULL DEFAULT false,
    "fabricHeight" DECIMAL(5,2),
    "fabricProductId" TEXT,
    "remark" TEXT,
    "mediaUrls" JSONB,

    CONSTRAINT "CurtainRoomDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlertRule_tenantId_idx" ON "AlertRule"("tenantId");

-- CreateIndex
CREATE INDEX "AlertRule_type_idx" ON "AlertRule"("type");

-- CreateIndex
CREATE UNIQUE INDEX "AlertRule_tenantId_name_key" ON "AlertRule"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_productId_key" ON "Inventory"("productId");

-- CreateIndex
CREATE INDEX "Inventory_tenantId_idx" ON "Inventory"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "OutboundApplication_orderNo_key" ON "OutboundApplication"("orderNo");

-- CreateIndex
CREATE INDEX "OutboundApplication_tenantId_idx" ON "OutboundApplication"("tenantId");

-- CreateIndex
CREATE INDEX "OutboundApplication_projectId_idx" ON "OutboundApplication"("projectId");

-- CreateIndex
CREATE INDEX "OutboundApplication_applicantId_idx" ON "OutboundApplication"("applicantId");

-- CreateIndex
CREATE INDEX "OutboundApplication_status_idx" ON "OutboundApplication"("status");

-- CreateIndex
CREATE INDEX "OutboundApplication_type_idx" ON "OutboundApplication"("type");

-- CreateIndex
CREATE INDEX "OutboundApplicationItem_tenantId_idx" ON "OutboundApplicationItem"("tenantId");

-- CreateIndex
CREATE INDEX "OutboundApplicationItem_applicationId_idx" ON "OutboundApplicationItem"("applicationId");

-- CreateIndex
CREATE INDEX "OutboundApplicationItem_productId_idx" ON "OutboundApplicationItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseOrder_orderNo_key" ON "WarehouseOrder"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseOrder_applicationId_key" ON "WarehouseOrder"("applicationId");

-- CreateIndex
CREATE INDEX "WarehouseOrder_tenantId_idx" ON "WarehouseOrder"("tenantId");

-- CreateIndex
CREATE INDEX "WarehouseOrder_projectId_idx" ON "WarehouseOrder"("projectId");

-- CreateIndex
CREATE INDEX "WarehouseOrder_orderType_idx" ON "WarehouseOrder"("orderType");

-- CreateIndex
CREATE INDEX "WarehouseOrder_occurredAt_idx" ON "WarehouseOrder"("occurredAt");

-- CreateIndex
CREATE INDEX "WarehouseOrderItem_tenantId_idx" ON "WarehouseOrderItem"("tenantId");

-- CreateIndex
CREATE INDEX "WarehouseOrderItem_orderId_idx" ON "WarehouseOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "WarehouseOrderItem_productId_idx" ON "WarehouseOrderItem"("productId");

-- CreateIndex
CREATE INDEX "WarehouseOrderLog_tenantId_idx" ON "WarehouseOrderLog"("tenantId");

-- CreateIndex
CREATE INDEX "WarehouseOrderLog_orderId_idx" ON "WarehouseOrderLog"("orderId");

-- CreateIndex
CREATE INDEX "WarehouseOrderLog_createdAt_idx" ON "WarehouseOrderLog"("createdAt");

-- CreateIndex
CREATE INDEX "CurtainRoomDetail_tenantId_idx" ON "CurtainRoomDetail"("tenantId");

-- CreateIndex
CREATE INDEX "CurtainRoomDetail_roomId_idx" ON "CurtainRoomDetail"("roomId");

-- CreateIndex
CREATE INDEX "Alert_alertType_idx" ON "Alert"("alertType");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_isFabric_idx" ON "Product"("isFabric");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundApplication" ADD CONSTRAINT "OutboundApplication_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundApplication" ADD CONSTRAINT "OutboundApplication_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundApplication" ADD CONSTRAINT "OutboundApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundApplication" ADD CONSTRAINT "OutboundApplication_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundApplicationItem" ADD CONSTRAINT "OutboundApplicationItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundApplicationItem" ADD CONSTRAINT "OutboundApplicationItem_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "OutboundApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundApplicationItem" ADD CONSTRAINT "OutboundApplicationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseOrder" ADD CONSTRAINT "WarehouseOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseOrder" ADD CONSTRAINT "WarehouseOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseOrder" ADD CONSTRAINT "WarehouseOrder_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "OutboundApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseOrder" ADD CONSTRAINT "WarehouseOrder_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseOrderItem" ADD CONSTRAINT "WarehouseOrderItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseOrderItem" ADD CONSTRAINT "WarehouseOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "WarehouseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseOrderItem" ADD CONSTRAINT "WarehouseOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseOrderLog" ADD CONSTRAINT "WarehouseOrderLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseOrderLog" ADD CONSTRAINT "WarehouseOrderLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "WarehouseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseOrderLog" ADD CONSTRAINT "WarehouseOrderLog_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurtainRoomDetail" ADD CONSTRAINT "CurtainRoomDetail_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurtainRoomDetail" ADD CONSTRAINT "CurtainRoomDetail_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CurtainRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurtainRoomDetail" ADD CONSTRAINT "CurtainRoomDetail_motorProductId_fkey" FOREIGN KEY ("motorProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurtainRoomDetail" ADD CONSTRAINT "CurtainRoomDetail_fabricProductId_fkey" FOREIGN KEY ("fabricProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
