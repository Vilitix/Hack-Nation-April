type DebugDetails = Record<string, unknown>;

const enabled =
  process.env.MARKET_DEBUG === "1" ||
  process.env.MARKET_DEBUG === "true" ||
  process.env.NODE_ENV !== "production";

function safeDetails(details?: DebugDetails) {
  if (!details) return "";
  return ` ${JSON.stringify(details, (_key, value) => {
    if (typeof value === "string" && value.length > 180) return `${value.slice(0, 177)}...`;
    return value;
  })}`;
}

export function debugLog(scope: string, message: string, details?: DebugDetails) {
  if (!enabled) return;
  console.log(`[market:${scope}] ${message}${safeDetails(details)}`);
}

export function debugError(scope: string, message: string, error: unknown, details?: DebugDetails) {
  if (!enabled) return;
  const errorDetails =
    error instanceof Error
      ? { name: error.name, message: error.message }
      : { error: String(error) };
  console.error(`[market:${scope}] ${message}${safeDetails({ ...details, ...errorDetails })}`);
}

export async function debugTimed<T>(
  scope: string,
  message: string,
  details: DebugDetails | undefined,
  fn: () => Promise<T>,
) {
  const start = Date.now();
  debugLog(scope, `${message}:start`, details);
  try {
    const result = await fn();
    debugLog(scope, `${message}:ok`, { ...details, durationMs: Date.now() - start });
    return result;
  } catch (error) {
    debugError(scope, `${message}:failed`, error, { ...details, durationMs: Date.now() - start });
    throw error;
  }
}
