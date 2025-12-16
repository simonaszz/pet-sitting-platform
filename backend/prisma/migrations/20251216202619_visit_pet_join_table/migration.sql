/*
  Warnings:

  - You are about to drop the column `petId` on the `Visit` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "VisitPet" (
    "visitId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,

    CONSTRAINT "VisitPet_pkey" PRIMARY KEY ("visitId","petId")
);

-- Migrate existing data from Visit.petId -> VisitPet
INSERT INTO "VisitPet" ("visitId", "petId")
SELECT "id" AS "visitId", "petId"
FROM "Visit"
WHERE "petId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Visit" DROP CONSTRAINT "Visit_petId_fkey";

-- AlterTable
ALTER TABLE "Visit" DROP COLUMN "petId";

-- CreateIndex
CREATE INDEX "VisitPet_visitId_idx" ON "VisitPet"("visitId");

-- CreateIndex
CREATE INDEX "VisitPet_petId_idx" ON "VisitPet"("petId");

-- AddForeignKey
ALTER TABLE "VisitPet" ADD CONSTRAINT "VisitPet_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitPet" ADD CONSTRAINT "VisitPet_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
