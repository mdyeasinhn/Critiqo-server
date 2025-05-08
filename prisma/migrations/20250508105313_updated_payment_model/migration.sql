/*
  Warnings:

  - You are about to drop the column `reviewId` on the `Payment` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_reviewId_fkey";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "reviewId";
