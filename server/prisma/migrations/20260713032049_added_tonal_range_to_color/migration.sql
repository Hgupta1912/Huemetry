/*
  Warnings:

  - Added the required column `tonalRange` to the `Color` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Color" ADD COLUMN     "tonalRange" VARCHAR(10) NOT NULL;
