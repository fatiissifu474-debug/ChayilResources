-- AlterTable
ALTER TABLE "resource" ADD COLUMN     "submittedById" TEXT;

-- CreateTable
CREATE TABLE "pack" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objectives" TEXT,
    "level" "EducationLevel" NOT NULL,
    "classLevelId" TEXT,
    "subjectId" TEXT,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pack_item" (
    "id" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "pack_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pack_level_classLevelId_subjectId_idx" ON "pack"("level", "classLevelId", "subjectId");

-- CreateIndex
CREATE INDEX "pack_reviewStatus_idx" ON "pack"("reviewStatus");

-- CreateIndex
CREATE INDEX "pack_item_packId_position_idx" ON "pack_item"("packId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "pack_item_packId_resourceId_key" ON "pack_item"("packId", "resourceId");

-- AddForeignKey
ALTER TABLE "resource" ADD CONSTRAINT "resource_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack" ADD CONSTRAINT "pack_classLevelId_fkey" FOREIGN KEY ("classLevelId") REFERENCES "class_level"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack" ADD CONSTRAINT "pack_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack" ADD CONSTRAINT "pack_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_item" ADD CONSTRAINT "pack_item_packId_fkey" FOREIGN KEY ("packId") REFERENCES "pack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_item" ADD CONSTRAINT "pack_item_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
