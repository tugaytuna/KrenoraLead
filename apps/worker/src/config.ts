import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env") });

function requiredEnvironmentValue(name: string, fallbackName?: string) {
  const value = process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function createWorkerDependencies() {
  const supabaseUrl = requiredEnvironmentValue("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnvironmentValue("SUPABASE_SERVICE_ROLE_KEY");
  const googlePlacesApiKey = requiredEnvironmentValue("GOOGLE_PLACES_API_KEY");
  const pollIntervalMs = Math.max(Number(process.env.WORKER_POLL_INTERVAL_MS ?? 5_000), 1_000);
  const runOnce = process.env.WORKER_RUN_ONCE === "true";

  return {
    supabase: createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
    googlePlacesApiKey,
    pollIntervalMs,
    runOnce,
  };
}
