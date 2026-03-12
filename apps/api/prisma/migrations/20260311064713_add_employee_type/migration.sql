-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "employeeTypeId" TEXT;

-- CreateTable
CREATE TABLE "EmployeeType" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "skillTags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmployeeType_tenantId_idx" ON "EmployeeType"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeType_tenantId_key_key" ON "EmployeeType"("tenantId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeType_tenantId_name_key" ON "EmployeeType"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Employee_employeeTypeId_idx" ON "Employee"("employeeTypeId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_employeeTypeId_fkey" FOREIGN KEY ("employeeTypeId") REFERENCES "EmployeeType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeType" ADD CONSTRAINT "EmployeeType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
