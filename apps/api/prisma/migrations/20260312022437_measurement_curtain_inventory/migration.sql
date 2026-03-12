-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "suggestedStockQty" INTEGER DEFAULT 0,
ADD COLUMN     "techCommissionAfterSales" DECIMAL(10,2),
ADD COLUMN     "techCommissionDebug" DECIMAL(10,2),
ADD COLUMN     "techCommissionInstall" DECIMAL(10,2),
ADD COLUMN     "techCommissionMaintenance" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "MeasurementSurvey" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remark" TEXT,
    "mediaUrls" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeasurementSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurtainOrder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "roomCount" INTEGER NOT NULL,
    "deliveryToDoor" BOOLEAN NOT NULL DEFAULT false,
    "deliveryAddress" TEXT,
    "receiverName" TEXT,
    "thirdPartyInstall" BOOLEAN NOT NULL DEFAULT false,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurtainOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurtainRoom" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "curtainOrderId" TEXT NOT NULL,
    "roomName" TEXT NOT NULL,
    "detail" JSONB NOT NULL,
    "mediaUrls" JSONB,
    "remark" TEXT,

    CONSTRAINT "CurtainRoom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeasurementSurvey_tenantId_idx" ON "MeasurementSurvey"("tenantId");

-- CreateIndex
CREATE INDEX "MeasurementSurvey_projectId_idx" ON "MeasurementSurvey"("projectId");

-- CreateIndex
CREATE INDEX "MeasurementSurvey_occurredAt_idx" ON "MeasurementSurvey"("occurredAt");

-- CreateIndex
CREATE INDEX "CurtainOrder_tenantId_idx" ON "CurtainOrder"("tenantId");

-- CreateIndex
CREATE INDEX "CurtainOrder_projectId_idx" ON "CurtainOrder"("projectId");

-- CreateIndex
CREATE INDEX "CurtainOrder_createdAt_idx" ON "CurtainOrder"("createdAt");

-- CreateIndex
CREATE INDEX "CurtainRoom_tenantId_idx" ON "CurtainRoom"("tenantId");

-- CreateIndex
CREATE INDEX "CurtainRoom_curtainOrderId_idx" ON "CurtainRoom"("curtainOrderId");

-- AddForeignKey
ALTER TABLE "MeasurementSurvey" ADD CONSTRAINT "MeasurementSurvey_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementSurvey" ADD CONSTRAINT "MeasurementSurvey_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurtainOrder" ADD CONSTRAINT "CurtainOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurtainOrder" ADD CONSTRAINT "CurtainOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurtainRoom" ADD CONSTRAINT "CurtainRoom_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurtainRoom" ADD CONSTRAINT "CurtainRoom_curtainOrderId_fkey" FOREIGN KEY ("curtainOrderId") REFERENCES "CurtainOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
