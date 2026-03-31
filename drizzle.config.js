import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./server/src/db/schema.js",
  out: "./server/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
