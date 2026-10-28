import { env } from "@Batman/env/server";

import { getSettings } from "./settings-cache";

export async function getGoogleCredentials() {
  const settings = await getSettings();
  const clientId = settings?.googleClientId || env.GOOGLE_CLIENT_ID;
  const clientSecret = settings?.googleClientSecret || env.GOOGLE_CLIENT_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}
