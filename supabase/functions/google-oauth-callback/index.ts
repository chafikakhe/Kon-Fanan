import {
  AppError,
  appUrl,
  command,
  endpoint,
  env,
  service,
  text,
} from "../_shared/http.ts";
import { decrypt, encrypt, hash } from "../_shared/crypto.ts";
import {
  type Connection,
  type Tokens,
  SCOPE,
  tokenExchange,
  verifyIdentity,
} from "../_shared/google.ts";
Deno.serve(
  endpoint(
    async (req) => {
      const params = new URL(req.url).searchParams;
      const state = text(params.get("state"), 128),
        proof = text(
          req.headers
            .get("cookie")
            ?.split(";")
            .map((x) => x.trim())
            .find((x) => x.startsWith("kf_oauth="))
            ?.slice(9),
          128,
        );
      const admin = service();
      const flow = await command<{ teacher_id: string; nonce: string }>(
        admin,
        "oauth_consume",
        { state_hash: await hash(state), proof_hash: await hash(proof) },
      );
      let status = "connected";
      try {
        if (params.has("error"))
          throw new AppError(
            "OAUTH_DENIED",
            "Autorisation Google refusée.",
            422,
          );
        const token = await tokenExchange({
          code: text(params.get("code"), 4096),
          grant_type: "authorization_code",
          redirect_uri: env("GOOGLE_OAUTH_REDIRECT_URI"),
        });
        if (
          typeof token.id_token !== "string" ||
          typeof token.access_token !== "string"
        )
          throw new AppError(
            "OAUTH_IDENTITY_INVALID",
            "La réponse Google est incomplète.",
            422,
          );
        const identity = await verifyIdentity(token.id_token, flow.nonce);
        const scopes = String(token.scope || "").split(" ");
        if (!scopes.includes(SCOPE))
          throw new AppError(
            "OAUTH_SCOPE_MISSING",
            "L’autorisation Calendar est nécessaire.",
            422,
          );
        const current = await command<Connection | null>(
          admin,
          "connection_get",
          { teacher_id: flow.teacher_id },
        );
        let refresh =
          typeof token.refresh_token === "string" ? token.refresh_token : null;
        if (
          !refresh &&
          current?.google_subject === identity.sub &&
          current.ciphertext
        )
          refresh = (await decrypt<Tokens>(current)).refresh_token;
        if (!refresh)
          throw new AppError(
            "GOOGLE_RECONNECT_REQUIRED",
            "Autorisez à nouveau l’accès à Google.",
            422,
          );
        await command(admin, "connection_save", {
          teacher_id: flow.teacher_id,
          google_subject: identity.sub,
          google_email: identity.email,
          scopes,
          ...(await encrypt({
            access_token: token.access_token,
            refresh_token: refresh,
            expires_at: Date.now() + Number(token.expires_in || 3600) * 1000,
          })),
        });
      } catch (error) {
        status = error instanceof AppError ? error.code : "OAUTH_FAILED";
      }
      const secure = env("GOOGLE_OAUTH_REDIRECT_URI").startsWith("https:")
        ? "; Secure"
        : "";
      return new Response(null, {
        status: 303,
        headers: {
          Location: `${appUrl()}/prof/integrations/google?google=${encodeURIComponent(status)}`,
          "Set-Cookie": `kf_oauth=; Path=/functions/v1/google-oauth-callback; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
        },
      });
    },
    ["GET"],
  ),
);
