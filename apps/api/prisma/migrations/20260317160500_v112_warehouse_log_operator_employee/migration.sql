-- DropForeignKey
ALTER TABLE "WarehouseOrderLog" DROP CONSTRAINT "WarehouseOrderLog_operatorId_fkey";

-- AddForeignKey
ALTER TABLE "WarehouseOrderLog" ADD CONSTRAINT "WarehouseOrderLog_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

