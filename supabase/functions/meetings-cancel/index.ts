import { meetingHandler } from "../_shared/meeting-handler.ts";
Deno.serve(meetingHandler("cancel"));
