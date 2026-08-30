import { resolveWorkspaceContext } from "@krenora/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getAuthenticatedWorkspace(client: SupabaseClient) {
  const { data, error } = await client.auth.getClaims();
  const actorUserId = data?.claims?.sub;
  if (error || !actorUserId) throw new Error("Aktif oturum bulunamadı.");
  return resolveWorkspaceContext(client, actorUserId);
}
