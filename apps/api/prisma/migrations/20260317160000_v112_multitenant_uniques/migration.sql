-- DropIndex
DROP INDEX "OutboundApplication_orderNo_key";

-- DropIndex
DROP INDEX "WarehouseOrder_orderNo_key";

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_tenantId_productId_key" ON "Inventory"("tenantId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "OutboundApplication_tenantId_orderNo_key" ON "OutboundApplication"("tenantId", "orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseOrder_tenantId_orderNo_key" ON "WarehouseOrder"("tenantId", "orderNo");

