-- AlterUnique: scope taxonomy uniqueness per education system
DROP INDEX "class_level_level_name_key";
CREATE UNIQUE INDEX "class_level_systemId_level_name_key" ON "class_level"("systemId", "level", "name");
DROP INDEX "subject_level_name_key";
CREATE UNIQUE INDEX "subject_systemId_level_name_key" ON "subject"("systemId", "level", "name");
