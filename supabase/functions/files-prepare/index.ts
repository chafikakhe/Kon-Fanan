import {
  authenticate,
  body,
  endpoint,
  integer,
  rpc,
  text,
  uuid,
  AppError,
} from "../_shared/http.ts";
import { fileLimit } from "../_shared/file-rules.ts";
Deno.serve(
  endpoint(async (req) => {
    const { db } = await authenticate(req),
      input = await body(req);
    const targetType = text(input.targetType),
      mime = text(input.mimeType),
      size = integer(input.sizeBytes);
    if (
      ![
        "submission_version",
        "course",
        "exercise",
        "competition",
        "announcement",
      ].includes(targetType) ||
      !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
        mime,
      )
    )
      throw new AppError("FILE_INVALID", "Format non accepté.", 422);
    if (size > fileLimit(mime, targetType))
      throw new AppError(
        "FILE_TOO_LARGE",
        "Ce fichier dépasse la limite autorisée.",
        413,
      );
    return await rpc(db, "reserve_file", {
      p_target_type: targetType,
      p_target_id: uuid(input.targetId),
      p_name: text(input.originalName, 255),
      p_mime: mime,
      p_size: size,
    });
  }),
);
