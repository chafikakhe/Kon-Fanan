import { AppError, command, endpoint, env, service } from "../_shared/http.ts";
import { constantTimeEqual } from "../_shared/crypto.ts";
import { type JobContext, processJob } from "../_shared/worker.ts";
Deno.serve(
  endpoint(async (req) => {
    const provided = req.headers.get("x-worker-secret") || "";
    if (!(await constantTimeEqual(provided, env("INTEGRATION_WORKER_SECRET"))))
      throw new AppError("ACCESS_DENIED", "Accès non autorisé.", 403);
    const admin = service();
    await command(admin, "schedule_reconciliation");
    let completed = 0,
      failed = 0;
    const started = Date.now();
    for (let i = 0; i < 3 && Date.now() - started < 45000; i++) {
      const context = await command<JobContext | null>(admin, "job_claim");
      if (!context) break;
      try {
        await processJob(admin, context);
        completed++;
      } catch (error) {
        const known = error instanceof AppError;
        await command(
          admin,
          known && !error.retryable ? "job_error" : "job_retry",
          {
            job_id: context.job.id,
            lease_token: context.job.lease_token,
            code: known ? error.code : "PROVIDER_UNAVAILABLE",
            retry_seconds:
              known && error.retryAfter
                ? error.retryAfter
                : Math.min(3600, 15 * 2 ** context.job.attempt_count) +
                  Math.floor(Math.random() * 10),
          },
        );
        failed++;
      }
    }
    // Remove abandoned raw reservations and logically deleted/rejected objects in bounded batches.
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: files } = await admin
      .from("files")
      .select("id,bucket,object_path,status")
      .is("storage_deleted_at", null)
      .or(
        `status.eq.deleted,status.eq.rejected,and(status.eq.pending,created_at.lt.${cutoff})`,
      )
      .limit(20);
    for (const file of files || []) {
      // Recheck and lock against concurrent validation before deleting any object.
      const claimed = await command<{ cleanup?: boolean }>(
        admin,
        "file_cleanup_claim",
        { file_id: file.id },
      );
      if (!claimed.cleanup) continue;
      const paths = file.object_path.endsWith(".validated")
        ? [file.object_path]
        : [file.object_path, file.object_path + ".validated"];
      const { error } = await admin.storage.from(file.bucket).remove(paths);
      await command(admin, "file_cleanup_finish", {
        file_id: file.id,
        success: !error,
      });
    }
    return { processed: completed + failed, completed, failed };
  }),
);
