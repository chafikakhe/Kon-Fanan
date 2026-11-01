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
    const { db, admin } = await authenticate(req),
      input = await body(req),
      fileId = uuid(input.fileId);
    if (!(await rpc(db, "can_read_file", { p_file_id: fileId })))
      throw new AppError(
        "ACCESS_DENIED",
        "Ce fichier n’est plus accessible.",
        403,
      );
    const { data: file, error } = await admin
      .from("files")
      .select("bucket,object_path,status,original_name,mime_type")
      .eq("id", fileId)
      .single();
    if (error || !file || file.status !== "ready")
      throw new AppError("RESOURCE_NOT_FOUND", "Fichier indisponible.", 404);
    const expiresIn = file.bucket === "student-submissions" ? 120 : 300;
    const { data, error: signError } = await admin.storage
      .from(file.bucket)
      .createSignedUrl(file.object_path, expiresIn, undefined);
    if (signError || !data)
      throw new AppError(
        "PROVIDER_UNAVAILABLE",
        "Le fichier ne peut pas être ouvert pour le moment.",
        503,
        true,
      );
    return { url: data.signedUrl, expiresIn };
  }),
);
