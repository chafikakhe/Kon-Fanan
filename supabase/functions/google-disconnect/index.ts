import { authenticate, command, endpoint } from "../_shared/http.ts";
import { decrypt } from "../_shared/crypto.ts";
import { type Connection, type Tokens } from "../_shared/google.ts";
Deno.serve(
  endpoint(async (req) => {
    const { admin, user } = await authenticate(req, "teacher");
    const conn = await command<Connection | null>(admin, "connection_get", {
      teacher_id: user.id,
    });
    let revocationSucceeded = false;
    try {
      if (conn?.ciphertext) {
        const tokens = await decrypt<Tokens>(conn);
        const response = await fetch("https://oauth2.googleapis.com/revoke", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ token: tokens.refresh_token }),
          signal: AbortSignal.timeout(10000),
        });
        revocationSucceeded = response.ok;
      }
    } catch {
      /* Local secrets are removed even when provider revocation is unavailable. */
    }
    await command(admin, "connection_disconnect", { teacher_id: user.id });
    return { state: "disconnected", revocationSucceeded };
  }),
);
