import fs from "node:fs";
import path from "node:path";

/** Load `.env.local` into process.env without logging values. */
export function loadDotenvLocal(cwd = process.cwd()) {
  const file = path.join(cwd, ".env.local");
  if (!fs.existsSync(file)) {
    return { loaded: false, keys: [] };
  }
  const text = fs.readFileSync(file, "utf8");
  const keys = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env) || process.env[key] === "") {
      process.env[key] = value;
    }
    keys.push(key);
  }
  return { loaded: true, keys };
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  const { loaded, keys } = loadDotenvLocal();
  console.log(loaded ? `Loaded ${keys.length} keys from .env.local` : "No .env.local found");
}
