import prisma from "@Batman/db";

const CACHE_TTL_MS = 10_000;

let _settingsCache: {
  data: Awaited<ReturnType<typeof prisma.appSettings.findUnique>>;
  ts: number;
} | null = null;

/** Cached read of the singleton AppSettings row — auth hooks check it on nearly every request. */
export async function getSettings() {
  try {
    if (_settingsCache && Date.now() - _settingsCache.ts < CACHE_TTL_MS) {
      return _settingsCache.data;
    }
    const data = await prisma.appSettings.findUnique({ where: { id: "default" } });
    _settingsCache = { data, ts: Date.now() };
    return data;
  } catch {
    return null;
  }
}

/** Call after writing AppSettings so the next auth check sees the change immediately. */
export function invalidateSettingsCache() {
  _settingsCache = null;
}
