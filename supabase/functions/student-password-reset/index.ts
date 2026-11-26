import { endpoint } from "../_shared/http.ts";
import { resetStudentPassword } from "../_shared/student-account.ts";

Deno.serve(endpoint(resetStudentPassword));
