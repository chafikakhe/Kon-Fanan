import { createRemoteJWKSet, jwtVerify } from "npm:jose@6.2.14";
import { AppError, command, env, type service } from "./http.ts";
import { decrypt, encrypt } from "./crypto.ts";
export const SCOPE = "https://www.googleapis.com/auth/calendar.events.owned";
export type Tokens = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};
export type Connection = {
  id: string;
  teacher_id: string;
  google_subject: string;
  google_email: string;
  state: string;
  ciphertext: string;
  iv: string;
  key_version: string;
};
export type GoogleEvent = {
  id: string;
  etag?: string;
  status?: string;
  start?: { dateTime?: string };
  end?: { dateTime?: string };
  extendedProperties?: { private?: Record<string, string> };
  conferenceData?: {
    createRequest?: { status?: { statusCode?: string } };
    entryPoints?: { entryPointType: string; uri: string }[];
  };
};
const jwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);
export function checkConfig(): void {
  env("GOOGLE_CLIENT_ID");
  env("GOOGLE_CLIENT_SECRET");
  env("GOOGLE_OAUTH_REDIRECT_URI");
  env("GOOGLE_TOKEN_ENCRYPTION_KEY");
}
export async function verifyIdentity(
  idToken: string,
  nonce: string,
): Promise<{ sub: string; email: string }> {
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: env("GOOGLE_CLIENT_ID"),
    algorithms: ["RS256"],
  });
  if (
    payload.nonce !== nonce ||
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    payload.email_verified !== true
  )
    throw new AppError(
      "OAUTH_IDENTITY_INVALID",
      "L’identité Google n’a pas pu être vérifiée.",
      403,
    );
  return { sub: payload.sub, email: payload.email };
}
export async function tokenExchange(
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      ...params,
      client_id: env("GOOGLE_CLIENT_ID"),
      client_secret: env("GOOGLE_CLIENT_SECRET"),
    }),
    signal: AbortSignal.timeout(12000),
  });
  const result = await response.json();
  if (!response.ok)
    throw new AppError(
      result.error === "invalid_grant"
        ? "GOOGLE_RECONNECT_REQUIRED"
        : "PROVIDER_UNAVAILABLE",
      "Google n’a pas pu confirmer la connexion. Réessayez depuis Kon-fanan.",
      result.error === "invalid_grant" ? 422 : 502,
      response.status >= 500,
    );
  return result;
}
export async function accessToken(
  admin: ReturnType<typeof service>,
  connection: Connection,
  force = false,
): Promise<string> {
  const tokens = await decrypt<Tokens>(connection);
  if (!force && tokens.expires_at > Date.now() + 60000)
    return tokens.access_token;
  try {
    const fresh = await tokenExchange({
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
    });
    if (typeof fresh.access_token !== "string")
      throw new AppError(
        "GOOGLE_RECONNECT_REQUIRED",
        "Reconnectez votre compte Google.",
        422,
      );
    const next: Tokens = {
      access_token: fresh.access_token,
      refresh_token:
        typeof fresh.refresh_token === "string"
          ? fresh.refresh_token
          : tokens.refresh_token,
      expires_at: Date.now() + Number(fresh.expires_in || 3600) * 1000,
    };
    await command(admin, "tokens_update", {
      connection_id: connection.id,
      ...(await encrypt(next)),
    });
    return next.access_token;
  } catch (error) {
    if (error instanceof AppError && error.code === "GOOGLE_RECONNECT_REQUIRED")
      await command(admin, "connection_error", {
        connection_id: connection.id,
      });
    throw error;
  }
}
export async function calendar(
  admin: ReturnType<typeof service>,
  connection: Connection,
  path: string,
  init: RequestInit = {},
  retried = false,
): Promise<Response> {
  const token = await accessToken(admin, connection, retried);
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
      signal: AbortSignal.timeout(12000),
    },
  );
  if (response.status === 401 && !retried)
    return calendar(admin, connection, path, init, true);
  if (response.status === 401) {
    await command(admin, "connection_error", { connection_id: connection.id });
    throw new AppError(
      "GOOGLE_RECONNECT_REQUIRED",
      "Reconnectez votre compte Google.",
      422,
    );
  }
  const retryHeader = response.headers.get("Retry-After");
  const retryAfter = retryHeader
    ? /^\d+$/.test(retryHeader)
      ? Number(retryHeader)
      : Math.ceil((Date.parse(retryHeader) - Date.now()) / 1000)
    : undefined;
  if (response.status === 429 || response.status >= 500)
    throw new AppError(
      "PROVIDER_UNAVAILABLE",
      "Google est momentanément indisponible.",
      503,
      true,
      retryAfter && retryAfter > 0 ? Math.min(retryAfter, 3600) : undefined,
    );
  if (response.status === 403) {
    let reason = "";
    try {
      const payload = await response.clone().json();
      reason =
        payload.error?.errors?.[0]?.reason || payload.error?.status || "";
    } catch {}
    if (/quota|rateLimit|RESOURCE_EXHAUSTED|dailyLimit/i.test(reason))
      throw new AppError(
        "GOOGLE_QUOTA_EXCEEDED",
        "Le quota Google est temporairement atteint.",
        429,
        true,
        retryAfter && retryAfter > 0 ? Math.min(retryAfter, 3600) : undefined,
      );
    throw new AppError(
      "GOOGLE_PERMISSION_DENIED",
      "Google a refusé cette opération. Vérifiez les autorisations de votre compte.",
      422,
    );
  }
  return response;
}
export function meetUrl(event: GoogleEvent): string | null {
  const raw = event.conferenceData?.entryPoints?.find(
    (p) => p.entryPointType === "video",
  )?.uri;
  if (!raw) return null;
  const url = new URL(raw);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "meet.google.com" ||
    !/^\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(url.pathname) ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash
  )
    throw new AppError(
      "PROVIDER_RESPONSE_INVALID",
      "Le lien de séance n’a pas pu être validé.",
      502,
    );
  return url.href;
}
export function assertEvent(
  event: GoogleEvent,
  meetingId: string,
  eventId: string,
): void {
  if (
    event.id !== eventId ||
    event.extendedProperties?.private?.konFananMeetingId !== meetingId
  )
    throw new AppError(
      "GOOGLE_EVENT_CONFLICT",
      "L’événement Google ne correspond pas à cette séance.",
      409,
    );
}
