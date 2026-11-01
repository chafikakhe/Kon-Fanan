import {
  AppError,
  authenticate,
  body,
  command,
  endpoint,
  rpc,
  uuid,
} from "../_shared/http.ts";
import { fileLimit, normalizeFile } from "../_shared/files.ts";
Deno.serve(
  endpoint(async (req) => {
    const { db, admin, user } = await authenticate(req),
      input = await body(req),
      fileId = uuid(input.fileId);
    const result = await admin
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("owner_id", user.id)
      .single();
    const file = result.data;
    if (result.error || !file)
      throw new AppError("RESOURCE_NOT_FOUND", "Fichier indisponible.", 404);
    if (
      !(await rpc(db, "can_manage_file_target", {
        p_target_type: file.target_type,
        p_target_id: file.target_id,
      }))
    )
      throw new AppError(
        "ACCESS_DENIED",
        "Ce fichier n’est plus modifiable.",
        403,
      );
    const lease = await command<{ ready?: boolean; lease_token?: string }>(
      admin,
      "file_claim",
      { file_id: fileId, owner_id: user.id },
    );
    if (lease.ready) return file;
    try {
      const { data: blob, error } = await admin.storage
        .from(file.bucket)
        .download(file.object_path);
      if (error || !blob)
        throw new AppError(
          "UPLOAD_INCOMPLETE",
          "Le fichier n’est pas encore entièrement envoyé. Réessayez.",
          422,
          true,
        );
      if (
        blob.size !== file.size_bytes ||
        blob.size > fileLimit(file.mime_type, file.target_type)
      )
        throw new AppError(
          "FILE_INVALID",
          "La taille réelle du fichier ne correspond pas à la réservation.",
          422,
        );
      const normalized = await normalizeFile(
        new Uint8Array(await blob.arrayBuffer()),
        file.mime_type,
      );
      if (normalized.length > fileLimit(file.mime_type, file.target_type))
        throw new AppError(
          "FILE_TOO_LARGE",
          "Le fichier normalisé dépasse la limite autorisée.",
          413,
        );
      const upload = await admin.storage
        .from(file.bucket)
        .upload(file.object_path + ".validated", normalized, {
          contentType: file.mime_type,
          upsert: true,
          cacheControl: "0",
        });
      if (upload.error)
        throw new AppError(
          "PROVIDER_UNAVAILABLE",
          "Le fichier n’a pas pu être validé. Réessayez.",
          503,
          true,
        );
      const ready = await rpc(admin, "finalize_file", {
        p_file_id: fileId,
        p_size: normalized.length,
        p_mime: file.mime_type,
        p_object_path: file.object_path + ".validated",
      });
      await admin.storage.from(file.bucket).remove([file.object_path]);
      return ready;
    } catch (error) {
      if (
        error instanceof AppError &&
        ["FILE_INVALID", "FILE_TOO_LARGE"].includes(error.code)
      ) {
        await admin
          .from("files")
          .update({ status: "rejected" })
          .eq("id", fileId)
          .eq("status", "pending");
        await admin.storage.from(file.bucket).remove([file.object_path]);
      }
      throw error;
    } finally {
      await command(admin, "file_release", {
        file_id: fileId,
        lease_token: lease.lease_token,
      });
    }
  }),
);
