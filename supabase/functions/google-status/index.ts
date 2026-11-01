import { authenticate, endpoint, rpc } from "../_shared/http.ts";
Deno.serve(
  endpoint(async (req) => {
    const { db } = await authenticate(req, "teacher");
    return await rpc(db, "google_connection_status");
  }),
);
