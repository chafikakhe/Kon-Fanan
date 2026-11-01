import {
  authenticate,
  body,
  endpoint,
  integer,
  rpc,
  text,
  uuid,
} from "./http.ts";
import { checkConfig } from "./google.ts";
export function meetingHandler(operation: "create" | "update" | "cancel") {
  return endpoint(async (req) => {
    const { db } = await authenticate(
        req,
        operation === "cancel" ? undefined : "teacher",
      ),
      input = await body(req);
    if (operation !== "cancel") checkConfig();
    return await rpc(db, "queue_meeting_operation", {
      p_meeting_id: uuid(input.meetingId),
      p_operation: operation,
      p_expected_version: integer(input.expectedVersion),
      p_idempotency_key: text(input.idempotencyKey, 128),
      p_changes: operation === "update" ? input.changes || {} : {},
    });
  });
}
