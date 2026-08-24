import { buildApplication } from "./app.js";
import { getEnvironment } from "./config/env.js";

const environment = getEnvironment();
const application = await buildApplication();

async function shutdown(signal: string): Promise<void> {
  application.log.info({ signal }, "Shutting down");
  await application.close();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

await application.listen({ host: environment.HOST, port: environment.PORT });
