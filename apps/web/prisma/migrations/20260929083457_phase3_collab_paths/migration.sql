-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "country" TEXT;

-- CreateTable
CREATE TABLE "pack_suggestion" (
    "id" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pack_suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_path_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path_item" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "learning_path_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pack_suggestion_packId_status_idx" ON "pack_suggestion"("packId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "pack_suggestion_packId_resourceId_userId_key" ON "pack_suggestion"("packId", "resourceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_slug_key" ON "learning_path"("slug");

-- CreateIndex
CREATE INDEX "learning_path_reviewStatus_idx" ON "learning_path"("reviewStatus");

-- CreateIndex
CREATE INDEX "learning_path_item_pathId_position_idx" ON "learning_path_item"("pathId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_item_pathId_moduleId_key" ON "learning_path_item"("pathId", "moduleId");

-- CreateIndex
CREATE INDEX "announcement_createdAt_idx" ON "announcement"("createdAt");

-- AddForeignKey
ALTER TABLE "pack_suggestion" ADD CONSTRAINT "pack_suggestion_packId_fkey" FOREIGN KEY ("packId") REFERENCES "pack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_suggestion" ADD CONSTRAINT "pack_suggestion_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_suggestion" ADD CONSTRAINT "pack_suggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path" ADD CONSTRAINT "learning_path_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_item" ADD CONSTRAINT "learning_path_item_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "learning_path"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_item" ADD CONSTRAINT "learning_path_item_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
