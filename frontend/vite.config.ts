import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const repositoryRoot = path.resolve(import.meta.dirname, "..");
  const rootEnvironment = loadEnv(mode, repositoryRoot, "");
  const configuredGoogleClientId =
    rootEnvironment.VITE_GOOGLE_CLIENT_ID || rootEnvironment.GOOGLE_CLIENT_ID || "";
  const googleClientId = configuredGoogleClientId.endsWith(".apps.googleusercontent.com")
    ? configuredGoogleClientId
    : "";

  return {
    define: {
      "import.meta.env.VITE_GOOGLE_CLIENT_ID": JSON.stringify(googleClientId),
    },
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
  };
});
