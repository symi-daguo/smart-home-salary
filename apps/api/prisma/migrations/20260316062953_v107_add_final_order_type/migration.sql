-- AlterTable
ALTER TABLE "OutboundApplication" ADD COLUMN     "finalOrderType" "WarehouseOrderType";

-- AlterTable
ALTER TABLE "WarehouseOrder" ADD COLUMN     "relatedOrderIds" TEXT;
