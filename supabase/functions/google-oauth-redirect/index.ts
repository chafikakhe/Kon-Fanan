import { command, endpoint, env, service, text } from "../_shared/http.ts";
import { hash, randomToken } from "../_shared/crypto.ts";
import { checkConfig, SCOPE } from "../_shared/google.ts";
Deno.serve(
  endpoint(
    async (req) => {
      checkConfig();
      const ticket = text(new URL(req.url).searchParams.get("ticket"), 128);
      const state = randomToken(),
        proof = randomToken(),
        nonce = randomToken();
      await command(service(), "oauth_redirect", {
        ticket_hash: await hash(ticket),
        state_hash: await hash(state),
        proof_hash: await hash(proof),
        nonce,
      });
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.search = new URLSearchParams({
        client_id: env("GOOGLE_CLIENT_ID"),
        redirect_uri: env("GOOGLE_OAUTH_REDIRECT_URI"),
        response_type: "code",
        scope: `openid email ${SCOPE}`,
        access_type: "offline",
        prompt: "consent",
        state,
        nonce,
      }).toString();
      const secure = env("GOOGLE_OAUTH_REDIRECT_URI").startsWith("https:")
        ? "; Secure"
        : "";
      return new Response(null, {
        status: 303,
        headers: {
          Location: url.href,
          "Set-Cookie": `kf_oauth=${proof}; Path=/functions/v1/google-oauth-callback; HttpOnly; SameSite=Lax; Max-Age=600${secure}`,
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
        },
      });
    },
    ["GET"],
  ),
);
