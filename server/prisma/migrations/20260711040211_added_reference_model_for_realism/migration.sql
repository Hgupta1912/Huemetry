-- DropForeignKey
ALTER TABLE "Color" DROP CONSTRAINT "Color_artSessionId_fkey";

-- AlterTable
ALTER TABLE "Color" ADD COLUMN     "referenceId" INTEGER,
ALTER COLUMN "artSessionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "isRealism" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Reference" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "imageUrl" VARCHAR(500) NOT NULL,

    CONSTRAINT "Reference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reference_projectId_key" ON "Reference"("projectId");

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Color" ADD CONSTRAINT "Color_artSessionId_fkey" FOREIGN KEY ("artSessionId") REFERENCES "ArtSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Color" ADD CONSTRAINT "Color_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "Reference"("id") ON DELETE SET NULL ON UPDATE CASCADE;
