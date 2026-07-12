/*
  Warnings:

  - Added the required column `genre` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "genre" VARCHAR(100) NOT NULL,
ADD COLUMN     "substrate" VARCHAR(100);
