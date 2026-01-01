-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resetOTP" TEXT,
ADD COLUMN     "resetOTPExpiry" TIMESTAMP(3),
ADD COLUMN     "verificationOTP" TEXT,
ADD COLUMN     "verificationOTPExpiry" TIMESTAMP(3);
