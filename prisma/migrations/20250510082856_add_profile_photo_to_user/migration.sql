-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "reviewId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profilePhoto" TEXT;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;
