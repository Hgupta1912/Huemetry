/*
  Warnings:

  - You are about to drop the column `genre` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `substrate` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "genre",
DROP COLUMN "substrate",
ADD COLUMN     "genres" VARCHAR(100)[],
ADD COLUMN     "substrats" TEXT[] DEFAULT ARRAY[]::TEXT[];
