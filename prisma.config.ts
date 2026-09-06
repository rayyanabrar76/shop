import "dotenv/config"
import { defineConfig, env } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // The CLI only. Migrations take a Postgres advisory lock, and a connection
    // pooler cannot hold one — through the pooled URL every migrate command
    // fails with P1002 "timed out trying to acquire a postgres advisory lock",
    // which is what broke the deploy once the build started running them.
    // The running app still connects through the pooled DATABASE_URL.
    url: process.env.DIRECT_URL || env("DATABASE_URL"),
  },
})