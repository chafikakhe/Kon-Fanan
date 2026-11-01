import {
  createClient,
  type SupabaseClient,
  type User,
} from "npm:@supabase/supabase-js@2.118.0";

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public retryable = false,
    public retryAfter?: number,
  ) {
    super(message);
  }
}
export function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value)
    throw new AppError(
      "INTEGRATION_NOT_CONFIGURED",
      "Cette intégration doit être configurée par l’administration.",
      503,
    );
  return value;
}
export function appUrl(): string {
  return env("APP_BASE_URL").replace(/\/$/, "");
}
export function service(): SupabaseClient {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function authenticate(
  req: Request,
  role?: string,
): Promise<{ user: User; db: SupabaseClient; admin: SupabaseClient }> {
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer "))
    throw new AppError("AUTH_REQUIRED", "Connectez-vous pour continuer.", 401);
  const db = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.auth.getUser(authorization.slice(7));
  if (error || !data.user)
    throw new AppError("AUTH_REQUIRED", "Votre session a expiré.", 401);
  const access = await db
    .from("account_access")
    .select("role,status")
    .eq("user_id", data.user.id)
    .single();
  if (
    access.error ||
    access.data?.status !== "active" ||
    (role && access.data.role !== role)
  )
    throw new AppError(
      "ACCESS_DENIED",
      "Cette action n’est pas disponible pour ce compte.",
      403,
    );
  return { user: data.user, db, admin: service() };
}
export async function body(req: Request): Promise<Record<string, unknown>> {
  if (Number(req.headers.get("content-length") || 0) > 65536)
    throw new AppError("INVALID_REQUEST", "Requête trop volumineuse.", 413);
  try {
    const raw = await req.text();
    if (raw.length > 65536) throw new Error();
    const value = JSON.parse(raw || "{}");
    if (!value || Array.isArray(value) || typeof value !== "object")
      throw new Error();
    return value;
  } catch {
    throw new AppError("INVALID_REQUEST", "La requête est invalide.");
  }
}
export async function rpc<T = unknown>(
  db: SupabaseClient,
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await db.rpc(name, args);
  if (error) {
    const code =
      /\b(ACCESS_DENIED|AUTH_REQUIRED|VERSION_CONFLICT|IDEMPOTENCY_CONFLICT|GOOGLE_RECONNECT_REQUIRED|ACCOUNT_CHANGE_BLOCKED|FILE_TOO_LARGE|FILE_INVALID|DEADLINE_PASSED|INVALID_REQUEST|RESOURCE_NOT_FOUND|RATE_LIMITED|MEETING_NOT_JOINABLE|OAUTH_FLOW_INVALID|WORKER_LEASE_LOST)\b/.exec(
        error.message,
      )?.[1] || "OPERATION_FAILED";
    const status = code.includes("CONFLICT")
      ? 409
      : code === "AUTH_REQUIRED"
        ? 401
        : code === "ACCESS_DENIED"
          ? 403
          : code === "RESOURCE_NOT_FOUND"
            ? 404
            : code === "RATE_LIMITED"
              ? 429
              : 422;
    throw new AppError(code, publicMessage(code), status, status === 429);
  }
  return data as T;
}
export function publicMessage(code: string): string {
  const messages: Record<string, string> = {
    ACCESS_DENIED: "Vous n’avez plus accès à cette ressource.",
    AUTH_REQUIRED: "Connectez-vous pour continuer.",
    VERSION_CONFLICT: "La ressource a changé. Actualisez avant de réessayer.",
    IDEMPOTENCY_CONFLICT:
      "Cette opération a déjà été utilisée pour une autre modification.",
    GOOGLE_RECONNECT_REQUIRED:
      "Reconnectez votre compte Google pour continuer.",
    ACCOUNT_CHANGE_BLOCKED:
      "Annulez ou terminez les séances liées au précédent compte Google avant de changer de compte.",
    FILE_TOO_LARGE: "Le fichier ou le total dépasse la limite autorisée.",
    FILE_INVALID: "Ce fichier ne peut pas être accepté.",
    DEADLINE_PASSED: "Le délai de remise est dépassé.",
    RESOURCE_NOT_FOUND: "La ressource est indisponible.",
    RATE_LIMITED: "Trop de tentatives. Réessayez dans quelques minutes.",
    MEETING_NOT_JOINABLE: "La séance n’est pas accessible à cet horaire.",
    OAUTH_FLOW_INVALID:
      "Ce lien de connexion est expiré ou invalide. Recommencez depuis Kon-fanan.",
  };
  return (
    messages[code] ||
    "L’opération n’a pas pu être effectuée. Actualisez puis réessayez."
  );
}
export async function command<T = unknown>(
  db: SupabaseClient,
  action: string,
  data: Record<string, unknown> = {},
): Promise<T> {
  return rpc<T>(db, "integration_command", { p_action: action, p_data: data });
}
export function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const allowed = Deno.env.get("APP_BASE_URL") ? new URL(appUrl()).origin : "";
  return {
    ...(origin === allowed ? { "Access-Control-Allow-Origin": allowed } : {}),
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info, x-worker-secret",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    Vary: "Origin",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
}
export function endpoint(
  handler: (req: Request) => Promise<unknown>,
  methods = ["POST"],
  options: { publicRead?: boolean } = {},
): (req: Request) => Promise<Response> {
  return async (req) => {
    const headers = options.publicRead
        ? { ...cors(req), "Access-Control-Allow-Origin": "*" }
        : cors(req),
      requestId = crypto.randomUUID();
    if (req.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    try {
      if (!methods.includes(req.method))
        throw new AppError("METHOD_NOT_ALLOWED", "Méthode indisponible.", 405);
      if (
        !options.publicRead &&
        req.headers.get("Origin") &&
        req.headers.get("Origin") !== new URL(appUrl()).origin
      )
        throw new AppError("ACCESS_DENIED", "Origine non autorisée.", 403);
      const result = await handler(req);
      if (result instanceof Response) return result;
      return Response.json({ data: result, requestId }, { headers });
    } catch (error) {
      const known = error instanceof AppError;
      // Never log provider bodies, tokens, personal data or submitted work.
      console.error(
        JSON.stringify({
          requestId,
          code: known ? error.code : "INTERNAL_ERROR",
        }),
      );
      return Response.json(
        {
          error: {
            code: known ? error.code : "INTERNAL_ERROR",
            message: known
              ? error.message
              : "Une erreur est survenue. Réessayez plus tard.",
            retryable: known ? error.retryable : true,
          },
          requestId,
        },
        { status: known ? error.status : 500, headers },
      );
    }
  };
}
export function text(value: unknown, max = 500): string {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new AppError("INVALID_REQUEST", "Un champ requis est invalide.");
  return value.trim();
}
export function uuid(value: unknown): string {
  const s = text(value, 36);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
  )
    throw new AppError("INVALID_REQUEST", "Identifiant invalide.");
  return s;
}
export function integer(
  value: unknown,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > max
  )
    throw new AppError("INVALID_REQUEST", "Nombre invalide.");
  return value;
}
