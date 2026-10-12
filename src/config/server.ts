// Server-only configuration. Never import this module into a client component.
export const PUBLIC_ORIGIN = "https://higgsfield-rebuild.rich-bun-3830.chatgpt.site";
export function readServerConfig(values: Record<string, string | undefined> = process.env) {
  const configuredOrigin = values.APP_ORIGIN || PUBLIC_ORIGIN;
  let origin: string | null = null;
  try {
    const u = new URL(configuredOrigin);
    if (!u.username && !u.password && u.pathname === "/" && !u.search && !u.hash &&
        (u.protocol === "https:" || (u.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname)))) origin = u.origin;
  } catch { /* Invalid configuration denies writes. */ }
  const rawBudget = values.GENERATION_BUDGET_USD || "0";
  const parsed = /^(?:0|[1-9]\d{0,5})(?:\.\d{1,6})?$/.test(rawBudget) ? Math.round(Number(rawBudget) * 1_000_000) : 0;
  return { origin, liveEnabled: values.LIVE_GENERATION_ENABLED === "true", budgetMicroUsd: Number.isSafeInteger(parsed) ? parsed : 0, falKey: values.FAL_KEY || null };
}
