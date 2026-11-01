import {
  AppError,
  authenticate,
  body,
  endpoint,
  rpc,
  uuid,
} from "../_shared/http.ts";
Deno.serve(
  endpoint(async (req) => {
    const { db } = await authenticate(req),
      input = await body(req);
    const url = await rpc<string>(db, "get_meeting_join_url", {
      p_meeting_id: uuid(input.meetingId),
    });
    if (!/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(url))
      throw new AppError(
        "MEETING_NOT_JOINABLE",
        "Lien de séance indisponible.",
        422,
      );
    return { url };
  }),
);
