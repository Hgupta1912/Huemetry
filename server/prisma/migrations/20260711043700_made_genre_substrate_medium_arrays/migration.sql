/*
  Warnings:

  - The `genre` column on the `Project` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `substrate` column on the `Project` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "genre",
ADD COLUMN     "genre" VARCHAR(100)[],
DROP COLUMN "substrate",
ADD COLUMN     "substrate" VARCHAR(100)[];
