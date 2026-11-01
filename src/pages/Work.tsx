import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Download,
  FileText,
  ImagePlus,
  Plus,
  RotateCw,
  Send,
  Trash2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
  ClipboardList,
} from "lucide-react";
import { Resources } from "../components/Resources";
import { useApp } from "../app/AppProvider";
import {
  Badge,
  Button,
  ButtonLink,
  Empty,
  Field,
  Modal,
  Notice,
  PageHeader,
  Panel,
  Pagination,
  SearchInput,
  Tabs,
  Loading,
} from "../components/ui";
import {
  date,
  initials,
  localToISO,
  spaceInfo,
  validateFiles,
} from "../lib/utils";
import type {
  Course,
  Exercise,
  Evaluation,
  FileRow,
  SubmissionVersion,
} from "../lib/types";
import { supabase } from "../lib/supabase";
import { Unavailable } from "./Learning";
interface PendingFile {
  key: string;
  file: File;
  preview: string;
  progress: number;
  uploadedId?: string;
  error?: string;
}
export function UploadWork({
  exerciseId,
  competitionId,
  disabled = false,
}: {
  exerciseId?: string;
  competitionId?: string;
  disabled?: boolean;
}) {
  const {
    data,
    user,
    mutate,
    upload,
    invoke,
    demo,
    notify,
    refresh,
    discardUpload,
  } = useApp();
  const existing = data.submissions.find(
    (s) =>
      s.student_id === user!.id &&
      (exerciseId
        ? s.exercise_id === exerciseId
        : s.competition_id === competitionId),
  );
  const current = data.submission_versions.find(
    (v) => v.id === existing?.latest_version_id,
  );
  const [version, setVersion] = useState<SubmissionVersion | undefined>(
      current,
    ),
    [files, setFiles] = useState<PendingFile[]>([]),
    [comment, setComment] = useState(current?.student_comment || ""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(!!current?.submitted_at),
    [message, setMessage] = useState("");
  const gallery = useRef<HTMLInputElement>(null),
    camera = useRef<HTMLInputElement>(null),
    filesRef = useRef(files);
  filesRef.current = files;
  useEffect(
    () => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.preview)),
    [],
  );
  const ready = data.submission_files
    .filter((f) => f.submission_version_id === (version?.id || current?.id))
    .map((f) => data.files.find((x) => x.id === f.file_id))
    .filter((x): x is FileRow => !!x && x.status === "ready");
  function add(input: FileList | null) {
    if (!input) return;
    const incoming = Array.from(input),
      all = [
        ...ready.map(
          (f) =>
            ({
              size: f.size_bytes,
              type: f.mime_type,
              name: f.original_name,
            }) as File,
        ),
        ...files.map((f) => f.file),
        ...incoming,
      ];
    const err = validateFiles(all);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setFiles((prev) => [
      ...prev,
      ...incoming.map((file) => ({
        key: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
      })),
    ]);
  }
  async function save(send: boolean) {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      let v = version?.submitted_at ? undefined : version;
      if (!v) {
        v = await mutate<SubmissionVersion>("start_submission_version", {
          p_exercise_id: exerciseId || null,
          p_competition_id: competitionId || null,
        });
        setVersion(v);
      }
      for (const entry of files) {
        if (entry.uploadedId) continue;
        try {
          const id = await upload(
            entry.file,
            "submission_version",
            v!.id,
            (n) =>
              setFiles((prev) =>
                prev.map((f) =>
                  f.key === entry.key
                    ? { ...f, progress: n, error: undefined }
                    : f,
                ),
              ),
          );
          setFiles((prev) =>
            prev.map((f) =>
              f.key === entry.key ? { ...f, uploadedId: id, progress: 100 } : f,
            ),
          );
        } catch (e) {
          setFiles((prev) =>
            prev.map((f) =>
              f.key === entry.key ? { ...f, error: (e as Error).message } : f,
            ),
          );
          throw e;
        }
      }
      await mutate("save_submission_draft", {
        p_version_id: v!.id,
        p_comment: comment,
      });
      if (send) {
        await mutate("submit_work", {
          p_version_id: v!.id,
          p_comment: comment,
        });
        setSent(true);
        setMessage(
          "Ton travail a été envoyé. La version remise est conservée et ton professeur peut la consulter.",
        );
        notify("Ton travail a été envoyé.");
      } else {
        setMessage("Ton brouillon et les fichiers validés sont enregistrés.");
        setFiles((prev) => {
          prev.forEach((f) => URL.revokeObjectURL(f.preview));
          return [];
        });
      }
      await refresh();
    } catch (e) {
      setError((e as Error).message);
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  if (sent && existing?.status !== "changes_requested")
    return (
      <div className="submission-success">
        <CheckCircle2 size={44} />
        <Badge status={existing?.status || "submitted"} />
        <h2>Ton travail est entre de bonnes mains.</h2>
        <p>
          Version {current?.version_number || version?.version_number || 1} ·{" "}
          {date(current?.submitted_at || new Date().toISOString(), true)}
        </p>
        <p>Les fichiers de cette version ne peuvent plus être remplacés.</p>
        {existing && (
          <ButtonLink
            variant="secondary"
            to={`/etudiant/mes-travaux/${existing.id}`}
          >
            Voir ma copie <ArrowRight size={16} />
          </ButtonLink>
        )}
      </div>
    );
  return (
    <div className="upload-work">
      <input
        ref={gallery}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="sr-only"
        aria-label="Choisir des photos ou un PDF"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={camera}
        type="file"
        capture="environment"
        accept="image/*"
        className="sr-only"
        aria-label="Prendre une photo"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
      {existing?.status === "changes_requested" && (
        <Notice>
          Ton professeur t’invite à compléter ton travail. Nouvelle version
          possible jusqu’au {date(existing.resubmit_until, true)}.
        </Notice>
      )}
      <div
        className="upload-zone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!busy && !disabled) add(e.dataTransfer.files);
        }}
      >
        <span className="upload-zone-icon">
          <ImagePlus size={30} />
        </span>
        <h3>Fais-nous voir ton raisonnement.</h3>
        <p>Des photos lisibles ou un PDF de ton travail.</p>
        <div className="actions">
          <Button
            variant="secondary"
            disabled={busy || disabled}
            onClick={() => gallery.current?.click()}
          >
            <Upload size={17} />
            Choisir des fichiers
          </Button>
          <Button
            variant="ghost"
            disabled={busy || disabled}
            onClick={() => camera.current?.click()}
          >
            <Camera size={17} />
            Prendre une photo
          </Button>
        </div>
        <small>
          JPEG, PNG, WebP, PDF · 5 fichiers maximum
          <br />
          Images : 10 Mo · PDF : 20 Mo · Total : 30 Mo
        </small>
      </div>
      <div className="file-previews">
        {data.files
          .filter(
            (f) =>
              f.target_type === "submission_version" &&
              f.target_id === (version?.id || current?.id) &&
              f.status === "pending" &&
              !files.some(
                (x) =>
                  x.file.name === f.original_name &&
                  x.file.size === f.size_bytes,
              ),
          )
          .map((f) => (
            <div className="ready-file" key={f.id}>
              <FileText size={22} />
              <div>
                <strong>{f.original_name}</strong>
                <small>
                  Envoi inachevé · Retire ce fichier pour recommencer.
                </small>
              </div>
              <button
                className="icon-button"
                disabled={busy}
                aria-label={"Retirer " + f.original_name}
                onClick={async () => {
                  try {
                    setBusy(true);
                    await invoke("files-delete", { fileId: f.id });
                    await refresh();
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        {ready
          .filter((r) => !files.some((f) => f.uploadedId === r.id))
          .map((r) => (
            <div className="ready-file" key={r.id}>
              <FileText size={24} />
              <div>
                <strong>{r.original_name}</strong>
                <small>
                  {(r.size_bytes / 1024 / 1024).toFixed(1)} Mo · Validé
                </small>
              </div>
              <button
                className="icon-button"
                aria-label={`Retirer ${r.original_name}`}
                disabled={busy || disabled}
                onClick={async () => {
                  try {
                    if (demo)
                      await mutate("delete_draft_file", { p_file_id: r.id });
                    else await invoke("files-delete", { fileId: r.id });
                    await refresh();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        {files.map((f) => (
          <div className="pending-file" key={f.key}>
            {f.file.type.startsWith("image/") ? (
              <img src={f.preview} alt={`Aperçu de ${f.file.name}`} />
            ) : (
              <FileText size={30} />
            )}
            <div>
              <strong>{f.file.name}</strong>
              <small>
                {(f.file.size / 1024 / 1024).toFixed(1)} Mo
                {f.uploadedId ? " · Validé" : ""}
              </small>
              {busy && (
                <progress
                  value={f.progress}
                  max="100"
                  aria-label={`Envoi de ${f.file.name}`}
                />
              )}
            </div>
            {!busy && (
              <button
                className="icon-button"
                aria-label={`Retirer ${f.file.name}`}
                onClick={async () => {
                  setBusy(true);
                  try {
                    if (f.uploadedId) {
                      if (demo)
                        await mutate("delete_draft_file", {
                          p_file_id: f.uploadedId,
                        });
                      else
                        await invoke("files-delete", { fileId: f.uploadedId });
                      await refresh();
                    } else await discardUpload(f.file);
                    URL.revokeObjectURL(f.preview);
                    setFiles((prev) => prev.filter((x) => x.key !== f.key));
                    setError("");
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <X size={16} />
              </button>
            )}
            {f.error && <span className="file-error">{f.error}</span>}
          </div>
        ))}
      </div>
      <Field label="Un commentaire pour ton professeur (facultatif)">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={10000}
          disabled={busy || disabled}
          placeholder="Une question, une étape qui t’a posé problème…"
        />
      </Field>
      {error && (
        <Notice tone="error">
          {error} Les fichiers déjà validés sont conservés. Réessaie pour
          poursuivre.
        </Notice>
      )}
      {message && <Notice tone="success">{message}</Notice>}
      <div className="upload-actions">
        <Button
          variant="secondary"
          disabled={busy || disabled}
          onClick={() => void save(false)}
        >
          Enregistrer le brouillon
        </Button>
        <Button
          disabled={busy || disabled || (!files.length && !ready.length)}
          onClick={() => void save(true)}
        >
          <Send size={17} />
          {busy
            ? "Envoi en cours…"
            : competitionId
              ? "Envoyer ma participation"
              : "Envoyer mon travail"}
        </Button>
      </div>
    </div>
  );
}
export function ExerciseSubmission() {
  const { data, demo, user } = useApp(),
    { id } = useParams();
  const [loaded, setLoaded] = useState<{
      exercise: Exercise;
      course: Course;
    } | null>(null),
    [checking, setChecking] = useState(true),
    [loadError, setLoadError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    setChecking(true);
    setLoaded(null);
    setLoadError("");
    async function run() {
      if (demo) {
        const exercise = data.exercises.find((e) => e.id === id),
          course = data.courses.find((c) => c.id === exercise?.course_id);
        return exercise && course ? { exercise, course } : null;
      }
      const r = await supabase!
        .from("exercises")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (r.error) throw Error("Impossible de charger cet exercice. Réessaie.");
      if (!r.data) return null;
      const c = await supabase!
        .from("courses")
        .select("*")
        .eq("id", r.data.course_id)
        .maybeSingle();
      if (c.error) throw Error("Impossible de charger le cours. Réessaie.");
      return c.data
        ? { exercise: r.data as Exercise, course: c.data as Course }
        : null;
    }
    void run()
      .then((r) => {
        if (alive) setLoaded(r);
      })
      .catch((e) => {
        if (alive) setLoadError(e.message);
      })
      .finally(() => {
        if (alive) setChecking(false);
      });
    return () => {
      alive = false;
    };
  }, [id, user?.id, demo, retry]);
  if (checking) return <Loading />;
  if (loadError)
    return (
      <Notice tone="error">
        {loadError}
        <Button onClick={() => setRetry((n) => n + 1)}>Réessayer</Button>
      </Notice>
    );
  if (!loaded) return <Navigate replace to={`/decouvrir/exercices/${id}`} />;
  const { exercise: e, course: c } = loaded;
  const info = spaceInfo(data, c.teaching_space_id);
  return (
    <>
      <PageHeader
        eyebrow={`${info.subject?.label} / ${c.title}`}
        title={e.title}
        description={
          <>
            {info.teacher?.display_name} <span className="dot-divider">•</span>À
            rendre le {date(e.due_at, true)}{" "}
            <span className="dot-divider">•</span>Barème /{e.max_score}
          </>
        }
        back={`/etudiant/cours/${c.id}`}
        action={<Badge>À toi de jouer</Badge>}
      />
      <div className="submission-layout">
        <Panel className="statement-panel" title="L’énoncé">
          <span className="eyebrow">COMPRENDRE. POSER. RÉSOUDRE.</span>
          <div className="statement-text" dir="auto">
            {e.instructions}
          </div>
          <Resources kind="exercise" id={e.id} />
          <div className="statement-tip">
            <BookOpenMini />
            Pense à justifier chaque étape et à vérifier tes solutions.
          </div>
        </Panel>
        <Panel title="Mon travail">
          <UploadWork exerciseId={e.id} />
        </Panel>
      </div>
    </>
  );
}
function BookOpenMini() {
  return <ClipboardList size={20} />;
}
export function WorkList() {
  const { data, user, hasMore, loadMore } = useApp();
  const teacher = user!.role === "teacher";
  const [tab, setTab] = useState(teacher ? "À corriger" : "À rendre"),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1);
  useEffect(() => setPage(1), [tab, search]);
  const wanted = (
    {
      Envoyés: "submitted",
      "À corriger": "submitted",
      "À reprendre": "changes_requested",
      Corrigés: "reviewed",
      Corrigées: "reviewed",
      Brouillons: "draft",
    } as Record<string, string>
  )[tab];
  const pending = data.exercises.filter(
    (e) =>
      !data.submissions.some(
        (s) => s.exercise_id === e.id && s.student_id === user!.id,
      ) && e.title.toLowerCase().includes(search.toLowerCase()),
  );
  const rows = data.submissions.filter(
    (s) =>
      (teacher || s.student_id === user!.id) &&
      (tab === "Toutes" || !wanted || s.status === wanted) &&
      `${data.profiles.find((p) => p.id === s.student_id)?.display_name} ${data.exercises.find((e) => e.id === s.exercise_id)?.title || data.competitions.find((c) => c.id === s.competition_id)?.title}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        eyebrow={
          teacher
            ? "VOTRE REGARD FAIT LA DIFFÉRENCE"
            : "CHAQUE ESSAI TE FAIT AVANCER"
        }
        title={teacher ? "Copies des étudiants" : "Mes travaux"}
        description={
          teacher
            ? "Les exercices et les participations de vos groupes."
            : "Retrouve tes copies, leurs versions et les conseils de tes professeurs."
        }
      />
      <Panel>
        <Tabs
          options={
            teacher
              ? ["À corriger", "À reprendre", "Corrigées", "Toutes"]
              : [
                  "À rendre",
                  "Brouillons",
                  "Envoyés",
                  "À reprendre",
                  "Corrigés",
                  "Toutes",
                ]
          }
          value={tab}
          onChange={setTab}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={
            teacher
              ? "Rechercher un étudiant ou un travail…"
              : "Rechercher un travail…"
          }
        />
        {!teacher && tab === "À rendre" ? (
          <div className="stack">
            {pending.map((e) => (
              <div className="list-row" key={e.id}>
                <span className="task-icon mint">
                  <ClipboardList size={20} />
                </span>
                <div>
                  <h3>{e.title}</h3>
                  <p>
                    {data.courses.find((c) => c.id === e.course_id)?.title} ·{" "}
                    {date(e.due_at)}
                  </p>
                </div>
                <ButtonLink
                  variant="secondary"
                  to={`/etudiant/exercices/${e.id}`}
                >
                  Commencer <ArrowRight size={16} />
                </ButtonLink>
              </div>
            ))}
            {!pending.length && (
              <Empty
                title="Tous tes exercices sont commencés"
                description="Retrouve tes brouillons et les travaux envoyés dans les onglets."
              />
            )}
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="responsive-table">
                <thead>
                  <tr>
                    {teacher && <th>Étudiant</th>}
                    <th>Travail</th>
                    <th>Remise</th>
                    <th>Version</th>
                    <th>État</th>
                    <th>{teacher ? "Action" : "Résultat"}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice((page - 1) * 8, page * 8).map((s) => {
                    const v = data.submission_versions.find(
                        (v) => v.id === s.latest_version_id,
                      ),
                      e = data.evaluations.find(
                        (e) => e.submission_version_id === v?.id,
                      );
                    const target =
                      data.exercises.find((e) => e.id === s.exercise_id) ||
                      data.competitions.find((c) => c.id === s.competition_id);
                    return (
                      <tr key={s.id}>
                        {teacher && (
                          <td data-label="Étudiant">
                            <span className="person">
                              <span className="avatar small">
                                {initials(
                                  data.profiles.find(
                                    (p) => p.id === s.student_id,
                                  )?.display_name,
                                )}
                              </span>
                              {
                                data.profiles.find((p) => p.id === s.student_id)
                                  ?.display_name
                              }
                            </span>
                          </td>
                        )}
                        <td data-label="Travail">
                          <Link
                            className="table-title"
                            to={
                              teacher
                                ? `/prof/copies/${s.id}`
                                : `/etudiant/mes-travaux/${s.id}`
                            }
                          >
                            {target?.title || "Travail"}
                          </Link>
                        </td>
                        <td data-label="Remise">
                          {date(v?.submitted_at, true)}
                          {v?.is_late && <Badge>Retard</Badge>}
                        </td>
                        <td data-label="Version">V{v?.version_number || 1}</td>
                        <td data-label="État">
                          <Badge status={s.status} />
                        </td>
                        <td data-label={teacher ? "Action" : "Résultat"}>
                          {teacher ? (
                            <ButtonLink
                              variant="secondary"
                              to={`/prof/copies/${s.id}`}
                            >
                              Corriger <ArrowRight size={15} />
                            </ButtonLink>
                          ) : (
                            <Link
                              className="text-link"
                              to={`/etudiant/mes-travaux/${s.id}`}
                            >
                              {e && e.status === "published"
                                ? e.score === null
                                  ? "Voir le retour"
                                  : `${e.score} / ${e.max_score}`
                                : s.status === "draft"
                                  ? "Mon brouillon"
                                  : "En attente"}
                              <ArrowRight size={15} />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!rows.length && (
              <Empty
                title="Aucun travail dans cette sélection"
                description="Les copies apparaîtront ici dès qu’elles seront disponibles."
              />
            )}
            <Pagination page={page} total={rows.length} onChange={setPage} />
            {hasMore.submissions && (
              <Button
                variant="secondary"
                onClick={() => void loadMore("submissions")}
              >
                Charger les travaux suivants
              </Button>
            )}
          </>
        )}
      </Panel>
    </>
  );
}
export function SubmissionDetail() {
  const { data, user, mutate, notify } = useApp(),
    { id } = useParams();
  const s = data.submissions.find((s) => s.id === id);
  const teacher = user!.role === "teacher" || user!.role === "admin";
  const versions = data.submission_versions
    .filter((v) => v.submission_id === id)
    .sort((a, b) => b.version_number - a.version_number);
  const [versionId, setVersionId] = useState(
      s?.latest_version_id || versions[0]?.id || "",
    ),
    [tab, setTab] = useState("Copie"),
    [feedback, setFeedback] = useState(""),
    [score, setScore] = useState(""),
    [saved, setSaved] = useState<Evaluation | undefined>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [request, setRequest] = useState(false);
  const v = versions.find((v) => v.id === versionId) || versions[0],
    ev = data.evaluations.find((e) => e.submission_version_id === v?.id);
  useEffect(() => {
    setFeedback(ev?.feedback || "");
    setScore(ev?.score == null ? "" : String(ev.score));
    setSaved(ev);
  }, [v?.id, ev?.id, ev?.row_version]);
  if (!s || !v) return <Unavailable />;
  const target =
    data.exercises.find((e) => e.id === s.exercise_id) ||
    data.competitions.find((c) => c.id === s.competition_id);
  const files = data.submission_files
    .filter((f) => f.submission_version_id === v.id)
    .map((sf) => data.files.find((f) => f.id === sf.file_id))
    .filter((f): f is FileRow => !!f);
  async function save(publish: boolean) {
    setBusy(true);
    setError("");
    try {
      const e = await mutate<Evaluation>("save_evaluation", {
        p_version_id: v.id,
        p_feedback: feedback,
        p_score: score === "" ? null : Number(score),
        p_expected_version: saved?.row_version || null,
      });
      setSaved(e);
      if (publish)
        await mutate("publish_evaluation", {
          p_evaluation_id: e.id,
          p_expected_version: e.row_version,
        });
      notify(
        publish
          ? "La correction a été publiée."
          : "Le brouillon de correction a été enregistré.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow={
          teacher
            ? data.profiles.find((p) => p.id === s.student_id)?.display_name
            : "MON TRAVAIL, MES PROGRÈS"
        }
        title={
          teacher
            ? `Copie de ${data.profiles.find((p) => p.id === s.student_id)?.display_name || "l’étudiant"}`
            : target?.title || "Mon travail"
        }
        description={
          <>
            {target?.title} <span className="dot-divider">•</span>V
            {v.version_number} · Remise le {date(v.submitted_at, true)}
          </>
        }
        back={teacher ? "/prof/copies" : "/etudiant/mes-travaux"}
        action={<Badge status={s.status} />}
      />
      {s.status === "draft" && !teacher ? (
        <Panel>
          <UploadWork
            exerciseId={s.exercise_id || undefined}
            competitionId={s.competition_id || undefined}
          />
        </Panel>
      ) : (
        <>
          <div className="mobile-task-tabs">
            <Tabs
              options={["Copie", "Correction"]}
              value={tab}
              onChange={setTab}
            />
          </div>
          <div
            className={`correction-layout task-tab-${tab === "Copie" ? "copy" : "feedback"}`}
          >
            <Panel className="copy-panel">
              <div className="panel-heading">
                <h2>Le travail remis</h2>
                <select
                  aria-label="Version de la copie"
                  value={v.id}
                  onChange={(e) => setVersionId(e.target.value)}
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      Version {v.version_number}
                    </option>
                  ))}
                </select>
              </div>
              <DocumentViewer files={files} />
              {v.student_comment && (
                <div className="student-comment">
                  <h3>Commentaire de l’étudiant</h3>
                  <p>{v.student_comment}</p>
                </div>
              )}
              <details className="statement-details">
                <summary>Revoir l’énoncé de cette version</summary>
                <p>{v.statement_snapshot || target?.instructions}</p>
              </details>
              <Button
                variant="secondary"
                className="button secondary mobile-only"
                onClick={() => setTab("Correction")}
              >
                Aller à la correction <ArrowRight size={16} />
              </Button>
            </Panel>
            <Panel
              className="feedback-panel"
              title={
                teacher ? "Votre correction" : "Le retour de ton professeur"
              }
            >
              <Badge status={ev?.status || "pending"} />
              {teacher ? (
                <>
                  <Field
                    label={`Note facultative / ${v.max_score_snapshot || 20}`}
                  >
                    <input
                      type="number"
                      min="0"
                      max={v.max_score_snapshot || 20}
                      step="0.25"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      disabled={busy}
                    />
                  </Field>
                  <Field label="Commentaire pédagogique">
                    <textarea
                      rows={9}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      disabled={busy}
                      placeholder="Les points acquis, les pistes à reprendre, la prochaine étape…"
                    />
                  </Field>
                  <div className="stack">
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void save(false)}
                    >
                      Enregistrer le brouillon
                    </Button>
                    <Button
                      disabled={
                        busy ||
                        !feedback.trim() ||
                        (score !== "" &&
                          (Number(score) < 0 ||
                            Number(score) > (v.max_score_snapshot || 20)))
                      }
                      onClick={() => void save(true)}
                    >
                      <CheckCircle2 size={17} />
                      Publier la correction
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setRequest(true)}
                    >
                      Demander une nouvelle version
                    </Button>
                  </div>
                  {s.competition_id && (
                    <Notice>
                      La correction reste invisible à l’étudiant tant que les
                      résultats de la compétition ne sont pas publiés.
                    </Notice>
                  )}
                </>
              ) : ev?.status === "published" ? (
                <>
                  {ev.score !== null && (
                    <div className="correction-score">
                      {ev.score}
                      <span>/ {ev.max_score}</span>
                    </div>
                  )}
                  <div className="published-feedback">{ev.feedback}</div>
                  <p className="muted small-text">
                    Publié le {date(ev.published_at, true)}
                  </p>
                  {s.exercise_id && (
                    <ButtonLink
                      variant="secondary"
                      to={`/etudiant/cours/${data.exercises.find((e) => e.id === s.exercise_id)?.course_id}`}
                    >
                      Revoir le cours <ArrowRight size={16} />
                    </ButtonLink>
                  )}
                </>
              ) : (
                <Empty
                  title="Le retour arrive bientôt"
                  description="La correction apparaîtra ici après sa publication par ton professeur."
                />
              )}
              {error && <Notice tone="error">{error}</Notice>}
              {!teacher && s.status === "changes_requested" && (
                <>
                  <Notice>
                    Une nouvelle version est demandée avant le{" "}
                    {date(s.resubmit_until, true)}.
                  </Notice>
                  <Button
                    onClick={async () => {
                      try {
                        await mutate("start_submission_version", {
                          p_exercise_id: s.exercise_id,
                          p_competition_id: s.competition_id,
                        });
                        setVersionId("");
                        notify("Ton nouveau brouillon est prêt.");
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    Préparer une nouvelle version <Plus size={17} />
                  </Button>
                </>
              )}
            </Panel>
          </div>
        </>
      )}
      {request && (
        <Modal
          title="Demander une nouvelle version"
          onClose={() => setRequest(false)}
        >
          <p className="muted">
            La version remise est conservée. Un nouveau brouillon sera proposé à
            cet étudiant.
          </p>
          <form
            className="form"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              setBusy(true);
              try {
                await mutate("request_resubmission", {
                  p_submission_id: s.id,
                  p_until: localToISO(String(fd.get("until"))),
                  p_feedback: fd.get("feedback"),
                });
                setRequest(false);
                notify("La demande de nouvelle version a été envoyée.");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field label="Nouveau délai · Africa/Casablanca">
              <input type="datetime-local" name="until" required />
            </Field>
            <Field label="Ce qui est attendu">
              <textarea name="feedback" required defaultValue={feedback} />
            </Field>
            {error && <Notice tone="error">{error}</Notice>}
            <Button type="submit" disabled={busy}>
              Envoyer la demande
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}
export function DocumentViewer({ files }: { files: FileRow[] }) {
  const { fileURL, demo } = useApp();
  const [index, setIndex] = useState(0),
    [url, setUrl] = useState(""),
    [error, setError] = useState(""),
    [zoom, setZoom] = useState(1),
    [rotation, setRotation] = useState(0);
  const f = files[index] || files[0];
  useEffect(() => {
    let alive = true,
      object = "";
    setUrl("");
    setError("");
    setZoom(1);
    setRotation(0);
    if (f)
      void fileURL(f.id)
        .then((u) => {
          object = u;
          if (alive) setUrl(u);
        })
        .catch((e) => {
          if (alive) setError(e.message);
        });
    return () => {
      alive = false;
      if (object.startsWith("blob:")) URL.revokeObjectURL(object);
    };
  }, [f?.id]);
  if (!f)
    return (
      <div className="document-empty">
        <FileText size={48} />
        <h3>Aucun fichier à afficher</h3>
        <p>
          {demo
            ? "Cette copie d’exemple présente le parcours et la correction. Les fichiers que tu ajoutes en démonstration sont conservés dans ce navigateur."
            : "Les fichiers de cette version ne sont pas disponibles."}
        </p>
      </div>
    );
  return (
    <div className="document-viewer">
      <div className="document-toolbar">
        <span>
          {index + 1}/{files.length}
        </span>
        <button
          className="icon-button"
          aria-label="Réduire"
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
        >
          <ZoomOut size={18} />
        </button>
        <button
          className="icon-button"
          aria-label="Agrandir"
          onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
        >
          <ZoomIn size={18} />
        </button>
        <button
          className="icon-button"
          aria-label="Faire pivoter"
          onClick={() => setRotation((r) => r + 90)}
        >
          <RotateCw size={18} />
        </button>
        {url && (
          <a
            className="icon-button"
            href={url}
            download={f.original_name}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Télécharger la copie"
          >
            <Download size={18} />
          </a>
        )}
      </div>
      <div className="document-canvas">
        {error ? (
          <Notice tone="error">{error}</Notice>
        ) : url ? (
          f.mime_type === "application/pdf" ? (
            <iframe
              src={url}
              title={f.original_name}
              sandbox="allow-same-origin"
            />
          ) : (
            <img
              src={url}
              alt={f.original_name}
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
            />
          )
        ) : (
          <span role="status">Ouverture du document privé…</span>
        )}
      </div>
      <div className="document-thumbnails">
        {files.map((file, i) => (
          <button
            key={file.id}
            className={i === index ? "active" : ""}
            onClick={() => setIndex(i)}
          >
            <FileText size={18} />
            <span>{file.original_name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
