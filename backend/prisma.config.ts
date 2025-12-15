// Prisma Configuration
// Note: DATABASE_URL is loaded from root .env file via Docker Compose
// For local development without Docker, use: dotenv -e ../.env

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
