import { authenticate, command, endpoint, env } from "../_shared/http.ts";
import { hash, randomToken } from "../_shared/crypto.ts";
import { checkConfig } from "../_shared/google.ts";
Deno.serve(
  endpoint(async (req) => {
    const { admin, user } = await authenticate(req, "teacher");
    checkConfig();
    const ticket = randomToken();
    await command(admin, "oauth_ticket", {
      teacher_id: user.id,
      token_hash: await hash(ticket),
    });
    return {
      url: `${env("SUPABASE_URL")}/functions/v1/google-oauth-redirect?ticket=${encodeURIComponent(ticket)}`,
    };
  }),
);
