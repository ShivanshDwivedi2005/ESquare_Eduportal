import { defineConfig } from "prisma/config";

import { loadProjectEnvironment } from "./src/config/bootstrap-environment.ts";

loadProjectEnvironment();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
