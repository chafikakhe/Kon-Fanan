import { AppError, command, type service } from "./http.ts";
import {
  assertEvent,
  calendar,
  type Connection,
  type GoogleEvent,
  meetUrl,
} from "./google.ts";
export type JobContext = {
  job: {
    id: string;
    operation: "create" | "update" | "cancel" | "reconcile";
    requested_revision: number;
    lease_token: string;
    attempt_count: number;
  };
  meeting: {
    id: string;
    status: string;
    revision: number;
    starts_at: string;
    ends_at: string;
    timezone: string;
  };
  announcement: { title: string; body: string };
  integration: {
    google_event_id: string;
    conference_request_id: string;
    google_etag: string | null;
    synced_start: string | null;
    synced_end: string | null;
  } | null;
  connection: Connection | null;
  allowed: boolean;
};
const stamp = (value: string) => new Date(value).getTime();
export async function processJob(
  admin: ReturnType<typeof service>,
  context: JobContext,
): Promise<void> {
  const { job, meeting, connection, integration, announcement } = context;
  const done = (action: string, data: Record<string, unknown> = {}) =>
    command(admin, action, {
      job_id: job.id,
      lease_token: job.lease_token,
      ...data,
    });
  const canPublish =
    context.allowed &&
    meeting.status !== "cancelled" &&
    job.requested_revision === meeting.revision;
  const cancel =
    job.operation === "cancel" ||
    !context.allowed ||
    meeting.status === "cancelled";
  if (!integration) {
    if (cancel) {
      await done("job_finish");
      return;
    }
    throw new AppError(
      "INTEGRATION_MISSING",
      "La séance ne possède pas d’opération Google.",
      422,
    );
  }
  if (!connection || connection.state !== "connected")
    throw new AppError(
      "GOOGLE_RECONNECT_REQUIRED",
      "Reconnectez Google pour synchroniser cette séance.",
      422,
    );
  const path = `/${integration.google_event_id}`;
  const existing = await calendar(admin, connection, path);
  let event: GoogleEvent | null = null;
  if (existing.ok) {
    event = await existing.json();
    assertEvent(event!, meeting.id, integration.google_event_id);
  } else if (![404, 410].includes(existing.status))
    throw new AppError(
      "GOOGLE_EVENT_CONFLICT",
      "Impossible de vérifier l’événement Google.",
      409,
    );
  if (cancel) {
    if (event) {
      const removal = await calendar(admin, connection, path, {
        method: "DELETE",
        headers: event.etag ? { "If-Match": event.etag } : {},
      });
      if (!removal.ok && ![404, 410].includes(removal.status))
        throw new AppError(
          "GOOGLE_EVENT_CONFLICT",
          "L’annulation Google nécessite une vérification.",
          409,
        );
    }
    // If cancellation was required by revocation, SQL schedules/finishes local compensation as needed.
    await done("job_finish");
    return;
  }
  if (!canPublish) {
    await done("job_superseded");
    return;
  }
  const desired = {
    summary: announcement.title,
    description:
      "Séance Kon-fanan. Retrouvez les informations dans votre espace.",
    start: { dateTime: meeting.starts_at, timeZone: meeting.timezone },
    end: { dateTime: meeting.ends_at, timeZone: meeting.timezone },
    extendedProperties: {
      private: {
        konFananMeetingId: meeting.id,
        konFananRevision: String(meeting.revision),
      },
    },
  };
  if (!event) {
    if (job.operation !== "create")
      throw new AppError(
        "GOOGLE_EVENT_REMOVED",
        "L’événement a été supprimé dans Google Calendar. Vérifiez votre agenda.",
        409,
      );
    const created = await calendar(
      admin,
      connection,
      "?conferenceDataVersion=1",
      {
        method: "POST",
        body: JSON.stringify({
          ...desired,
          id: integration.google_event_id,
          conferenceData: {
            createRequest: {
              requestId: integration.conference_request_id,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
        }),
      },
    );
    if (created.status === 409) {
      const found = await calendar(admin, connection, path);
      if (!found.ok)
        throw new AppError(
          "PROVIDER_UNAVAILABLE",
          "Vérification Google en cours.",
          503,
          true,
        );
      event = await found.json();
    } else if (created.ok) event = await created.json();
    else
      throw new AppError(
        "GOOGLE_EVENT_REJECTED",
        "Google n’a pas pu créer cette séance.",
        422,
      );
    assertEvent(event!, meeting.id, integration.google_event_id);
  } else if (event.status === "cancelled")
    throw new AppError(
      "GOOGLE_EVENT_REMOVED",
      "L’événement a été annulé dans Google Calendar.",
      409,
    );
  else if (job.operation === "update") {
    // ETag mismatch reports outside edits instead of overwriting them blindly.
    const alreadyApplied =
      event.extendedProperties?.private?.konFananRevision ===
      String(meeting.revision);
    if (
      !alreadyApplied &&
      integration.google_etag &&
      event.etag !== integration.google_etag
    )
      throw new AppError(
        "GOOGLE_EVENT_CONFLICT",
        "La séance a été modifiée dans Google Calendar. Vérifiez les deux agendas.",
        409,
      );
    if (!alreadyApplied) {
      const updated = await calendar(
        admin,
        connection,
        `${path}?conferenceDataVersion=1`,
        {
          method: "PATCH",
          headers: event.etag ? { "If-Match": event.etag } : {},
          body: JSON.stringify(desired),
        },
      );
      if (!updated.ok)
        throw new AppError(
          "GOOGLE_EVENT_CONFLICT",
          "La modification Google nécessite une vérification.",
          409,
        );
      event = await updated.json();
    }
  } else if (job.operation === "reconcile") {
    if (
      stamp(event.start?.dateTime || "") !== stamp(meeting.starts_at) ||
      stamp(event.end?.dateTime || "") !== stamp(meeting.ends_at)
    )
      throw new AppError(
        "GOOGLE_EVENT_CONFLICT",
        "Les horaires ont été modifiés dans Google Calendar.",
        409,
      );
  }
  const conferenceStatus =
    event?.conferenceData?.createRequest?.status?.statusCode;
  if (conferenceStatus === "failure")
    throw new AppError(
      "GOOGLE_CONFERENCE_FAILED",
      "Google n’a pas pu préparer la conférence.",
      422,
    );
  const url = meetUrl(event!);
  if (!url) {
    await done("job_retry", {
      code: "CONFERENCE_PENDING",
      retry_seconds: Math.min(300, 5 * 2 ** job.attempt_count),
    });
    return;
  }
  await done("job_finish", { meet_url: url, etag: event?.etag });
}
