-- CreateTable
CREATE TABLE "discussion_post" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tag" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discussion_post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discussion_reply" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discussion_reply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "discussion_post_createdAt_idx" ON "discussion_post"("createdAt");

-- CreateIndex
CREATE INDEX "discussion_reply_postId_createdAt_idx" ON "discussion_reply"("postId", "createdAt");

-- AddForeignKey
ALTER TABLE "discussion_post" ADD CONSTRAINT "discussion_post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_reply" ADD CONSTRAINT "discussion_reply_postId_fkey" FOREIGN KEY ("postId") REFERENCES "discussion_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_reply" ADD CONSTRAINT "discussion_reply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
