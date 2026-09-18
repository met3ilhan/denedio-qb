import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_QUESTION_STUDIO_DEMO_MODE:
      process.env.QUESTION_STUDIO_DEMO_MODE ?? process.env.NEXT_PUBLIC_QUESTION_STUDIO_DEMO_MODE ?? "1",
  },
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    serverActions: {
      bodySizeLimit: "32mb",
    },
  },
};

export default nextConfig;
