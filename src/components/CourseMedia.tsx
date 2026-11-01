import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { BookOpen, Video } from "lucide-react";
import { useApp } from "../app/AppProvider";
import { supabase } from "../lib/supabase";
import { demoCatalog } from "../lib/packs";
import type { Data } from "../lib/types";
import { Button, Empty, Field, Loading, Notice, Panel } from "./ui";
const PdfBook = lazy(() => import("./PdfBook"));
export function CourseVideo({
  provider,
  id,
  title,
}: {
  provider: string | null;
  id: string | null;
  title: string;
}) {
  const valid =
    provider === "youtube"
      ? !!id && /^[\w-]{11}$/.test(id)
      : provider === "vimeo" && !!id && /^\d{1,15}$/.test(id);
  return (
    <section className="course-video" aria-label="Vidéo du cours">
      {valid ? (
        <iframe
          title={`Vidéo : ${title}`}
          src={
            provider === "youtube"
              ? `https://www.youtube-nocookie.com/embed/${id}?rel=0`
              : `https://player.vimeo.com/video/${id}`
          }
          allow="accelerometer; encrypted-media; gyroscope; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div className="course-video-empty">
          <Video size={36} />
          <strong>Vidéo du cours</strong>
          <p>Le professeur n’a pas encore ajouté de vidéo à ce cours.</p>
        </div>
      )}
    </section>
  );
}
interface Document {
  id: string;
  label: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
}
export function CourseBook({
  courseId,
  discovery = false,
}: {
  courseId: string;
  discovery?: boolean;
}) {
  const { data, demo, fileURL, user } = useApp();
  const [documents, setDocuments] = useState<Document[]>([]),
    [selected, setSelected] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const demoRevision = demo
    ? JSON.stringify([data.course_resources, data.files])
    : "";
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    async function run(): Promise<Document[]> {
      if (demo) {
        let source = data;
        if (discovery) {
          const raw = sessionStorage.getItem("kf-demo-v1");
          if (raw) source = JSON.parse(raw) as Data;
          if (!demoCatalog({ course: courseId }).courses.length) return [];
        }
        return source.course_resources
          .filter((r) => r.course_id === courseId)
          .flatMap((r) => {
            const f = source.files.find(
              (f) =>
                f.id === r.file_id &&
                f.status === "ready" &&
                f.mime_type === "application/pdf" &&
                f.target_type === "course" &&
                f.target_id === courseId,
            );
            return f
              ? [
                  {
                    id: f.id,
                    label: r.label || f.original_name,
                    original_name: f.original_name,
                    mime_type: f.mime_type,
                    size_bytes: f.size_bytes,
                  },
                ]
              : [];
          });
      }
      if (!supabase)
        throw Error("Les documents nécessitent la configuration Supabase.");
      if (discovery) {
        const r = await supabase.rpc("discovery_course_documents", {
          p_course_id: courseId,
        });
        if (r.error) throw Error("Impossible de charger le PDF du cours.");
        return r.data as Document[];
      }
      const r = await supabase
        .from("course_resources")
        .select(
          "label,file:files(id,original_name,mime_type,size_bytes,status)",
        )
        .eq("course_id", courseId)
        .order("position");
      if (r.error) throw Error("Impossible de charger le PDF du cours.");
      return r.data.flatMap((row) => {
        const f = row.file as unknown as (Document & { status: string }) | null;
        return f && f.status === "ready" && f.mime_type === "application/pdf"
          ? [{ ...f, label: row.label || f.original_name }]
          : [];
      });
    }
    void run()
      .then((rows) => {
        if (alive) {
          setDocuments(rows);
          setSelected((prev) =>
            rows.some((r) => r.id === prev) ? prev : rows[0]?.id || "",
          );
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [courseId, discovery, demo, user?.id, demoRevision, retry]);
  const loadSource = useCallback(async () => {
    if (demo) return fileURL(selected);
    const { data: result, error } = await supabase!.functions.invoke(
      "course-document-url",
      { body: { courseId, fileId: selected } },
    );
    if ((error || !result?.data?.url) && !discovery) return fileURL(selected);
    if (error || !result?.data?.url)
      throw Error(
        "Le PDF n’est pas disponible. Réessaie pour actualiser son accès.",
      );
    return result.data.url as string;
  }, [courseId, selected, discovery, demo]);
  return (
    <Panel
      className="course-book-panel"
      title={
        <>
          <BookOpen size={21} /> Le livre du cours
        </>
      }
    >
      {loading ? (
        <Loading />
      ) : error ? (
        <Notice tone="error">
          {error}
          <Button variant="secondary" onClick={() => setRetry((n) => n + 1)}>
            Réessayer
          </Button>
        </Notice>
      ) : !documents.length ? (
        <Empty
          title="Le PDF du cours arrive bientôt"
          description="Le professeur peut l’ajouter dans les documents du cours. Il apparaîtra ici, sous la vidéo."
        />
      ) : (
        <>
          {documents.length > 1 && (
            <Field label="Choisir un document du cours">
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {documents.map((d) => (
                  <option value={d.id} key={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Suspense fallback={<Loading />}>
            <PdfBook
              key={selected}
              title={
                documents.find((d) => d.id === selected)?.label ||
                "PDF du cours"
              }
              loadSource={loadSource}
            />
          </Suspense>
        </>
      )}
    </Panel>
  );
}
