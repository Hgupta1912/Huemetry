-- AlterTable
ALTER TABLE "ArtSession" ADD COLUMN     "comparedToReference" JSONB;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "isMonochrome" BOOLEAN NOT NULL DEFAULT false;
