-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "task" TEXT;
