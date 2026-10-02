-- CreateTable
CREATE TABLE "learner_lesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "basicLevel" INTEGER NOT NULL,
    "classLevelId" TEXT,
    "subjectId" TEXT,
    "topicId" TEXT,
    "sourceRef" TEXT,
    "bodyText" TEXT NOT NULL,
    "fileKey" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learner_lesson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learner_lesson_basicLevel_subjectId_idx" ON "learner_lesson"("basicLevel", "subjectId");

-- CreateIndex
CREATE INDEX "learner_lesson_reviewStatus_idx" ON "learner_lesson"("reviewStatus");

-- AddForeignKey
ALTER TABLE "learner_lesson" ADD CONSTRAINT "learner_lesson_classLevelId_fkey" FOREIGN KEY ("classLevelId") REFERENCES "class_level"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_lesson" ADD CONSTRAINT "learner_lesson_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_lesson" ADD CONSTRAINT "learner_lesson_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
