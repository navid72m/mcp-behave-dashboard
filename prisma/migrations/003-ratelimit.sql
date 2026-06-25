-- AlterTable
ALTER TABLE "ApiToken" ADD COLUMN "rateLimitWindowStart" DATETIME;
ALTER TABLE "ApiToken" ADD COLUMN "rateLimitCount" INTEGER NOT NULL DEFAULT 0;
