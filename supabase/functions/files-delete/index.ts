import {
  authenticate,
  body,
  endpoint,
  rpc,
  uuid,
  AppError,
} from "../_shared/http.ts";
Deno.serve(
  endpoint(async (req) => {
    const { db, admin } = await authenticate(req),
      input = await body(req);
    const file = await rpc<{ bucket: string; object_path: string }>(
      db,
      "delete_draft_file",
      { p_file_id: uuid(input.fileId) },
    );
    const { error } = await admin.storage
      .from(file.bucket)
      .remove([file.object_path]);
    if (error)
      throw new AppError(
        "CLEANUP_PENDING",
        "Le fichier a été retiré du brouillon. Son nettoyage sera repris automatiquement.",
        503,
        true,
      );
    return { deleted: true };
  }),
);
