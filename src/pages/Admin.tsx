import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
  Layers3,
  Plus,
  School,
  ShieldCheck,
  UserPlus,
  Users,
  Video,
  Clock3,
  CalendarDays,
  RefreshCw,
  ChevronRight,
  Archive,
  Mail,
  Settings2,
} from "lucide-react";
import { useApp } from "../app/AppProvider";
import {
  AsyncForm,
  Badge,
  Button,
  ButtonLink,
  Empty,
  Field,
  Loading,
  Modal,
  Notice,
  PageHeader,
  Pagination,
  Panel,
  SearchInput,
  Tabs,
} from "../components/ui";
import {
  date,
  errorMessage,
  initials,
  spaceInfo,
  statusLabel,
} from "../lib/utils";
import type { Data, Enrollment, SchoolClass } from "../lib/types";

const SIZE = 8;
const nameOf = (d: Data, id?: string) =>
  d.profiles.find((p) => p.id === id)?.display_name || "Compte";
const classOf = (d: Data, id?: string) =>
  d.classes.find((c) => c.id === id)?.name || "Non attribuée";
const subjectOf = (d: Data, csId?: string) =>
  d.subjects.find(
    (s) => s.id === d.class_subjects.find((c) => c.id === csId)?.subject_id,
  )?.label || "Matière";
const enrollmentOf = (d: Data, id: string) =>
  d.class_enrollments.find((e) => e.student_id === id && e.status === "active");
const countClass = (d: Data, id: string) =>
  d.classes.find((c) => c.id === id)?.enrolled_count ??
  d.class_enrollments.filter((e) => e.class_id === id && e.status === "active")
    .length;
const subjectAccess = (d: Data, enrollmentId?: string) =>
  d.student_subject_access.filter(
    (a) => a.enrollment_id === enrollmentId && a.status === "active",
  );
const formValue = (f: HTMLFormElement, n: string) =>
  String(new FormData(f).get(n) || "").trim();
const checked = (items: string[], id: string, value: boolean) =>
  value ? [...new Set([...items, id])] : items.filter((x) => x !== id);

function Person({ name, subtitle }: { name: string; subtitle?: string }) {
  return (
    <div className="person">
      <span className="avatar">{initials(name)}</span>
      <div>
        <strong>{name}</strong>
        {subtitle && <small className="muted">{subtitle}</small>}
      </div>
    </div>
  );
}
function Metric({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <Panel className="metric-card">
      <div className="metric-icon">{icon}</div>
      <span className="muted">{label}</span>
      <strong className="metric-value">{value}</strong>
      {hint && <small>{hint}</small>}
    </Panel>
  );
}
function Capacity({ current, maximum }: { current: number; maximum: number }) {
  return (
    <div className="capacity">
      <div className="heading-row">
        <span>
          <strong>{current}</strong> / {maximum} étudiants
        </span>
        <small className="muted">{Math.max(0, maximum - current)} places</small>
      </div>
      <div
        className="progress-bar"
        role="meter"
        aria-label="Effectif de la classe"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={maximum}
      >
        <span
          style={{ width: `${Math.min(100, (current / maximum) * 100)}%` }}
        />
      </div>
    </div>
  );
}
function SelectClass({
  value,
  onChange,
  includeAll = true,
  onlyActive = false,
}: {
  value: string;
  onChange: (id: string) => void;
  includeAll?: boolean;
  onlyActive?: boolean;
}) {
  const { data } = useApp();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Classe"
    >
      {includeAll && <option value="">Toutes les classes</option>}
      {data.classes
        .filter((c) => !onlyActive || c.status === "active")
        .map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
    </select>
  );
}
function ActionButton({
  action,
  children,
  variant = "secondary",
}: {
  action: () => Promise<unknown>;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <Button
        variant={variant}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await action();
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "En cours…" : children}
      </Button>
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}
function Missing() {
  return (
    <Panel>
      <Empty
        title="Cet élément n’est pas disponible"
        description="Il a peut-être été archivé ou votre accès a changé."
        action={
          <ButtonLink to="/admin" variant="secondary">
            Retour au tableau de bord
          </ButtonLink>
        }
      />
    </Panel>
  );
}
function SubjectBadges({
  d,
  enrollment,
}: {
  d: Data;
  enrollment?: Enrollment;
}) {
  const accesses = subjectAccess(d, enrollment?.id);
  return (
    <div className="badge-list">
      {accesses.length ? (
        accesses.map((a) => (
          <Badge key={a.id} status="active">
            {subjectOf(d, a.class_subject_id)}
          </Badge>
        ))
      ) : (
        <span className="muted">Aucune matière</span>
      )}
    </div>
  );
}
function AccountStatusAction({ id, status }: { id: string; status: string }) {
  const { mutate, notify } = useApp();
  const [confirm, setConfirm] = useState(false);
  const next = status === "suspended" ? "active" : "suspended";
  return (
    <>
      <Button
        variant={next === "suspended" ? "secondary" : "primary"}
        onClick={() => setConfirm(true)}
      >
        {next === "suspended" ? "Suspendre l’accès" : "Réactiver le compte"}
      </Button>
      {confirm && (
        <Modal
          title={
            next === "suspended"
              ? "Suspendre cet accès ?"
              : "Réactiver ce compte ?"
          }
          onClose={() => setConfirm(false)}
        >
          <p>
            {next === "suspended"
              ? "Les nouvelles lectures, remises et séances seront bloquées. L’historique des travaux reste conservé."
              : "Les accès attribués à ce compte seront à nouveau utilisables."}
          </p>
          <AsyncForm
            onSubmit={async () => {
              await mutate("set_account_status", {
                p_user_id: id,
                p_status: next,
              });
              setConfirm(false);
              notify("Le statut du compte a été mis à jour.");
            }}
          >
            <div className="actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setConfirm(false)}
              >
                Annuler
              </Button>
              <Button variant={next === "suspended" ? "danger" : "primary"}>
                Confirmer
              </Button>
            </div>
          </AsyncForm>
        </Modal>
      )}
    </>
  );
}

export function AdminDashboard() {
  const { data, stats } = useApp();
  const pending = data.admission_requests.filter((a) => a.status === "pending");
  const year = data.academic_years.find((y) => y.is_current);
  const alerts = data.meetings.filter(
    (m) => m.status === "error" || m.sync_status === "error",
  );
  return (
    <>
      <PageHeader
        eyebrow="L’ESSENTIEL, AU MÊME ENDROIT"
        title="Vue d’ensemble"
        description={`Un nouveau jour pour faire grandir les talents. ${year?.label || ""}`}
        action={
          <ButtonLink to="/admin/classes/nouvelle">
            <Plus size={18} />
            Créer une classe
          </ButtonLink>
        }
      />
      <div className="grid-4">
        <Metric
          icon={<GraduationCap />}
          label="Étudiants actifs"
          value={
            stats.students ??
            data.account_access.filter(
              (a) => a.role === "student" && a.status === "active",
            ).length
          }
        />
        <Metric
          icon={<Users />}
          label="Professeurs actifs"
          value={
            stats.teachers ??
            data.account_access.filter(
              (a) => a.role === "teacher" && a.status === "active",
            ).length
          }
        />
        <Metric
          icon={<School />}
          label="Classes actives"
          value={
            stats.classes ??
            data.classes.filter((c) => c.status === "active").length
          }
        />
        <Metric
          icon={<UserPlus />}
          label="Demandes en attente"
          value={stats.admissions ?? pending.length}
          hint="À examiner individuellement"
        />
      </div>
      <div className="split-layout">
        <Panel
          title="Demandes récentes"
          action={
            <Link to="/admin/admissions" className="text-link">
              Tout voir <ArrowRight size={16} />
            </Link>
          }
        >
          {pending.length ? (
            pending.slice(0, 4).map((a) => (
              <div key={a.id} className="list-row">
                <Person
                  name={nameOf(data, a.student_id)}
                  subtitle={classOf(data, a.requested_class_id)}
                />
                <ButtonLink
                  variant="secondary"
                  to={`/admin/admissions/${a.id}`}
                >
                  Examiner <ChevronRight size={16} />
                </ButtonLink>
              </div>
            ))
          ) : (
            <Empty
              title="Toutes les demandes sont à jour"
              description="Les prochaines inscriptions apparaîtront ici."
            />
          )}
        </Panel>
        <Panel title="Un peu d’avance">
          <div className="stack">
            <Link className="quick-link" to="/admin/professeurs?inviter=1">
              <UserPlus />
              <div>
                <strong>Inviter un professeur</strong>
                <small>Enrichir l’équipe pédagogique</small>
              </div>
              <ArrowRight size={17} />
            </Link>
            <Link className="quick-link" to="/admin/referentiels">
              <BookOpen />
              <div>
                <strong>Ajouter une matière</strong>
                <small>Organiser les apprentissages</small>
              </div>
              <ArrowRight size={17} />
            </Link>
            <Link className="quick-link" to="/admin/etudiants">
              <ShieldCheck />
              <div>
                <strong>Gérer les accès</strong>
                <small>À chacun ses matières</small>
              </div>
              <ArrowRight size={17} />
            </Link>
          </div>
        </Panel>
      </div>
      <div className="split-layout">
        <Panel
          title="Les classes, en un regard"
          action={
            <Link to="/admin/classes" className="text-link">
              Gérer les classes <ArrowRight size={16} />
            </Link>
          }
        >
          <div className="grid-2">
            {data.classes
              .filter((c) => c.status === "active")
              .slice(0, 4)
              .map((c) => (
                <Link
                  className="inner-card"
                  to={`/admin/classes/${c.id}`}
                  key={c.id}
                >
                  <h3>{c.name}</h3>
                  <Capacity
                    current={countClass(data, c.id)}
                    maximum={c.capacity}
                  />
                </Link>
              ))}
          </div>
          {!data.classes.length && (
            <Empty
              title="Votre première classe vous attend"
              action={
                <ButtonLink to="/admin/classes/nouvelle">
                  Créer une classe
                </ButtonLink>
              }
            />
          )}
        </Panel>
        <Panel title="À garder à l’œil">
          <div className="stack">
            <BookOpen className="mint" size={30} />
            <h3>
              {data.courses.filter((c) => c.status === "published").length}{" "}
              cours publiés
            </h3>
            <p className="muted">
              Des ressources à disposition des étudiants autorisés.
            </p>
            <ButtonLink to="/admin/contenus" variant="secondary">
              Explorer les contenus
            </ButtonLink>
            {alerts.length > 0 && (
              <Notice>
                {alerts.length} séance(s) nécessitent une vérification.{" "}
                <Link to="/admin/integrations">Voir les intégrations</Link>
              </Notice>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}

export function Admissions() {
  const { data } = useApp();
  const [tab, setTab] = useState("pending"),
    [query, setQuery] = useState(""),
    [classId, setClass] = useState(""),
    [page, setPage] = useState(1);
  const list = data.admission_requests
    .filter(
      (a) =>
        a.status === tab &&
        (!classId || a.requested_class_id === classId) &&
        nameOf(data, a.student_id)
          .toLocaleLowerCase("fr")
          .includes(query.toLocaleLowerCase("fr")),
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  useEffect(() => setPage(1), [tab, query, classId]);
  return (
    <>
      <PageHeader
        eyebrow="ACCUEILLIR LES TALENTS"
        title="Demandes d’admission"
        description="Examinez chaque dossier et attribuez les matières adaptées."
      />
      <div className="split-layout">
        <Panel>
          <Tabs
            value={tab}
            onChange={setTab}
            options={[
              {
                value: "pending",
                label: `En attente (${data.admission_requests.filter((a) => a.status === "pending").length})`,
              },
              { value: "accepted", label: "Acceptées" },
              { value: "rejected", label: "Refusées" },
            ]}
          />
          <div className="filters">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Rechercher un étudiant…"
            />
            <SelectClass value={classId} onChange={setClass} />
          </div>
          {list.length ? (
            <div className="table-wrap">
              <table className="responsive-table">
                <thead>
                  <tr>
                    <th>Étudiant</th>
                    <th>Classe souhaitée</th>
                    <th>Demande</th>
                    <th>Statut</th>
                    <th>
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.slice((page - 1) * SIZE, page * SIZE).map((a) => (
                    <tr key={a.id}>
                      <td data-label="Étudiant">
                        <Person name={nameOf(data, a.student_id)} />
                      </td>
                      <td data-label="Classe souhaitée">
                        {classOf(data, a.requested_class_id)}
                      </td>
                      <td data-label="Demande">{date(a.created_at)}</td>
                      <td data-label="Statut">
                        <Badge status={a.status} />
                      </td>
                      <td>
                        <ButtonLink
                          to={`/admin/admissions/${a.id}`}
                          variant="secondary"
                        >
                          {tab === "pending" ? "Examiner" : "Voir le dossier"}
                        </ButtonLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="Aucune demande dans cette sélection"
              description="Modifiez les filtres ou revenez après les prochaines inscriptions."
            />
          )}
          <Pagination page={page} total={list.length} onChange={setPage} />
        </Panel>
        <Panel title="Avant d’accepter">
          <ol className="steps-list">
            <li>
              <strong>La bonne classe</strong>
              <p>Vérifiez le niveau et les places disponibles.</p>
            </li>
            <li>
              <strong>Les bonnes matières</strong>
              <p>Choisissez au moins une matière pour ouvrir l’accès.</p>
            </li>
            <li>
              <strong>Un accueil clair</strong>
              <p>Ajoutez un message si l’étudiant a besoin d’une précision.</p>
            </li>
          </ol>
          <Notice>
            L’inscription à une classe n’ouvre pas automatiquement toutes ses
            matières.
          </Notice>
        </Panel>
      </div>
    </>
  );
}

export function AdmissionDetail() {
  const { id } = useParams();
  const { data, mutate, notify } = useApp();
  const a = data.admission_requests.find((x) => x.id === id);
  const [classId, setClass] = useState(a?.requested_class_id || ""),
    [subjects, setSubjects] = useState<string[]>([]),
    [reject, setReject] = useState(false);
  useEffect(() => {
    setClass(a?.requested_class_id || "");
    setSubjects([]);
  }, [a?.id, a?.requested_class_id]);
  if (!a) return <Missing />;
  const selectedClass = data.classes.find((c) => c.id === classId),
    current = countClass(data, classId),
    available = (selectedClass?.capacity || 0) - current;
  const cs = data.class_subjects.filter(
    (s) => s.class_id === classId && s.is_active,
  );
  const name = nameOf(data, a.student_id);
  return (
    <>
      <PageHeader
        back="/admin/admissions"
        title="Examiner la demande"
        description={<Badge status={a.status} />}
      />
      <div className="split-layout reverse">
        <Panel title="Le dossier">
          <div className="stack">
            <div className="avatar avatar-lg">{initials(name)}</div>
            <h2>{name}</h2>
            <dl className="detail-list">
              <div>
                <dt>Classe souhaitée</dt>
                <dd>{classOf(data, a.requested_class_id)}</dd>
              </div>
              <div>
                <dt>Demande déposée</dt>
                <dd>{date(a.created_at, true)}</dd>
              </div>
              {a.decided_at && (
                <div>
                  <dt>Décision</dt>
                  <dd>{date(a.decided_at, true)}</dd>
                </div>
              )}
            </dl>
            {a.public_message && <Notice>{a.public_message}</Notice>}
          </div>
        </Panel>
        <Panel
          title={
            a.status === "pending"
              ? "Attribution des accès"
              : "Décision enregistrée"
          }
        >
          {a.status !== "pending" ? (
            <div className="stack">
              <Notice tone={a.status === "accepted" ? "success" : "info"}>
                Cette demande a été{" "}
                {a.status === "accepted" ? "acceptée" : "refusée"}.
              </Notice>
              <ButtonLink
                to={`/admin/etudiants/${a.student_id}`}
                variant="secondary"
              >
                Voir le profil étudiant
              </ButtonLink>
            </div>
          ) : (
            <AsyncForm
              onSubmit={async (form) => {
                await mutate("decide_admission", {
                  p_request_id: a.id,
                  p_decision: "accepted",
                  p_class_id: classId,
                  p_subject_ids: subjects,
                  p_message: formValue(form, "message"),
                });
                notify("L’admission a été acceptée et les accès attribués.");
              }}
            >
              <Field label="Classe finale">
                <SelectClass
                  value={classId}
                  onChange={(v) => {
                    setClass(v);
                    setSubjects([]);
                  }}
                  includeAll={false}
                  onlyActive
                />
              </Field>
              {selectedClass && (
                <Capacity current={current} maximum={selectedClass.capacity} />
              )}
              {available <= 0 && (
                <Notice tone="error">
                  Cette classe est complète. Choisissez une autre classe.
                </Notice>
              )}
              <fieldset className="checkbox-group">
                <legend>Matières autorisées</legend>
                {cs.map((s) => (
                  <label className="checkbox-row" key={s.id}>
                    <input
                      type="checkbox"
                      checked={subjects.includes(s.id)}
                      onChange={(e) =>
                        setSubjects(checked(subjects, s.id, e.target.checked))
                      }
                    />
                    <span>{subjectOf(data, s.id)}</span>
                  </label>
                ))}
                {!cs.length && (
                  <Notice>Ajoutez d’abord des matières à cette classe.</Notice>
                )}
              </fieldset>
              <Notice>
                {subjects.length
                  ? `${name} rejoindra ${selectedClass?.name} avec ${subjects.length} matière(s) autorisée(s).`
                  : "Sélectionnez au moins une matière pour accepter cette inscription."}
              </Notice>
              <Field label="Message à l’étudiant (facultatif)">
                <textarea
                  name="message"
                  rows={3}
                  maxLength={1000}
                  placeholder="Une précision utile pour ses premiers pas…"
                />
              </Field>
              <div className="actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setReject(true)}
                >
                  Refuser la demande
                </Button>
                <Button
                  disabled={!subjects.length || available <= 0 || !classId}
                >
                  <Check size={18} />
                  Accepter l’inscription
                </Button>
              </div>
            </AsyncForm>
          )}
        </Panel>
      </div>
      {reject && (
        <Modal title="Refuser cette demande" onClose={() => setReject(false)}>
          <p>
            Le message ci-dessous sera visible par {name}. L’accès aux contenus
            restera fermé.
          </p>
          <AsyncForm
            onSubmit={async (form) => {
              await mutate("decide_admission", {
                p_request_id: a.id,
                p_decision: "rejected",
                p_class_id: null,
                p_subject_ids: [],
                p_message: formValue(form, "reason"),
              });
              setReject(false);
              notify("La décision a été enregistrée.");
            }}
          >
            <Field label="Message de décision">
              <textarea name="reason" required rows={4} maxLength={1000} />
            </Field>
            <div className="actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setReject(false)}
              >
                Annuler
              </Button>
              <Button variant="danger">Confirmer le refus</Button>
            </div>
          </AsyncForm>
        </Modal>
      )}
    </>
  );
}

export function Classes() {
  const { data } = useApp();
  const [query, setQuery] = useState(""),
    [year, setYear] = useState(""),
    [level, setLevel] = useState(""),
    [status, setStatus] = useState("active"),
    [page, setPage] = useState(1);
  const list = data.classes.filter(
    (c) =>
      (!year || c.academic_year_id === year) &&
      (!level || c.level_id === level) &&
      (!status || c.status === status) &&
      c.name.toLowerCase().includes(query.toLowerCase()),
  );
  useEffect(() => setPage(1), [query, year, level, status]);
  return (
    <>
      <PageHeader
        eyebrow="L’ORGANISATION PÉDAGOGIQUE"
        title="Les classes"
        description="Un cadre pour apprendre, des places pour chacun."
        action={
          <ButtonLink to="/admin/classes/nouvelle">
            <Plus size={18} />
            Créer une classe
          </ButtonLink>
        }
      />
      <Panel className="filter-panel">
        <div className="filters">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher une classe…"
          />
          <select
            aria-label="Année scolaire"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">Toutes les années</option>
            {data.academic_years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Niveau"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option value="">Tous les niveaux</option>
            {data.levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Statut"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actives</option>
            <option value="archived">Archivées</option>
          </select>
        </div>
      </Panel>
      <div className="grid-2">
        {list.slice((page - 1) * SIZE, page * SIZE).map((c) => {
          const subjects = data.class_subjects.filter(
            (s) => s.class_id === c.id && s.is_active,
          );
          const teachers = [
            ...new Set(
              data.teaching_spaces
                .filter(
                  (s) =>
                    s.is_active &&
                    subjects.some((cs) => cs.id === s.class_subject_id),
                )
                .map((s) => s.teacher_id),
            ),
          ];
          return (
            <Panel key={c.id}>
              <div className="panel-heading">
                <span className="subject-icon">
                  <School size={24} />
                </span>
                <Badge status={c.status} />
              </div>
              <h2>{c.name}</h2>
              <p className="muted">
                {data.levels.find((l) => l.id === c.level_id)?.label} ·{" "}
                {
                  data.academic_years.find((y) => y.id === c.academic_year_id)
                    ?.label
                }
              </p>
              <Capacity current={countClass(data, c.id)} maximum={c.capacity} />
              <div className="class-meta">
                <span>
                  <BookOpen size={16} />
                  {subjects.length} matières
                </span>
                <span>
                  <Users size={16} />
                  {teachers.length} professeurs
                </span>
              </div>
              <div className="actions">
                <ButtonLink to={`/admin/classes/${c.id}`} variant="secondary">
                  Ouvrir la classe <ArrowRight size={16} />
                </ButtonLink>
                <Link
                  to={`/admin/classes/${c.id}/modifier`}
                  className="text-link"
                >
                  Modifier
                </Link>
              </div>
            </Panel>
          );
        })}
      </div>
      {!list.length && (
        <Panel>
          <Empty
            title="Aucune classe dans cette sélection"
            action={
              <ButtonLink to="/admin/classes/nouvelle">
                Créer une classe
              </ButtonLink>
            }
          />
        </Panel>
      )}
      <Pagination page={page} total={list.length} onChange={setPage} />
    </>
  );
}

export function ClassEditor() {
  const { id } = useParams();
  const { data, mutate, notify } = useApp();
  const navigate = useNavigate();
  const c = data.classes.find((x) => x.id === id);
  const [name, setName] = useState(c?.name || ""),
    [capacity, setCapacity] = useState(c?.capacity || 50),
    [subjects, setSubjects] = useState<string[]>(
      data.class_subjects
        .filter((s) => s.class_id === id && s.is_active)
        .map((s) => s.subject_id),
    );
  useEffect(() => {
    if (c) {
      setName(c.name);
      setCapacity(c.capacity);
      setSubjects(
        data.class_subjects
          .filter((s) => s.class_id === c.id && s.is_active)
          .map((s) => s.subject_id),
      );
    }
  }, [c?.id]);
  if (id && !c) return <Missing />;
  const current = c ? countClass(data, c.id) : 0;
  return (
    <>
      <PageHeader
        back={c ? `/admin/classes/${c.id}` : "/admin/classes"}
        title={c ? "Modifier la classe" : "Créer une classe"}
        description="Les matières se choisissent ici. Les professeurs s’affectent ensuite."
      />
      <div className="split-layout">
        <Panel title="Informations de la classe">
          <AsyncForm
            onSubmit={async (form) => {
              const result = (await mutate("save_class", {
                p_data: {
                  name,
                  capacity,
                  level_id: formValue(form, "level_id"),
                  academic_year_id:
                    c?.academic_year_id || formValue(form, "year"),
                  subject_ids: subjects,
                  status: formValue(form, "status") || "active",
                },
                p_id: c?.id || null,
                p_expected_version: c?.row_version || null,
              })) as SchoolClass;
              notify(
                c ? "La classe a été mise à jour." : "La classe a été créée.",
              );
              navigate(`/admin/classes/${result?.id || c?.id || ""}`);
            }}
          >
            <Field label="Nom de la classe">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                placeholder="Ex. 3ème collège A"
              />
            </Field>
            <div className="grid-2">
              <Field label="Niveau">
                <select
                  name="level_id"
                  required
                  defaultValue={c?.level_id || data.levels[0]?.id}
                >
                  {data.levels
                    .filter((l) => l.is_active)
                    .map((l) => (
                      <option value={l.id} key={l.id}>
                        {l.label}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Année scolaire">
                <select
                  name="year"
                  disabled={!!c}
                  required
                  defaultValue={
                    c?.academic_year_id ||
                    data.academic_years.find((y) => y.is_current)?.id
                  }
                >
                  {data.academic_years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field
              label="Capacité maximale"
              hint={`L’effectif réel est calculé depuis les inscriptions. Minimum actuel : ${Math.max(1, current)}.`}
            >
              <input
                type="number"
                min={Math.max(1, current)}
                max={1000}
                step={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                required
              />
            </Field>
            <fieldset className="checkbox-group">
              <legend>Matières proposées</legend>
              {data.subjects
                .filter((s) => s.is_active)
                .map((s) => (
                  <label className="checkbox-row" key={s.id}>
                    <input
                      type="checkbox"
                      checked={subjects.includes(s.id)}
                      onChange={(e) =>
                        setSubjects(checked(subjects, s.id, e.target.checked))
                      }
                    />
                    {s.label}
                  </label>
                ))}
            </fieldset>
            {c && (
              <Field label="Statut">
                <select name="status" defaultValue={c.status}>
                  <option value="active">Active</option>
                  <option value="archived">Archivée</option>
                </select>
              </Field>
            )}
            <div className="actions">
              <ButtonLink
                variant="secondary"
                to={c ? `/admin/classes/${c.id}` : "/admin/classes"}
              >
                Annuler
              </ButtonLink>
              <Button>
                <Check size={18} />
                {c ? "Enregistrer les modifications" : "Créer la classe"}
              </Button>
            </div>
          </AsyncForm>
        </Panel>
        <Panel title="Aperçu">
          <div className="subject-icon">
            <School />
          </div>
          <h2>{name || "Votre nouvelle classe"}</h2>
          <Capacity current={current} maximum={Math.max(1, capacity)} />
          <div className="badge-list">
            {subjects.map((s) => (
              <Badge key={s}>
                {data.subjects.find((x) => x.id === s)?.label}
              </Badge>
            ))}
          </div>
          <Notice>
            Après la création, affectez un professeur à chaque matière depuis le
            détail de la classe.
          </Notice>
        </Panel>
      </div>
    </>
  );
}

function AssignmentModal({
  classId,
  teacherId,
  onClose,
}: {
  classId?: string;
  teacherId?: string;
  onClose: () => void;
}) {
  const { data, mutate, notify } = useApp();
  const [selectedClass, setClass] = useState(
    classId || data.classes.find((c) => c.status === "active")?.id || "",
  );
  const subjects = data.class_subjects.filter(
    (cs) => cs.class_id === selectedClass && cs.is_active,
  );
  const teachers = data.account_access.filter(
    (a) => a.role === "teacher" && a.status === "active",
  );
  return (
    <Modal title="Affecter un professeur" onClose={onClose}>
      <AsyncForm
        onSubmit={async (form) => {
          await mutate("assign_teacher", {
            p_teacher_id: teacherId || formValue(form, "teacher"),
            p_class_subject_id: formValue(form, "subject"),
            p_active: true,
          });
          notify("L’affectation a été enregistrée.");
          onClose();
        }}
      >
        <Field label="Classe">
          <SelectClass
            value={selectedClass}
            onChange={setClass}
            includeAll={false}
            onlyActive
          />
        </Field>
        <Field label="Matière de la classe">
          <select name="subject" key={selectedClass} required>
            <option value="">Choisir une matière</option>
            {subjects.map((cs) => (
              <option key={cs.id} value={cs.id}>
                {subjectOf(data, cs.id)}
              </option>
            ))}
          </select>
        </Field>
        {teacherId ? (
          <Notice>Professeur : {nameOf(data, teacherId)}</Notice>
        ) : (
          <Field label="Professeur">
            <select name="teacher" required>
              <option value="">Choisir un professeur</option>
              {teachers.map((t) => (
                <option key={t.user_id} value={t.user_id}>
                  {nameOf(data, t.user_id)}
                </option>
              ))}
            </select>
          </Field>
        )}
        <div className="actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button>Confirmer l’affectation</Button>
        </div>
      </AsyncForm>
    </Modal>
  );
}
function RemoveAssignment({
  teacherId,
  csId,
}: {
  teacherId: string;
  csId: string;
}) {
  const { mutate, notify } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Retirer
      </Button>
      {open && (
        <Modal
          title="Retirer cette affectation ?"
          onClose={() => setOpen(false)}
        >
          <p>
            Le professeur ne pourra plus gérer ce groupe ni corriger ses copies.
            Les contenus déjà publiés resteront consultables par les étudiants
            autorisés.
          </p>
          <AsyncForm
            onSubmit={async () => {
              await mutate("assign_teacher", {
                p_teacher_id: teacherId,
                p_class_subject_id: csId,
                p_active: false,
              });
              setOpen(false);
              notify("L’affectation a été retirée.");
            }}
          >
            <div className="actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button variant="danger">Retirer l’affectation</Button>
            </div>
          </AsyncForm>
        </Modal>
      )}
    </>
  );
}

export function ClassDetail() {
  const { id } = useParams();
  const { data, mutate, notify } = useApp();
  const c = data.classes.find((x) => x.id === id);
  const [tab, setTab] = useState("Étudiants"),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(1),
    [assign, setAssign] = useState(false),
    [archive, setArchive] = useState(false);
  const students = data.class_enrollments.filter(
    (e) =>
      e.class_id === id &&
      e.status === "active" &&
      nameOf(data, e.student_id).toLowerCase().includes(query.toLowerCase()),
  );
  const cs = data.class_subjects.filter(
    (s) => s.class_id === id && s.is_active,
  );
  useEffect(() => setPage(1), [query]);
  if (!c) return <Missing />;
  return (
    <>
      <PageHeader
        back="/admin/classes"
        title={c.name}
        description={`${data.levels.find((l) => l.id === c.level_id)?.label || ""} · ${data.academic_years.find((y) => y.id === c.academic_year_id)?.label || ""}`}
        action={
          <div className="actions">
            <ButtonLink
              variant="secondary"
              to={`/admin/classes/${id}/modifier`}
            >
              Modifier
            </ButtonLink>
            {c.status === "active" && (
              <Button variant="ghost" onClick={() => setArchive(true)}>
                <Archive size={17} />
                Archiver
              </Button>
            )}
          </div>
        }
      />
      <div className="grid-3">
        <Metric
          icon={<Users />}
          label="Étudiants inscrits"
          value={`${countClass(data, c.id)} / ${c.capacity}`}
        />
        <Metric
          icon={<BookOpen />}
          label="Matières proposées"
          value={cs.length}
        />
        <Metric
          icon={<GraduationCap />}
          label="Professeurs affectés"
          value={
            new Set(
              data.teaching_spaces
                .filter(
                  (s) =>
                    s.is_active && cs.some((x) => x.id === s.class_subject_id),
                )
                .map((s) => s.teacher_id),
            ).size
          }
        />
      </div>
      <Panel>
        <Tabs
          value={tab}
          onChange={setTab}
          options={["Étudiants", "Matières et professeurs", "Informations"]}
        />
        {tab === "Étudiants" && (
          <>
            <div className="filters">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Rechercher un étudiant…"
              />
            </div>
            {students.length ? (
              <div className="table-wrap">
                <table className="responsive-table">
                  <thead>
                    <tr>
                      <th>Étudiant</th>
                      <th>Matières autorisées</th>
                      <th>Inscription</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.slice((page - 1) * SIZE, page * SIZE).map((e) => (
                      <tr key={e.id}>
                        <td data-label="Étudiant">
                          <Person name={nameOf(data, e.student_id)} />
                        </td>
                        <td data-label="Matières">
                          <SubjectBadges d={data} enrollment={e} />
                        </td>
                        <td data-label="Inscription">{date(e.joined_at)}</td>
                        <td>
                          <ButtonLink
                            variant="secondary"
                            to={`/admin/etudiants/${e.student_id}`}
                          >
                            Voir le profil
                          </ButtonLink>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                title="Aucun étudiant dans cette sélection"
                description="Les admissions acceptées dans cette classe apparaîtront ici."
              />
            )}
            <Pagination
              page={page}
              total={students.length}
              onChange={setPage}
            />
          </>
        )}
        {tab === "Matières et professeurs" && (
          <div className="stack">
            <div className="actions">
              <Button onClick={() => setAssign(true)}>
                <Plus size={17} />
                Affecter un professeur
              </Button>
              <ButtonLink
                variant="secondary"
                to={`/admin/classes/${id}/modifier`}
              >
                Modifier les matières
              </ButtonLink>
            </div>
            {cs.map((s) => (
              <div className="inner-card" key={s.id}>
                <h3>{subjectOf(data, s.id)}</h3>
                {data.teaching_spaces
                  .filter((t) => t.class_subject_id === s.id && t.is_active)
                  .map((t) => (
                    <div className="list-row" key={t.id}>
                      <Link to={`/admin/professeurs/${t.teacher_id}`}>
                        <Person name={nameOf(data, t.teacher_id)} />
                      </Link>
                      <RemoveAssignment teacherId={t.teacher_id} csId={s.id} />
                    </div>
                  ))}
                {!data.teaching_spaces.some(
                  (t) => t.class_subject_id === s.id && t.is_active,
                ) && (
                  <p className="muted">
                    Aucun professeur affecté pour le moment.
                  </p>
                )}
              </div>
            ))}
            {!cs.length && (
              <Empty
                title="Aucune matière proposée"
                action={
                  <ButtonLink to={`/admin/classes/${id}/modifier`}>
                    Ajouter des matières
                  </ButtonLink>
                }
              />
            )}
          </div>
        )}
        {tab === "Informations" && (
          <dl className="detail-list">
            <div>
              <dt>Niveau</dt>
              <dd>{data.levels.find((l) => l.id === c.level_id)?.label}</dd>
            </div>
            <div>
              <dt>Année scolaire</dt>
              <dd>
                {
                  data.academic_years.find((y) => y.id === c.academic_year_id)
                    ?.label
                }
              </dd>
            </div>
            <div>
              <dt>Capacité maximale</dt>
              <dd>{c.capacity} étudiants</dd>
            </div>
            <div>
              <dt>État</dt>
              <dd>
                <Badge status={c.status} />
              </dd>
            </div>
          </dl>
        )}
      </Panel>
      {assign && (
        <AssignmentModal classId={id} onClose={() => setAssign(false)} />
      )}
      {archive && (
        <Modal
          title="Archiver cette classe ?"
          onClose={() => setArchive(false)}
        >
          <p>
            La classe sera retirée de l’usage courant. Les étudiants perdront
            l’accès aux contenus de cette classe. Les travaux et leur historique
            seront conservés.
          </p>
          <AsyncForm
            onSubmit={async () => {
              await mutate("save_class", {
                p_id: c.id,
                p_expected_version: c.row_version,
                p_data: {
                  ...c,
                  status: "archived",
                  subject_ids: cs.map((s) => s.subject_id),
                },
              });
              setArchive(false);
              notify("La classe a été archivée.");
            }}
          >
            <div className="actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setArchive(false)}
              >
                Annuler
              </Button>
              <Button variant="danger">Archiver la classe</Button>
            </div>
          </AsyncForm>
        </Modal>
      )}
    </>
  );
}

export function Students() {
  const { data } = useApp();
  const [query, setQuery] = useState(""),
    [classId, setClass] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1);
  const list = data.account_access.filter(
    (a) =>
      a.role === "student" &&
      (!status || a.status === status) &&
      (!classId || enrollmentOf(data, a.user_id)?.class_id === classId) &&
      `${nameOf(data, a.user_id)} ${data.profiles.find((p) => p.id === a.user_id)?.email || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  useEffect(() => setPage(1), [query, classId, status]);
  return (
    <>
      <PageHeader
        eyebrow="LES PARCOURS INDIVIDUELS"
        title="Les étudiants"
        description="Inscriptions, classes et accès aux matières."
      />
      <Panel>
        <div className="filters">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher un étudiant…"
          />
          <SelectClass value={classId} onChange={setClass} />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Statut du compte"
          >
            <option value="">Tous les statuts</option>
            {["active", "pending", "rejected", "suspended", "archived"].map(
              (s) => (
                <option key={s} value={s}>
                  {statusLabel[s]}
                </option>
              ),
            )}
          </select>
        </div>
        <p className="muted">{list.length} étudiant(s)</p>
        {list.length ? (
          <div className="table-wrap">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Classe</th>
                  <th>Matières</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.slice((page - 1) * SIZE, page * SIZE).map((a) => {
                  const e = enrollmentOf(data, a.user_id);
                  return (
                    <tr key={a.user_id}>
                      <td data-label="Étudiant">
                        <Person
                          name={nameOf(data, a.user_id)}
                          subtitle={
                            data.profiles.find((p) => p.id === a.user_id)?.email
                          }
                        />
                      </td>
                      <td data-label="Classe">{classOf(data, e?.class_id)}</td>
                      <td data-label="Matières">
                        <SubjectBadges d={data} enrollment={e} />
                      </td>
                      <td data-label="Statut">
                        <Badge status={a.status} />
                      </td>
                      <td>
                        <ButtonLink
                          variant="secondary"
                          to={`/admin/etudiants/${a.user_id}`}
                        >
                          Voir le profil
                        </ButtonLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Aucun étudiant trouvé"
            description="Essayez un autre nom ou modifiez les filtres."
          />
        )}
        <Pagination page={page} total={list.length} onChange={setPage} />
      </Panel>
    </>
  );
}

export function StudentDetail() {
  const { id } = useParams();
  const { data, mutate, notify } = useApp();
  const account = data.account_access.find(
      (a) => a.user_id === id && a.role === "student",
    ),
    profile = data.profiles.find((p) => p.id === id),
    enrollment = enrollmentOf(data, id || "");
  const [tab, setTab] = useState("Accès aux matières"),
    [pending, setPending] = useState<Record<string, boolean>>({}),
    [confirm, setConfirm] = useState(false),
    [transfer, setTransfer] = useState(false);
  const existing = subjectAccess(data, enrollment?.id);
  const cs = data.class_subjects.filter(
    (s) => s.class_id === enrollment?.class_id && s.is_active,
  );
  const changes = Object.entries(pending).filter(
    ([key, value]) =>
      existing.some((a) => a.class_subject_id === key) !== value,
  );
  useEffect(() => setPending({}), [id]);
  if (!account || !profile) return <Missing />;
  async function save() {
    if (!enrollment) return;
    for (const [csId, active] of changes)
      await mutate("set_subject_access", {
        p_enrollment_id: enrollment.id,
        p_class_subject_id: csId,
        p_active: active,
      });
    setPending({});
    setConfirm(false);
    notify("Les accès aux matières ont été mis à jour.");
  }
  return (
    <>
      <PageHeader
        back="/admin/etudiants"
        title={profile.display_name}
        description={<Badge status={account.status} />}
        action={
          <div className="actions">
            {enrollment && (
              <Button variant="secondary" onClick={() => setTransfer(true)}>
                Transférer de classe
              </Button>
            )}
            {["active", "suspended"].includes(account.status) && (
              <AccountStatusAction id={profile.id} status={account.status} />
            )}
          </div>
        }
      />
      <div className="split-layout reverse">
        <Panel title="Profil étudiant">
          <div className="stack">
            <div className="avatar avatar-lg">
              {initials(profile.display_name)}
            </div>
            <h2>{profile.display_name}</h2>
            {profile.email && <p>{profile.email}</p>}
            <dl className="detail-list">
              <div>
                <dt>Classe</dt>
                <dd>{classOf(data, enrollment?.class_id)}</dd>
              </div>
              <div>
                <dt>Année scolaire</dt>
                <dd>
                  {data.academic_years.find(
                    (y) => y.id === enrollment?.academic_year_id,
                  )?.label || "Non attribuée"}
                </dd>
              </div>
              <div>
                <dt>Admission</dt>
                <dd>{date(enrollment?.joined_at)}</dd>
              </div>
            </dl>
          </div>
        </Panel>
        <Panel>
          <Tabs
            options={["Accès aux matières", "Historique"]}
            value={tab}
            onChange={setTab}
          />
          {tab === "Accès aux matières" ? (
            <>
              <Notice>
                L’inscription à la classe ne donne pas automatiquement accès à
                toutes ses matières.
              </Notice>
              {enrollment ? (
                <AsyncForm
                  onSubmit={async () => {
                    if (changes.some(([, v]) => !v)) {
                      setConfirm(true);
                      return;
                    }
                    await save();
                  }}
                >
                  <div className="stack">
                    {cs.map((s) => {
                      const active =
                        pending[s.id] ??
                        existing.some((a) => a.class_subject_id === s.id);
                      return (
                        <label className="checkbox-row" key={s.id}>
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={(e) =>
                              setPending({
                                ...pending,
                                [s.id]: e.target.checked,
                              })
                            }
                          />
                          <span>
                            <strong>{subjectOf(data, s.id)}</strong>
                            <small className="muted">
                              {active ? "Autorisé" : "Non attribué"}
                            </small>
                          </span>
                          <Badge status={active ? "active" : "draft"}>
                            {active ? "Autorisé" : "Non attribué"}
                          </Badge>
                        </label>
                      );
                    })}
                  </div>
                  {!cs.length && (
                    <Empty
                      title="Aucune matière disponible dans cette classe"
                      action={
                        <ButtonLink
                          to={`/admin/classes/${enrollment.class_id}/modifier`}
                        >
                          Configurer la classe
                        </ButtonLink>
                      }
                    />
                  )}
                  <div className="actions">
                    <span className="muted">
                      {changes.length
                        ? `${changes.length} modification(s) non enregistrée(s)`
                        : "Les accès sont à jour."}
                    </span>
                    <Button disabled={!changes.length}>
                      <Check size={18} />
                      Enregistrer les accès
                    </Button>
                  </div>
                </AsyncForm>
              ) : (
                <Empty
                  title="Aucune inscription active"
                  description="Examinez la demande d’admission de cet étudiant pour attribuer une classe."
                  action={
                    <ButtonLink variant="secondary" to="/admin/admissions">
                      Voir les demandes
                    </ButtonLink>
                  }
                />
              )}
            </>
          ) : (
            <StudentHistory studentId={id!} />
          )}
        </Panel>
      </div>
      {confirm && (
        <Modal
          title="Confirmer le retrait des accès"
          onClose={() => setConfirm(false)}
        >
          <p>
            Les nouvelles lectures, remises et demandes de lien Meet des
            matières retirées seront bloquées. Les fichiers déjà téléchargés ne
            peuvent pas être rappelés.
          </p>
          <AsyncForm onSubmit={save}>
            <div className="actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setConfirm(false)}
              >
                Annuler
              </Button>
              <Button variant="danger">Enregistrer ces modifications</Button>
            </div>
          </AsyncForm>
        </Modal>
      )}
      {transfer && enrollment && (
        <TransferStudent
          enrollment={enrollment}
          onClose={() => setTransfer(false)}
        />
      )}
    </>
  );
}
function StudentHistory({ studentId }: { studentId: string }) {
  const { data } = useApp();
  const rows = data.class_enrollments.filter((e) => e.student_id === studentId);
  return (
    <div className="stack">
      {rows.length ? (
        rows.map((e) => (
          <div className="list-row" key={e.id}>
            <div>
              <strong>{classOf(data, e.class_id)}</strong>
              <p className="muted">
                Inscription du {date(e.joined_at)} ·{" "}
                {
                  data.academic_years.find((y) => y.id === e.academic_year_id)
                    ?.label
                }
              </p>
            </div>
            <Badge status={e.status === "active" ? "active" : "archived"}>
              {e.status === "active"
                ? "Inscription active"
                : "Inscription terminée"}
            </Badge>
          </div>
        ))
      ) : (
        <Empty title="Aucune inscription enregistrée" />
      )}
      <ButtonLink variant="secondary" to="/admin/audit">
        Consulter le journal administratif
      </ButtonLink>
    </div>
  );
}
function TransferStudent({
  enrollment,
  onClose,
}: {
  enrollment: Enrollment;
  onClose: () => void;
}) {
  const { data, mutate, notify } = useApp();
  const choices = data.classes.filter(
    (c) => c.status === "active" && c.id !== enrollment.class_id,
  );
  const [classId, setClass] = useState(choices[0]?.id || ""),
    [subjects, setSubjects] = useState<string[]>([]);
  const c = data.classes.find((x) => x.id === classId);
  return (
    <Modal title="Transférer l’étudiant" onClose={onClose}>
      <AsyncForm
        onSubmit={async () => {
          await mutate("transfer_student", {
            p_enrollment_id: enrollment.id,
            p_class_id: classId,
            p_subject_ids: subjects,
          });
          notify("Le transfert et les nouveaux accès ont été enregistrés.");
          onClose();
        }}
      >
        <Notice>
          L’ancienne inscription sera clôturée. Les anciennes autorisations
          seront retirées ; l’historique des copies sera conservé.
        </Notice>
        <Field label="Nouvelle classe">
          <select
            value={classId}
            required
            onChange={(e) => {
              setClass(e.target.value);
              setSubjects([]);
            }}
          >
            {choices.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        {c && (
          <Capacity current={countClass(data, c.id)} maximum={c.capacity} />
        )}
        <fieldset className="checkbox-group">
          <legend>Nouvelles matières autorisées</legend>
          {data.class_subjects
            .filter((s) => s.class_id === classId && s.is_active)
            .map((s) => (
              <label className="checkbox-row" key={s.id}>
                <input
                  type="checkbox"
                  checked={subjects.includes(s.id)}
                  onChange={(e) =>
                    setSubjects(checked(subjects, s.id, e.target.checked))
                  }
                />
                {subjectOf(data, s.id)}
              </label>
            ))}
        </fieldset>
        <div className="actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            disabled={
              !c || !subjects.length || countClass(data, c.id) >= c.capacity
            }
          >
            Confirmer le transfert
          </Button>
        </div>
      </AsyncForm>
    </Modal>
  );
}

export function Teachers() {
  const { data } = useApp();
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [subject, setSubject] = useState(""),
    [page, setPage] = useState(1),
    [invite, setInvite] = useState(
      new URLSearchParams(window.location.search).has("inviter"),
    );
  const list = data.account_access.filter(
    (a) =>
      a.role === "teacher" &&
      (!status || a.status === status) &&
      `${nameOf(data, a.user_id)} ${data.profiles.find((p) => p.id === a.user_id)?.email || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!subject ||
        data.teaching_spaces.some(
          (s) =>
            s.teacher_id === a.user_id &&
            s.is_active &&
            data.class_subjects.find((cs) => cs.id === s.class_subject_id)
              ?.subject_id === subject,
        )),
  );
  useEffect(() => setPage(1), [query, status, subject]);
  return (
    <>
      <PageHeader
        eyebrow="L’ÉQUIPE PÉDAGOGIQUE"
        title="Les professeurs"
        description="Des enseignants, des matières, des groupes pour progresser."
        action={
          <Button onClick={() => setInvite(true)}>
            <UserPlus size={18} />
            Inviter un professeur
          </Button>
        }
      />
      <Panel>
        <div className="filters">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher un professeur…"
          />
          <select
            aria-label="Statut"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="pending">En attente</option>
            <option value="suspended">Suspendus</option>
          </select>
          <select
            aria-label="Matière"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">Toutes les matières</option>
            {data.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        {list.length ? (
          <div className="table-wrap">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Professeur</th>
                  <th>Matières enseignées</th>
                  <th>Groupes actifs</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.slice((page - 1) * SIZE, page * SIZE).map((a) => {
                  const spaces = data.teaching_spaces.filter(
                      (s) => s.teacher_id === a.user_id && s.is_active,
                    ),
                    subjects = [
                      ...new Set(
                        spaces.map((s) => subjectOf(data, s.class_subject_id)),
                      ),
                    ];
                  return (
                    <tr key={a.user_id}>
                      <td data-label="Professeur">
                        <Person
                          name={nameOf(data, a.user_id)}
                          subtitle={
                            data.profiles.find((p) => p.id === a.user_id)?.email
                          }
                        />
                      </td>
                      <td data-label="Matières">
                        <div className="badge-list">
                          {subjects.map((s) => (
                            <Badge key={s}>{s}</Badge>
                          ))}
                          {!subjects.length && (
                            <span className="muted">À affecter</span>
                          )}
                        </div>
                      </td>
                      <td data-label="Groupes actifs">{spaces.length}</td>
                      <td data-label="Statut">
                        <Badge status={a.status} />
                      </td>
                      <td>
                        <ButtonLink
                          to={`/admin/professeurs/${a.user_id}`}
                          variant="secondary"
                        >
                          Voir le profil
                        </ButtonLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Aucun professeur trouvé"
            description="Invitez un professeur ou modifiez vos filtres."
          />
        )}
        <Pagination page={page} total={list.length} onChange={setPage} />
      </Panel>
      {invite && <InviteTeacher onClose={() => setInvite(false)} />}
    </>
  );
}
function InviteTeacher({ onClose }: { onClose: () => void }) {
  const { invoke, notify, demo } = useApp();
  const [sent, setSent] = useState(false);
  return (
    <Modal title="Inviter un professeur" onClose={onClose}>
      {sent ? (
        <div className="stack">
          <Notice tone="success">
            {demo
              ? "L’invitation a été simulée. Aucun email n’a été envoyé."
              : "L’invitation a été envoyée par email."}
          </Notice>
          <Button onClick={onClose}>Fermer</Button>
        </div>
      ) : (
        <AsyncForm
          onSubmit={async (form) => {
            await invoke("teacher-invite", {
              email: formValue(form, "email"),
              displayName: formValue(form, "name"),
            });
            setSent(true);
            notify(
              demo
                ? "Invitation de démonstration enregistrée."
                : "Invitation envoyée.",
            );
          }}
        >
          <p className="muted">
            Le professeur recevra un lien sécurisé pour activer son compte. Vous
            pourrez ensuite lui affecter ses groupes.
          </p>
          <Field label="Nom complet">
            <input name="name" required maxLength={120} autoComplete="name" />
          </Field>
          <Field label="Adresse email professionnelle">
            <input name="email" type="email" required autoComplete="email" />
          </Field>
          {demo && (
            <Notice>
              Mode démonstration : aucun email réel ne sera envoyé.
            </Notice>
          )}
          <div className="actions">
            <Button variant="secondary" type="button" onClick={onClose}>
              Annuler
            </Button>
            <Button>
              <Mail size={17} />
              Envoyer l’invitation
            </Button>
          </div>
        </AsyncForm>
      )}
    </Modal>
  );
}

export function TeacherDetail() {
  const { id } = useParams();
  const { data } = useApp();
  const profile = data.profiles.find((p) => p.id === id),
    account = data.account_access.find(
      (a) => a.user_id === id && a.role === "teacher",
    );
  const [assign, setAssign] = useState(false);
  const spaces = data.teaching_spaces.filter(
    (s) => s.teacher_id === id && s.is_active,
  );
  if (!profile || !account) return <Missing />;
  return (
    <>
      <PageHeader
        back="/admin/professeurs"
        title={profile.display_name}
        description={<Badge status={account.status} />}
        action={
          ["active", "suspended"].includes(account.status) ? (
            <AccountStatusAction id={profile.id} status={account.status} />
          ) : undefined
        }
      />
      <div className="split-layout reverse">
        <Panel title="Profil professeur">
          <div className="stack">
            <div className="avatar avatar-lg">
              {initials(profile.display_name)}
            </div>
            <h2>{profile.display_name}</h2>
            {profile.email && <p>{profile.email}</p>}
            <p className="muted">{spaces.length} groupe(s) affecté(s)</p>
            <Notice>
              Chaque affectation donne accès à une classe et à une matière. Le
              professeur reste responsable de ses propres contenus et copies.
            </Notice>
            <ButtonLink variant="secondary" to="/admin/integrations">
              Voir l’état des intégrations
            </ButtonLink>
          </div>
        </Panel>
        <div className="stack">
          <Panel
            title="Affectations"
            action={
              account.status === "active" ? (
                <Button onClick={() => setAssign(true)}>
                  <Plus size={17} />
                  Ajouter
                </Button>
              ) : undefined
            }
          >
            {spaces.length ? (
              spaces.map((s) => {
                const info = spaceInfo(data, s);
                const count = data.student_subject_access.filter(
                  (a) =>
                    a.class_subject_id === s.class_subject_id &&
                    a.status === "active" &&
                    data.class_enrollments.some(
                      (e) => e.id === a.enrollment_id && e.status === "active",
                    ),
                ).length;
                return (
                  <div className="list-row" key={s.id}>
                    <div>
                      <strong>{info.schoolClass?.name}</strong>
                      <p className="muted">
                        {info.subject?.label} · {count} étudiant(s) autorisé(s)
                      </p>
                    </div>
                    <RemoveAssignment
                      teacherId={profile.id}
                      csId={s.class_subject_id}
                    />
                  </div>
                );
              })
            ) : (
              <Empty
                title="Aucune affectation active"
                description="Choisissez une classe et une matière pour ouvrir le premier groupe de ce professeur."
              />
            )}
          </Panel>
          <Panel title="Contenus du professeur">
            {data.courses
              .filter((c) => spaces.some((s) => s.id === c.teaching_space_id))
              .slice(0, 5)
              .map((c) => (
                <div className="list-row" key={c.id}>
                  <div>
                    <strong>{c.title}</strong>
                    <p className="muted">
                      {spaceInfo(data, c.teaching_space_id).schoolClass?.name}
                    </p>
                  </div>
                  <Badge status={c.status} />
                </div>
              ))}
            <ButtonLink variant="secondary" to="/admin/contenus">
              Gérer les contenus
            </ButtonLink>
          </Panel>
        </div>
      </div>
      {assign && (
        <AssignmentModal
          teacherId={profile.id}
          onClose={() => setAssign(false)}
        />
      )}
    </>
  );
}

type ReferenceRow = {
  id?: string;
  label?: string;
  code?: string;
  is_active?: boolean;
  cycle?: string;
  sort_order?: number;
  starts_on?: string;
  ends_on?: string;
  is_current?: boolean;
  status?: string;
};
export function References() {
  const { data } = useApp();
  const [tab, setTab] = useState("subjects"),
    [query, setQuery] = useState(""),
    [edit, setEdit] = useState<ReferenceRow | null>(null),
    [page, setPage] = useState(1);
  const rows: ReferenceRow[] =
    tab === "subjects"
      ? data.subjects
      : tab === "levels"
        ? data.levels
        : data.academic_years;
  const list = rows.filter((r) =>
    `${r.label} ${r.code || ""}`.toLowerCase().includes(query.toLowerCase()),
  );
  useEffect(() => {
    setPage(1);
    setQuery("");
  }, [tab]);
  useEffect(() => setPage(1), [query]);
  return (
    <>
      <PageHeader
        eyebrow="LES REPÈRES COMMUNS"
        title="Référentiels"
        description="Configurez l’organisation pédagogique de Kon-fanan."
      />
      <Panel>
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { value: "subjects", label: "Matières" },
            { value: "levels", label: "Niveaux" },
            { value: "academic_years", label: "Années scolaires" },
            { value: "settings", label: "Paramètres" },
          ]}
        />
        {tab === "settings" ? (
          <PlatformSettings />
        ) : (
          <>
            <div className="filters">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Rechercher…"
              />
              <Button onClick={() => setEdit({})}>
                <Plus size={17} />
                {tab === "subjects"
                  ? "Ajouter une matière"
                  : tab === "levels"
                    ? "Ajouter un niveau"
                    : "Ajouter une année"}
              </Button>
            </div>
            <div className="table-wrap">
              <table className="responsive-table">
                <thead>
                  <tr>
                    <th>Libellé</th>
                    <th>{tab === "academic_years" ? "Période" : "Code"}</th>
                    <th>État</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {list.slice((page - 1) * SIZE, page * SIZE).map((r) => (
                    <tr key={r.id}>
                      <td data-label="Libellé">
                        <strong>{r.label}</strong>
                      </td>
                      <td
                        data-label={
                          tab === "academic_years" ? "Période" : "Code"
                        }
                      >
                        {tab === "academic_years"
                          ? `${date(r.starts_on)} — ${date(r.ends_on)}`
                          : r.code}
                      </td>
                      <td data-label="État">
                        <Badge
                          status={
                            tab === "academic_years"
                              ? r.status
                              : r.is_active
                                ? "active"
                                : "archived"
                          }
                        >
                          {r.is_current ? "Année courante" : undefined}
                        </Badge>
                      </td>
                      <td>
                        <Button variant="secondary" onClick={() => setEdit(r)}>
                          Modifier
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!list.length && <Empty title="Aucun élément trouvé" />}
            <Pagination page={page} total={list.length} onChange={setPage} />
          </>
        )}
      </Panel>
      {edit && (
        <ReferenceEditor kind={tab} row={edit} onClose={() => setEdit(null)} />
      )}
    </>
  );
}
function ReferenceEditor({
  kind,
  row,
  onClose,
}: {
  kind: string;
  row: ReferenceRow;
  onClose: () => void;
}) {
  const { mutate, notify } = useApp();
  return (
    <Modal
      title={`${row.id ? "Modifier" : "Ajouter"} ${kind === "subjects" ? "une matière" : kind === "levels" ? "un niveau" : "une année scolaire"}`}
      onClose={onClose}
    >
      <AsyncForm
        onSubmit={async (form) => {
          const f = new FormData(form);
          const payload: Record<string, unknown> = {
            label: formValue(form, "label"),
          };
          if (kind === "academic_years")
            Object.assign(payload, {
              starts_on: formValue(form, "starts_on"),
              ends_on: formValue(form, "ends_on"),
              is_current: f.has("is_current"),
              status: formValue(form, "status"),
            });
          else
            Object.assign(payload, {
              code: formValue(form, "code"),
              is_active: f.has("is_active"),
            });
          if (kind === "levels")
            Object.assign(payload, {
              cycle: formValue(form, "cycle"),
              sort_order: Number(formValue(form, "sort_order")),
            });
          await mutate("save_reference", {
            p_kind: kind,
            p_id: row.id || null,
            p_data: payload,
          });
          notify("Le référentiel a été enregistré.");
          onClose();
        }}
      >
        <Field label="Libellé">
          <input
            name="label"
            required
            maxLength={100}
            defaultValue={row.label}
          />
        </Field>
        {kind !== "academic_years" ? (
          <>
            <Field label="Code">
              <input
                name="code"
                required
                maxLength={30}
                defaultValue={row.code}
                placeholder="Ex. MATH"
              />
            </Field>
            <label className="checkbox-row">
              <input
                name="is_active"
                type="checkbox"
                defaultChecked={row.is_active ?? true}
              />
              Actif
            </label>
          </>
        ) : (
          <>
            <div className="grid-2">
              <Field label="Date de début">
                <input
                  name="starts_on"
                  type="date"
                  required
                  defaultValue={row.starts_on}
                />
              </Field>
              <Field label="Date de fin">
                <input
                  name="ends_on"
                  type="date"
                  required
                  defaultValue={row.ends_on}
                />
              </Field>
            </div>
            <label className="checkbox-row">
              <input
                name="is_current"
                type="checkbox"
                defaultChecked={row.is_current}
              />
              Année scolaire courante
            </label>
            <Field label="Statut">
              <select name="status" defaultValue={row.status || "active"}>
                <option value="active">Active</option>
                <option value="archived">Archivée</option>
              </select>
            </Field>
          </>
        )}
        {kind === "levels" && (
          <div className="grid-2">
            <Field label="Cycle">
              <select name="cycle" defaultValue={row.cycle || "college"}>
                <option value="college">Collège</option>
                <option value="lycee">Lycée</option>
              </select>
            </Field>
            <Field label="Ordre">
              <input
                name="sort_order"
                type="number"
                min={0}
                required
                defaultValue={row.sort_order ?? 0}
              />
            </Field>
          </div>
        )}
        <div className="actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button>Enregistrer</Button>
        </div>
      </AsyncForm>
    </Modal>
  );
}
function PlatformSettings() {
  const { mutate, notify } = useApp();
  const [settings, setSettings] = useState<Record<string, unknown> | null>(
      null,
    ),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setError("");
    void mutate("get_platform_settings", {})
      .then((r) => {
        if (live) setSettings(r as Record<string, unknown>);
      })
      .catch((e) => {
        if (live) setError(errorMessage(e));
      });
    return () => {
      live = false;
    };
  }, [retry]);
  if (error)
    return (
      <Notice tone="error">
        {error}
        <Button variant="secondary" onClick={() => setRetry((x) => x + 1)}>
          Réessayer
        </Button>
      </Notice>
    );
  if (!settings) return <Loading />;
  return (
    <AsyncForm
      success="Les paramètres ont été enregistrés."
      onSubmit={async (form) => {
        const values = {
          timezone: formValue(form, "timezone"),
          join_minutes_before: Number(formValue(form, "join_minutes_before")),
          max_files: Number(formValue(form, "max_files")),
          max_total_bytes:
            Number(formValue(form, "max_total_mb")) * 1024 * 1024,
        };
        for (const [key, value] of Object.entries(values))
          await mutate("save_reference", {
            p_kind: "settings",
            p_data: { key, value },
            p_id: null,
          });
        setSettings(values);
        notify("Les paramètres ont été mis à jour.");
      }}
    >
      <Notice>
        Ces limites s’appliquent aux nouveaux dépôts. Les contrôles serveur
        restent la référence.
      </Notice>
      <Field label="Fuseau horaire">
        <select
          name="timezone"
          defaultValue={String(settings.timezone || "Africa/Casablanca")}
        >
          <option value="Africa/Casablanca">Africa/Casablanca</option>
        </select>
      </Field>
      <div className="grid-2">
        <Field label="Ouverture de Meet avant la séance (minutes)">
          <input
            name="join_minutes_before"
            type="number"
            min={0}
            max={60}
            required
            defaultValue={Number(settings.join_minutes_before ?? 15)}
          />
        </Field>
        <Field label="Nombre maximum de fichiers par copie">
          <input
            name="max_files"
            type="number"
            min={1}
            max={5}
            required
            defaultValue={Number(settings.max_files ?? 5)}
          />
        </Field>
      </div>
      <Field label="Taille totale maximale d’une copie (Mo)">
        <input
          name="max_total_mb"
          type="number"
          min={1}
          max={30}
          required
          defaultValue={Math.round(
            Number(settings.max_total_bytes ?? 31457280) / 1024 / 1024,
          )}
        />
      </Field>
      <Button>
        <Settings2 size={17} />
        Enregistrer les paramètres
      </Button>
    </AsyncForm>
  );
}

type ManagedContent = {
  id: string;
  title: string;
  body: string;
  spaceId: string;
  status: string;
  row_version: number;
  published?: string | null;
};
export function ContentManagement() {
  const { data } = useApp();
  const [tab, setTab] = useState("course"),
    [query, setQuery] = useState(""),
    [classId, setClass] = useState(""),
    [status, setStatus] = useState(""),
    [teacher, setTeacher] = useState(""),
    [page, setPage] = useState(1),
    [preview, setPreview] = useState<ManagedContent | null>(null),
    [archive, setArchive] = useState<ManagedContent | null>(null),
    [transfer, setTransfer] = useState<ManagedContent | null>(null);
  const all: ManagedContent[] =
    tab === "course"
      ? data.courses.map((c) => ({
          ...c,
          spaceId: c.teaching_space_id,
          published: c.published_at,
        }))
      : tab === "exercise"
        ? data.exercises.map((e) => ({
            ...e,
            body: e.instructions,
            spaceId:
              data.courses.find((c) => c.id === e.course_id)
                ?.teaching_space_id || "",
          }))
        : tab === "competition"
          ? data.competitions.map((c) => ({
              ...c,
              body: c.instructions,
              spaceId: c.teaching_space_id,
            }))
          : data.announcements.map((a) => ({
              ...a,
              spaceId: a.teaching_space_id,
              published: a.published_at,
            }));
  const list = all.filter((c) => {
    const info = spaceInfo(data, c.spaceId);
    return (
      c.title.toLowerCase().includes(query.toLowerCase()) &&
      (!status || c.status === status) &&
      (!classId || info.schoolClass?.id === classId) &&
      (!teacher || info.space?.teacher_id === teacher)
    );
  });
  useEffect(() => setPage(1), [tab, query, status, classId, teacher]);
  return (
    <>
      <PageHeader
        eyebrow="LA BIBLIOTHÈQUE PÉDAGOGIQUE"
        title="Contenus pédagogiques"
        description="Supervisez les ressources et préservez l’historique des apprentissages."
      />
      <Panel>
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { value: "course", label: "Cours" },
            { value: "exercise", label: "Exercices" },
            { value: "competition", label: "Compétitions" },
            { value: "announcement", label: "Annonces" },
          ]}
        />
        <div className="filters">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher un titre…"
          />
          <SelectClass value={classId} onChange={setClass} />
          <select
            aria-label="Professeur responsable"
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
          >
            <option value="">Tous les professeurs</option>
            {data.account_access
              .filter((a) => a.role === "teacher")
              .map((a) => (
                <option key={a.user_id} value={a.user_id}>
                  {nameOf(data, a.user_id)}
                </option>
              ))}
          </select>
          <select
            aria-label="Statut"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="published">Publiés</option>
            <option value="draft">Brouillons</option>
            <option value="archived">Archivés</option>
          </select>
        </div>
        {list.length ? (
          <div className="table-wrap">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Ressource</th>
                  <th>Classe · matière</th>
                  <th>Responsable</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.slice((page - 1) * SIZE, page * SIZE).map((c) => {
                  const info = spaceInfo(data, c.spaceId);
                  return (
                    <tr key={c.id}>
                      <td data-label="Ressource">
                        <strong>{c.title}</strong>
                      </td>
                      <td data-label="Classe · matière">
                        {info.schoolClass?.name}
                        <small className="muted">{info.subject?.label}</small>
                      </td>
                      <td data-label="Responsable">
                        {info.teacher?.display_name}
                      </td>
                      <td data-label="Statut">
                        <Badge status={c.status} />
                      </td>
                      <td>
                        <div className="actions">
                          <Button
                            variant="secondary"
                            onClick={() => setPreview(c)}
                          >
                            Consulter
                          </Button>
                          {c.status !== "archived" && (
                            <Button
                              variant="ghost"
                              onClick={() => setArchive(c)}
                            >
                              Archiver
                            </Button>
                          )}
                          {tab === "course" && (
                            <Button
                              variant="ghost"
                              onClick={() => setTransfer(c)}
                            >
                              Transférer
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Aucun contenu dans cette sélection"
            description="Les ressources des professeurs apparaîtront ici."
          />
        )}
        <Pagination page={page} total={list.length} onChange={setPage} />
      </Panel>
      {preview && (
        <Modal title={preview.title} onClose={() => setPreview(null)}>
          <div className="stack">
            <Badge status={preview.status} />
            <p className="muted">
              {spaceInfo(data, preview.spaceId).schoolClass?.name} ·{" "}
              {spaceInfo(data, preview.spaceId).subject?.label}
            </p>
            <div
              className="readable-content"
              dir="auto"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {preview.body || "Ce brouillon ne contient pas encore de texte."}
            </div>
            {tab === "course" && (
              <div className="stack">
                <h3>Exercices associés</h3>
                {data.exercises
                  .filter((e) => e.course_id === preview.id)
                  .map((e) => (
                    <div className="inner-card" key={e.id}>
                      <strong>{e.title}</strong>
                      <p style={{ whiteSpace: "pre-wrap" }} dir="auto">
                        {e.instructions}
                      </p>
                      <Badge status={e.status} />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </Modal>
      )}
      {archive && (
        <ArchiveContent
          kind={tab}
          content={archive}
          onClose={() => setArchive(null)}
        />
      )}
      {transfer && (
        <TransferCourse content={transfer} onClose={() => setTransfer(null)} />
      )}
    </>
  );
}
function ArchiveContent({
  kind,
  content,
  onClose,
}: {
  kind: string;
  content: ManagedContent;
  onClose: () => void;
}) {
  const { mutate, notify } = useApp();
  return (
    <Modal title="Archiver cette ressource ?" onClose={onClose}>
      <p>
        <strong>{content.title}</strong> ne sera plus disponible dans les
        parcours courants. Les travaux et corrections associés seront conservés.
      </p>
      <AsyncForm
        onSubmit={async () => {
          await mutate("archive_content", {
            p_kind: kind,
            p_id: content.id,
            p_expected_version: content.row_version,
          });
          notify("La ressource a été archivée.");
          onClose();
        }}
      >
        <div className="actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="danger">Archiver</Button>
        </div>
      </AsyncForm>
    </Modal>
  );
}
function TransferCourse({
  content,
  onClose,
}: {
  content: ManagedContent;
  onClose: () => void;
}) {
  const { data, mutate, notify } = useApp();
  const cs = spaceInfo(data, content.spaceId).cs;
  const targets = data.teaching_spaces.filter(
    (s) =>
      s.class_subject_id === cs?.id &&
      s.is_active &&
      s.id !== content.spaceId &&
      data.account_access.some(
        (a) =>
          a.user_id === s.teacher_id &&
          a.status === "active" &&
          a.role === "teacher",
      ),
  );
  return (
    <Modal title="Transférer la responsabilité du cours" onClose={onClose}>
      <AsyncForm
        onSubmit={async (form) => {
          await mutate("transfer_course", {
            p_course_id: content.id,
            p_teaching_space_id: formValue(form, "space"),
            p_expected_version: content.row_version,
            p_reason: formValue(form, "reason"),
          });
          notify("Le cours et sa responsabilité ont été transférés.");
          onClose();
        }}
      >
        <p>
          <strong>{content.title}</strong>
        </p>
        <Notice>
          Le nouveau professeur sera responsable des contenus et des corrections
          de ce cours. Le transfert reste dans la même classe et la même
          matière.
        </Notice>
        <Field label="Nouveau professeur responsable">
          <select name="space" required>
            <option value="">Choisir un professeur affecté</option>
            {targets.map((s) => (
              <option key={s.id} value={s.id}>
                {nameOf(data, s.teacher_id)}
              </option>
            ))}
          </select>
        </Field>
        {!targets.length && (
          <Notice>
            Aucun autre professeur actif n’est affecté à cette matière de
            classe. Ajoutez une affectation avant le transfert.
          </Notice>
        )}
        <Field label="Motif du transfert">
          <textarea name="reason" rows={3} required maxLength={1000} />
        </Field>
        <div className="actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!targets.length}>Confirmer le transfert</Button>
        </div>
      </AsyncForm>
    </Modal>
  );
}

type ConnectionState = {
  teacher_id: string;
  state: string;
  updated_at: string;
};
type IntegrationJob = {
  id: string;
  meeting_id: string;
  operation: string;
  status: string;
  attempt_count: number;
  last_error_code: string | null;
  updated_at: string;
};
type IntegrationData = {
  connections: ConnectionState[];
  jobs: IntegrationJob[];
};
export function Integrations() {
  const { data, mutate, demo } = useApp();
  const [result, setResult] = useState<IntegrationData | null>(null),
    [error, setError] = useState(""),
    [tick, setTick] = useState(0),
    [selected, setSelected] = useState<IntegrationJob | null>(null);
  useEffect(() => {
    let live = true;
    setError("");
    void mutate("integration_status", {})
      .then((r) => {
        if (live) setResult(r as IntegrationData);
      })
      .catch((e) => {
        if (live) setError(errorMessage(e));
      });
    return () => {
      live = false;
    };
  }, [tick]);
  const jobs = result?.jobs || [],
    connections = result?.connections || [];
  return (
    <>
      <PageHeader
        eyebrow="DES SÉANCES BIEN PRÉPARÉES"
        title="État des intégrations"
        description="Suivez les connexions et la préparation des séances Google Meet."
        action={
          <Button variant="secondary" onClick={() => setTick((x) => x + 1)}>
            <RefreshCw size={17} />
            Actualiser
          </Button>
        }
      />
      {demo && (
        <Notice>
          Mode démonstration : les états présentés sont simulés. Aucun compte
          Google réel n’est connecté.
        </Notice>
      )}
      {error ? (
        <Panel>
          <Notice tone="error">{error}</Notice>
          <Button variant="secondary" onClick={() => setTick((x) => x + 1)}>
            Réessayer
          </Button>
        </Panel>
      ) : !result ? (
        <Panel>
          <Loading />
        </Panel>
      ) : (
        <>
          <div className="grid-3">
            <Metric
              icon={<Check />}
              label="Connexions actives"
              value={connections.filter((c) => c.state === "connected").length}
            />
            <Metric
              icon={<Clock3 />}
              label="Opérations en attente"
              value={
                jobs.filter((j) =>
                  ["pending", "processing", "retry"].includes(j.status),
                ).length
              }
            />
            <Metric
              icon={<RefreshCw />}
              label="Actions nécessaires"
              value={
                connections.filter((c) => c.state === "reconnect_required")
                  .length +
                jobs.filter((j) => ["failed", "error"].includes(j.status))
                  .length
              }
            />
          </div>
          <div className="split-layout">
            <div className="stack">
              <Panel title="Connexions des professeurs">
                {connections.length ? (
                  connections.map((c) => (
                    <div className="list-row" key={c.teacher_id}>
                      <Person
                        name={nameOf(data, c.teacher_id)}
                        subtitle={`Vérifié le ${date(c.updated_at, true)}`}
                      />
                      <Badge status={c.state} />
                    </div>
                  ))
                ) : (
                  <Empty
                    title="Aucune connexion Google"
                    description="Les professeurs connectent eux-mêmes leur compte depuis leur espace."
                  />
                )}
              </Panel>
              <Panel title="Opérations de séance">
                {jobs.length ? (
                  <div className="table-wrap">
                    <table className="responsive-table">
                      <thead>
                        <tr>
                          <th>Séance</th>
                          <th>État</th>
                          <th>Dernière tentative</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobs.slice(0, 20).map((j) => {
                          const m = data.meetings.find(
                              (m) => m.id === j.meeting_id,
                            ),
                            a = data.announcements.find(
                              (a) => a.id === m?.announcement_id,
                            );
                          return (
                            <tr key={j.id}>
                              <td data-label="Séance">
                                <strong>{a?.title || "Séance"}</strong>
                                <small className="muted">
                                  {(
                                    {
                                      create: "Création",
                                      update: "Modification",
                                      cancel: "Annulation",
                                      reconcile: "Vérification",
                                    } as Record<string, string>
                                  )[j.operation] || j.operation}
                                </small>
                              </td>
                              <td data-label="État">
                                <Badge status={j.status}>
                                  {(
                                    {
                                      pending: "En attente",
                                      processing: "En cours",
                                      retry: "Reprise prévue",
                                      failed: "À reprendre",
                                      completed: "Terminée",
                                      done: "Terminée",
                                    } as Record<string, string>
                                  )[j.status] ||
                                    statusLabel[j.status] ||
                                    j.status}
                                </Badge>
                              </td>
                              <td data-label="Dernière tentative">
                                {date(j.updated_at, true)}
                              </td>
                              <td>
                                <Button
                                  variant="secondary"
                                  onClick={() => setSelected(j)}
                                >
                                  Examiner
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty
                    title="Aucune opération en cours"
                    description="Les publications de séances apparaîtront ici."
                  />
                )}
              </Panel>
            </div>
            <Panel title="Un lien, au bon moment">
              <div className="stack">
                <Video size={32} className="mint" />
                <p>
                  Le lien Meet apparaît pour les étudiants quand la préparation
                  de la séance est terminée.
                </p>
                <p className="muted">
                  Si Google demande une reconnexion, seul le professeur
                  propriétaire peut la réaliser depuis son espace.
                </p>
                <Notice>
                  Reprendre une opération réutilise la séance existante. Cela ne
                  crée pas une deuxième séance.
                </Notice>
              </div>
            </Panel>
          </div>
        </>
      )}
      {selected && (
        <Modal title="Suivi d’une opération" onClose={() => setSelected(null)}>
          <dl className="detail-list">
            <div>
              <dt>État</dt>
              <dd>
                {(
                  {
                    pending: "En attente",
                    processing: "En cours",
                    retry: "Reprise prévue",
                    failed: "À reprendre",
                    completed: "Terminée",
                    done: "Terminée",
                  } as Record<string, string>
                )[selected.status] || selected.status}
              </dd>
            </div>
            <div>
              <dt>Tentatives</dt>
              <dd>{selected.attempt_count}</dd>
            </div>
            <div>
              <dt>Dernière mise à jour</dt>
              <dd>{date(selected.updated_at, true)}</dd>
            </div>
          </dl>
          {selected.last_error_code && (
            <Notice>{errorMessage(selected.last_error_code)}</Notice>
          )}
          {["failed", "error", "retry"].includes(selected.status) && (
            <ActionButton
              action={async () => {
                await mutate("retry_integration_job", {
                  p_job_id: selected.id,
                });
                setSelected(null);
                setTick((x) => x + 1);
              }}
              variant="primary"
            >
              <RefreshCw size={17} />
              Reprendre cette opération
            </ActionButton>
          )}
        </Modal>
      )}
    </>
  );
}

type AuditRow = {
  id: string;
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  created_at: string;
  changes?: Record<string, unknown>;
  details?: Record<string, unknown>;
};
const auditNames: Record<string, string> = {
  subject_access_changed: "Accès matière modifié",
  teacher_assignment_changed: "Affectation de professeur modifiée",
  admission_accepted: "Admission acceptée",
  admission_rejected: "Admission refusée",
  subject_access_granted: "Accès matière accordé",
  subject_access_revoked: "Accès matière retiré",
  teacher_assigned: "Professeur affecté",
  teacher_unassigned: "Affectation retirée",
  class_saved: "Classe enregistrée",
  account_status_changed: "Statut de compte modifié",
  course_transferred: "Responsabilité transférée",
  student_transferred: "Étudiant transféré",
  content_archived: "Contenu archivé",
  reference_saved: "Référentiel modifié",
};
export function AuditLog() {
  const { data, mutate } = useApp();
  const [rows, setRows] = useState<AuditRow[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [actor, setActor] = useState(""),
    [after, setAfter] = useState(""),
    [page, setPage] = useState(1),
    [tick, setTick] = useState(0),
    [selected, setSelected] = useState<AuditRow | null>(null),
    [hasMore, setHasMore] = useState(false);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    void mutate("get_audit_events", { p_limit: 100, p_offset: 0 })
      .then((r) => {
        if (live) {
          const result = (r || []) as AuditRow[];
          setRows(result);
          setHasMore(result.length === 100);
        }
      })
      .catch((e) => {
        if (live) setError(errorMessage(e));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [tick]);
  const list = rows.filter(
    (r) =>
      (!actor || r.actor_id === actor) &&
      (!after || r.created_at.slice(0, 10) >= after) &&
      `${r.action} ${auditNames[r.action] || ""} ${r.resource_type} ${nameOf(data, r.actor_id)}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  useEffect(() => setPage(1), [query, actor, after]);
  const label = (r: AuditRow) =>
    auditNames[r.action] ||
    r.action.replaceAll("_", " ").replaceAll(".", " · ");
  return (
    <>
      <PageHeader
        eyebrow="LA MÉMOIRE ADMINISTRATIVE"
        title="Journal d’activité"
        description="Les décisions, leurs auteurs et leur contexte. Un historique en lecture seule."
        action={
          <Button variant="secondary" onClick={() => setTick((x) => x + 1)}>
            <RefreshCw size={17} />
            Actualiser
          </Button>
        }
      />
      <Panel>
        <div className="filters">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher une action…"
          />
          <select
            aria-label="Auteur"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
          >
            <option value="">Tous les auteurs</option>
            {[...new Set(rows.map((r) => r.actor_id))].map((id) => (
              <option key={id} value={id}>
                {nameOf(data, id)}
              </option>
            ))}
          </select>
          <label className="field">
            <span>À partir du</span>
            <input
              type="date"
              value={after}
              onChange={(e) => setAfter(e.target.value)}
            />
          </label>
        </div>
        {error ? (
          <Notice tone="error">{error}</Notice>
        ) : loading ? (
          <Loading />
        ) : list.length ? (
          <div className="table-wrap">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Auteur</th>
                  <th>Action</th>
                  <th>Ressource</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.slice((page - 1) * SIZE, page * SIZE).map((r) => (
                  <tr key={r.id}>
                    <td data-label="Date">{date(r.created_at, true)}</td>
                    <td data-label="Auteur">{nameOf(data, r.actor_id)}</td>
                    <td data-label="Action">
                      <strong>{label(r)}</strong>
                    </td>
                    <td data-label="Ressource">
                      {(
                        {
                          class: "Classe",
                          student: "Étudiant",
                          course: "Cours",
                          teaching_space: "Groupe",
                          admission: "Admission",
                          account: "Compte",
                        } as Record<string, string>
                      )[r.resource_type] || r.resource_type}
                    </td>
                    <td>
                      <Button
                        variant="secondary"
                        onClick={() => setSelected(r)}
                      >
                        Détail
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Aucune action dans cette sélection"
            description="Les prochaines décisions administratives seront enregistrées ici."
          />
        )}
        <Pagination page={page} total={list.length} onChange={setPage} />
        {hasMore && (
          <ActionButton
            action={async () => {
              const next = (await mutate("get_audit_events", {
                p_limit: 100,
                p_offset: rows.length,
              })) as AuditRow[];
              setRows([...rows, ...next]);
              setHasMore(next.length === 100);
            }}
          >
            Charger les actions précédentes
          </ActionButton>
        )}
      </Panel>
      {selected && (
        <Modal title={label(selected)} onClose={() => setSelected(null)}>
          <dl className="detail-list">
            <div>
              <dt>Auteur</dt>
              <dd>{nameOf(data, selected.actor_id)}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{date(selected.created_at, true)}</dd>
            </div>
            <div>
              <dt>Ressource</dt>
              <dd>{selected.resource_type}</dd>
            </div>
            <div>
              <dt>Référence</dt>
              <dd className="break-word">{selected.resource_id}</dd>
            </div>
          </dl>
          <h3>Détail de la décision</h3>
          <dl className="detail-list">
            {Object.entries(selected.changes || selected.details || {})
              .filter(([k]) => !/token|password|secret/i.test(k))
              .map(([k, v]) => (
                <div key={k}>
                  <dt>
                    {(
                      {
                        before: "Avant",
                        after: "Après",
                        reason: "Motif",
                        status: "Statut",
                        active: "Actif",
                        class_id: "Classe",
                        subject_ids: "Matières",
                        name: "Nom",
                      } as Record<string, string>
                    )[k] || k.replaceAll("_", " ")}
                  </dt>
                  <dd className="break-word">
                    {typeof v === "object"
                      ? JSON.stringify(v)
                      : String(v ?? "—")}
                  </dd>
                </div>
              ))}
          </dl>
          <Notice>
            Le journal ne peut être ni modifié ni effacé depuis l’interface.
          </Notice>
        </Modal>
      )}
    </>
  );
}
