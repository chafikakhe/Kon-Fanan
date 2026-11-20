import { endpoint } from "../_shared/http.ts";
import { createTeacher } from "../_shared/teacher-account.ts";

Deno.serve(endpoint(createTeacher));
