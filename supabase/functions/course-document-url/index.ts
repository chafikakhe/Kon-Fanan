import {
  AppError,
  body,
  endpoint,
  rpc,
  service,
  uuid,
} from "../_shared/http.ts";
// Public read-only resource. The service RPC accepts IDs only and verifies that
// this exact PDF belongs to a currently discoverable published course.
Deno.serve(endpoint(
  async (req) => {
    const input = await body(req), db = service();
    const file = await rpc<{ bucket: string; object_path: string }>(
      db,
      "public_course_document",
      {
        p_course_id: uuid(input.courseId),
        p_file_id: uuid(input.fileId),
      },
    );
    const { data, error } = await db.storage.from(file.bucket).createSignedUrl(
      file.object_path,
      300,
    );
    if (error || !data) {
      throw new AppError(
        "PROVIDER_UNAVAILABLE",
        "Le PDF ne peut pas être ouvert pour le moment.",
        503,
        true,
      );
    }
    return { url: data.signedUrl, expiresIn: 300 };
  },
  ["POST"],
  { publicRead: true },
));
