import { loadProjectEnv } from "./load-project-env";
import globalSetup from "./global-setup";

export default async function liveGlobalSetup() {
  loadProjectEnv();

  if (!process.env.QUESTION_STUDIO_GEMINI_API_KEY?.trim()) {
    throw new Error(
      "Live Gemini tests require QUESTION_STUDIO_GEMINI_API_KEY in .env.local (key missing after env load).",
    );
  }

  process.env.QUESTION_STUDIO_PROVIDER_MODE = "LIVE";
  process.env.QUESTION_STUDIO_DEMO_MODE = "0";
  process.env.NEXT_PUBLIC_QUESTION_STUDIO_DEMO_MODE = "0";

  const demoLabel = process.env.QUESTION_STUDIO_DEMO_MODE === "0" ? "OFF" : "ON";
  console.log("Live Gemini smoke — global setup:");
  console.log(`Database URL configured: ${process.env.DATABASE_URL?.trim() ? "YES" : "NO"}`);
  console.log("Gemini key configured: YES");
  console.log(`Provider mode: ${process.env.QUESTION_STUDIO_PROVIDER_MODE}`);
  console.log(`Demo mode: ${demoLabel}`);

  await globalSetup();
}
