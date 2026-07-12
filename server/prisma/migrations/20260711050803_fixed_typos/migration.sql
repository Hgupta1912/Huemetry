/*
  Warnings:

  - You are about to drop the column `substrats` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "substrats",
ADD COLUMN     "substrates" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "genres" SET DATA TYPE TEXT[];
