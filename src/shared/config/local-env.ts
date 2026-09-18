/** Safe defaults for local V1 when `.env.local` was not created yet (see README). */
const LOCAL_DEFAULT_DATABASE_URL =
  "postgresql://question_studio:question_studio@localhost:5433/question_studio";

export function ensureLocalDevelopmentDefaults(): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  if (!process.env.DATABASE_URL?.trim()) {
    process.env.DATABASE_URL = LOCAL_DEFAULT_DATABASE_URL;
  }
  const demoModeKey = "QUESTION_STUDIO_DEMO_MODE";
  const publicDemoKey = "NEXT_PUBLIC_QUESTION_STUDIO_DEMO_MODE";
  if (!process.env[demoModeKey]?.trim() && !process.env[publicDemoKey]?.trim()) {
    process.env[demoModeKey] = "1";
    process.env[publicDemoKey] = "1";
  }
}
