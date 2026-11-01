import {
  detectMime,
  normalizeFile,
  fileLimit,
} from "../../supabase/functions/_shared/files.ts";
import {
  encrypt,
  decrypt,
  constantTimeEqual,
  randomToken,
} from "../../supabase/functions/_shared/crypto.ts";
import {
  assertEvent,
  meetUrl,
} from "../../supabase/functions/_shared/google.ts";
import { AppError, endpoint } from "../../supabase/functions/_shared/http.ts";
import { PDFDocument, PDFName } from "npm:pdf-lib@1.17.1";
const assert = (v: unknown, m = "Assertion failed") => {
  if (!v) throw Error(m);
};
async function rejects(fn: () => unknown | Promise<unknown>) {
  let rejected = false;
  try {
    await fn();
  } catch {
    rejected = true;
  }
  assert(rejected, "Expected rejection");
}
Deno.test(
  "chiffrement authentifié, IV uniques et détection des altérations",
  async () => {
    Deno.env.set("GOOGLE_TOKEN_ENCRYPTION_KEY", btoa("a".repeat(32)));
    Deno.env.set("GOOGLE_TOKEN_ENCRYPTION_KEY_VERSION", "v1");
    const a = await encrypt({ refresh_token: "fixture-secret" }),
      b = await encrypt({ refresh_token: "fixture-secret" });
    assert(a.iv !== b.iv && a.ciphertext !== b.ciphertext);
    assert(
      (await decrypt<{ refresh_token: string }>(a)).refresh_token ===
        "fixture-secret",
    );
    await rejects(() => decrypt({ ...a, ciphertext: b.ciphertext }));
    assert(await constantTimeEqual("x", "x"));
    assert(!(await constantTimeEqual("x", "y")));
    assert(randomToken().length >= 40);
  },
);
Deno.test("liens Meet et identité événement strictement validés", async () => {
  assert(
    meetUrl({
      id: "x",
      conferenceData: {
        entryPoints: [
          {
            entryPointType: "video",
            uri: "https://meet.google.com/abc-defg-hij",
          },
        ],
      },
    }) === "https://meet.google.com/abc-defg-hij",
  );
  assert(meetUrl({ id: "x" }) === null);
  await rejects(() =>
    meetUrl({
      id: "x",
      conferenceData: {
        entryPoints: [
          {
            entryPointType: "video",
            uri: "https://meet.google.com.attacker.test/abc-defg-hij",
          },
        ],
      },
    }),
  );
  await rejects(() =>
    assertEvent(
      {
        id: "x",
        extendedProperties: { private: { konFananMeetingId: "wrong" } },
      },
      "expected",
      "x",
    ),
  );
});
Deno.test("MIME falsifié et image corrompue refusés", async () => {
  const html = new TextEncoder().encode(
    "<html><script>alert(1)</script></html>",
  );
  assert(detectMime(html) === null);
  await rejects(() => normalizeFile(html, "image/png"));
  await rejects(() =>
    normalizeFile(
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]),
      "image/png",
    ),
  );
  assert(fileLimit("image/jpeg", "submission_version") === 10485760);
  assert(fileLimit("application/pdf", "submission_version") === 20971520);
});
Deno.test(
  "reconstruction PDF enlève les actions et les annotations",
  async () => {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage();
    page.drawText("Fixture pedagogique");
    pdf.catalog.set(
      PDFName.of("OpenAction"),
      pdf.context.obj({ S: "JavaScript", JS: "app.alert(1)" }),
    );
    page.node.set(PDFName.of("Annots"), pdf.context.obj([]));
    const clean = await PDFDocument.load(
      await normalizeFile(await pdf.save(), "application/pdf"),
    );
    assert(clean.getPageCount() === 1);
    assert(!clean.catalog.has(PDFName.of("OpenAction")));
    assert(!clean.getPage(0).node.has(PDFName.of("Annots")));
  },
);
Deno.test(
  "erreurs HTTP normalisées sans détail interne et origine contrôlée",
  async () => {
    Deno.env.set("APP_BASE_URL", "https://konfanan.test");
    const handler = endpoint(async () => {
      throw new Error("database-secret");
    });
    const response = await handler(
      new Request("https://backend.test", {
        method: "POST",
        headers: { Origin: "https://konfanan.test" },
      }),
    );
    const json = await response.json();
    assert(response.status === 500);
    assert(!JSON.stringify(json).includes("database-secret"));
    assert(
      response.headers.get("access-control-allow-origin") ===
        "https://konfanan.test",
    );
    const rejected = await endpoint(async () => ({ ok: true }))(
      new Request("https://backend.test", {
        method: "POST",
        headers: { Origin: "https://attacker.test" },
      }),
    );
    assert(rejected.status === 403);
  },
);
Deno.test("image réelle décodée et réencodée avant validation", async () => {
  const image = await Deno.readFile(
    new URL("../../public/images/study.webp", import.meta.url),
  );
  const normalized = await normalizeFile(image, "image/webp");
  assert(normalized.length > 0);
  assert(detectMime(normalized) === "image/webp");
});
Deno.test(
  "conférence pending : reprise sur le même événement, sans nouvel insert",
  async () => {
    const { processJob } =
      await import("../../supabase/functions/_shared/worker.ts");
    Deno.env.set("GOOGLE_CLIENT_ID", "fixture");
    Deno.env.set("GOOGLE_CLIENT_SECRET", "fixture");
    const encrypted = await encrypt({
      access_token: "fixture",
      refresh_token: "fixture",
      expires_at: Date.now() + 3600000,
    });
    const actions: { action: string; data: Record<string, unknown> }[] = [];
    const admin = {
      rpc: (
        _name: string,
        args: { p_action: string; p_data: Record<string, unknown> },
      ) => {
        actions.push({ action: args.p_action, data: args.p_data });
        return Promise.resolve({ data: {}, error: null });
      },
    };
    const id = "00000000-0000-4000-8000-000000000001";
    const stable = id.replaceAll("-", "");
    const event = {
      id: stable,
      extendedProperties: { private: { konFananMeetingId: id } },
      conferenceData: { createRequest: { status: { statusCode: "pending" } } },
    };
    let reads = 0,
      inserts = 0;
    const original = globalThis.fetch;
    globalThis.fetch = async (_input, init) => {
      if (init?.method === "POST") {
        inserts++;
        return Response.json(event);
      }
      reads++;
      return reads === 1
        ? new Response(null, { status: 404 })
        : Response.json({
            ...event,
            conferenceData: {
              entryPoints: [
                {
                  entryPointType: "video",
                  uri: "https://meet.google.com/abc-defg-hij",
                },
              ],
            },
          });
    };
    try {
      const context = {
        job: {
          id: "job",
          operation: "create" as const,
          requested_revision: 1,
          lease_token: "lease",
          attempt_count: 1,
        },
        meeting: {
          id,
          status: "publishing",
          revision: 1,
          starts_at: new Date().toISOString(),
          ends_at: new Date(Date.now() + 3600000).toISOString(),
          timezone: "Africa/Casablanca",
        },
        announcement: { title: "Fixture", body: "" },
        integration: {
          google_event_id: stable,
          conference_request_id: "request",
          google_etag: null,
          synced_start: null,
          synced_end: null,
        },
        connection: {
          id: "conn",
          teacher_id: "teacher",
          google_subject: "subject",
          google_email: "teacher@example.test",
          state: "connected",
          ...encrypted,
        },
        allowed: true,
      };
      await processJob(admin as never, context);
      assert(actions[0].action === "job_retry");
      await processJob(admin as never, {
        ...context,
        job: { ...context.job, attempt_count: 2 },
      });
      assert(inserts === 1);
      assert(actions[1].action === "job_finish");
      assert(
        actions[1].data.meet_url === "https://meet.google.com/abc-defg-hij",
      );
    } finally {
      globalThis.fetch = original;
    }
  },
);
Deno.test(
  "photos JPEG et PNG acceptées ; métadonnées EXIF retirées",
  async () => {
    for (const [file, mime] of [
      ["photo.jpg", "image/jpeg"],
      ["photo.png", "image/png"],
    ]) {
      const raw = await Deno.readFile(
        new URL("../fixtures/" + file, import.meta.url),
      );
      const clean = await normalizeFile(raw, mime);
      assert(detectMime(clean) === mime);
      assert(!new TextDecoder().decode(clean).includes("EXIF_FIXTURE"));
    }
  },
);

Deno.test(
  "lecture publique des PDF accepte une origine LAN sans ouvrir les endpoints privés",
  async () => {
    Deno.env.set("APP_BASE_URL", "https://konfanan.test");
    const req = () =>
      new Request("https://backend.test", {
        method: "POST",
        headers: { Origin: "http://192.168.1.7:5173" },
      });
    const publicHandler = endpoint(
      async () => ({ url: "fixture-signed-course-url" }),
      ["POST"],
      { publicRead: true },
    );
    const publicResponse = await publicHandler(req());
    assert(publicResponse.status === 200);
    assert(publicResponse.headers.get("access-control-allow-origin") === "*");
    const privateResponse = await endpoint(async () => ({
      secret: "must-not-return",
    }))(req());
    assert(privateResponse.status === 403);
    assert(
      !JSON.stringify(await privateResponse.json()).includes("must-not-return"),
    );
    const options = await publicHandler(
      new Request("https://backend.test", {
        method: "OPTIONS",
        headers: { Origin: "http://192.168.1.7:5173" },
      }),
    );
    assert(
      options.status === 204 &&
        options.headers.get("access-control-allow-origin") === "*",
    );
  },
);
