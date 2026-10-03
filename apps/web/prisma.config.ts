import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node_modules/.bin/tsx prisma/seed.ts",
  },
  datasource: {
    // generate never connects; tolerate a missing URL so client generation
    // cannot fail on fresh machines. Migrate/seed still require the real URL.
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/placeholder",
  },
});
