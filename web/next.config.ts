import type { NextConfig } from "next";
import { withFaustine } from "@faustine-ai/next";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  // Native SQLite driver: keep it out of the server bundle and load it from node_modules.
  serverExternalPackages: ["@libsql/client", "libsql"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// Exposes the build commit to the Faustine handler so the portal shows which commit runs.
export default withFaustine(nextConfig);
