import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Calculator,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  GraduationCap,
  Play,
  Plus,
  Sparkles,
  Trophy,
  Users,
  Video,
  ChevronRight,
} from "lucide-react";
import { Markdown, RichTextEditor } from "../components/RichText";
import { Resources } from "../components/Resources";
import { useApp } from "../app/AppProvider";
import {
  Panel,
  PageHeader,
  Button,
  ButtonLink,
  Badge,
  Empty,
  Notice,
  Field,
  AsyncForm,
  SearchInput,
  Tabs,
  Pagination,
} from "../components/ui";
import {
  spaceInfo,
  date,
  rolePath,
  initials,
  videoURL,
  localToISO,
} from "../lib/utils";
import { formatInTimeZone } from "date-fns-tz";
import type { Course, Exercise } from "../lib/types";
export function CourseCard({
  course,
  compact = false,
}: {
  course: Course;
  compact?: boolean;
}) {
  const { data, user } = useApp();
  const info = spaceInfo(data, course.teaching_space_id),
    progress = data.course_progress.find(
      (p) => p.course_id === course.id && p.student_id === user!.id,
    ),
    teacher = user!.role === "teacher";
  return (
    <article className={`course-card ${compact ? "compact" : ""}`}>
      <Link
        className={`course-cover cover-${course.position % 3}`}
        to={
          teacher ? `/prof/cours/${course.id}` : `/etudiant/cours/${course.id}`
        }
        aria-label={`Ouvrir ${course.title}`}
      >
        <span className="cover-chapter">
          {course.chapter_label || "LE COURS"}
        </span>
        <div
          className={
            info.subject?.label.toLowerCase().includes("math")
              ? "math-art"
              : "subject-art"
          }
        >
          {!info.subject?.label.toLowerCase().includes("math") ? (
            <>
              <BookOpen size={44} />
              <span>{info.subject?.label || "Le cours"}</span>
            </>
          ) : course.chapter_label === "Géométrie" ? (
            <>
              a² + b² = c²
              <svg viewBox="0 0 120 80">
                <path
                  d="M15 65V12L105 65Z M15 55H25V65"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </>
          ) : (
            <>
              3x + 5 = 20<span>x = ?</span>
            </>
          )}
        </div>
        <span className="cover-play">
          <Play size={15} fill="currentColor" />
        </span>
      </Link>
      <div className="course-card-body">
        <div className="card-eyebrow">
          <span>{info.subject?.label}</span>
          <span>•</span>
          <span>{course.chapter_label || "Leçon"}</span>
        </div>
        <h3>
          <Link
            to={
              teacher
                ? `/prof/cours/${course.id}`
                : `/etudiant/cours/${course.id}`
            }
          >
            {course.title}
          </Link>
        </h3>
        <p>{course.summary}</p>
        <div className="course-card-footer">
          <span className="teacher-label">
            <span className="avatar tiny">
              {initials(info.teacher?.display_name)}
            </span>
            {info.teacher?.display_name}
          </span>
          {teacher ? (
            <Badge status={course.status} />
          ) : progress ? (
            <Badge status={progress.status} />
          ) : (
            <span className="muted">À découvrir</span>
          )}
        </div>
        {!compact && (
          <Link
            className="course-card-link"
            to={
              teacher
                ? `/prof/cours/${course.id}`
                : `/etudiant/cours/${course.id}`
            }
          >
            {teacher
              ? "Modifier le cours"
              : progress?.status === "started"
                ? "Reprendre le cours"
                : "Ouvrir le cours"}
            <ArrowRight size={17} />
          </Link>
        )}
      </div>
    </article>
  );
}
export function StudentDashboard() {
  const { data, user } = useApp();
  const courses = data.courses.filter((c) => c.status === "published"),
    progress = data.course_progress.find(
      (p) => p.student_id === user!.id && p.status === "started",
    ),
    continuing =
      courses.find((c) => c.id === progress?.course_id) || courses[0],
    enrollment = data.class_enrollments.find(
      (e) => e.student_id === user!.id && e.status === "active",
    ),
    cls = data.classes.find((c) => c.id === enrollment?.class_id),
    exercise = data.exercises.find(
      (e) =>
        !data.submissions.some(
          (s) => s.exercise_id === e.id && s.student_id === user!.id,
        ),
    ),
    reviewed = data.submissions.find(
      (s) => s.status === "reviewed" && s.student_id === user!.id,
    ),
    competition = data.competitions.find(
      (c) =>
        c.status === "published" &&
        new Date(c.closes_at).getTime() > Date.now(),
    );
  return (
    <>
      <PageHeader
        eyebrow="UN NOUVEAU JOUR POUR APPRENDRE"
        title={`Bonjour ${user!.name.split(" ")[0]} ☀`}
        description={
          <>
            {cls?.name || "Ton espace personnel"}{" "}
            <span className="dot-divider">•</span> Prêt pour un nouveau déclic ?
          </>
        }
      />
      <div className="dashboard-main-grid">
        <Panel className="continue-panel">
          <div className="panel-heading">
            <span className="eyebrow">
              <span className="tiny-dot" />
              ON REPREND OÙ TU EN ÉTAIS ?
            </span>
            <BookOpen size={20} />
          </div>
          {continuing ? (
            <>
              <div className="continue-content">
                <Badge>
                  {spaceInfo(data, continuing.teaching_space_id).subject
                    ?.label || "Mon cours"}
                </Badge>
                <h2>{continuing.title}</h2>
                <p>{continuing.summary}</p>
                <span className="teacher-label">
                  <span className="avatar small">
                    {initials(
                      spaceInfo(data, continuing.teaching_space_id).teacher
                        ?.display_name,
                    )}
                  </span>
                  Avec{" "}
                  {
                    spaceInfo(data, continuing.teaching_space_id).teacher
                      ?.display_name
                  }
                </span>
                <ButtonLink to={`/etudiant/cours/${continuing.id}`}>
                  Reprendre le cours <ArrowRight size={18} />
                </ButtonLink>
              </div>
              <div className="dashboard-math-art">
                <span className="formula-one">3x + 5 = 20</span>
                <span className="formula-two">x = 5</span>
                <svg viewBox="0 0 180 180">
                  <circle
                    cx="90"
                    cy="90"
                    r="65"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                  <path
                    d="M15 90h150M90 15v150M35 145L145 35"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </svg>
                <span className="math-spark">✧</span>
              </div>
            </>
          ) : (
            <Empty
              title="Tes cours arrivent bientôt"
              description="Tes cours publiés et autorisés s’afficheront ici."
            />
          )}
          <div className="continue-bottom">
            <span>
              <Video size={15} />
              Vidéo & cours
            </span>
            <span>
              <ClipboardList size={15} />
              Exercices pratiques
            </span>
            <span>
              <Users size={15} />
              Un prof à tes côtés
            </span>
          </div>
        </Panel>
        <Panel className="daily-panel">
          <span className="eyebrow">UNE ÉTAPE À LA FOIS</span>
          <div className="daily-icon">
            <Sparkles size={30} />
          </div>
          <h2>
            Le progrès commence
            <br />
            par une question.
          </h2>
          <p>
            Prends le temps de comprendre. Essaie, recommence, puis demande de
            l’aide à ton professeur.
          </p>
          <Link to="/etudiant/matieres">
            Retrouver mes matières <ArrowUpRight size={17} />
          </Link>
        </Panel>
      </div>
      <div className="student-task-grid">
        <Panel className="task-card">
          <div className="task-icon orange">
            <ClipboardList size={22} />
          </div>
          <span className="eyebrow">LE PROCHAIN PETIT PAS</span>
          <h2>À toi de pratiquer.</h2>
          {exercise ? (
            <>
              <h3>{exercise.title}</h3>
              <p>
                <Clock size={14} />À rendre le {date(exercise.due_at)}
              </p>
              <ButtonLink
                to={`/etudiant/exercices/${exercise.id}`}
                variant="secondary"
              >
                Faire l’exercice <ArrowRight size={16} />
              </ButtonLink>
            </>
          ) : (
            <p>Aucun exercice en attente. Tu es à jour.</p>
          )}
        </Panel>
        <Panel className="task-card">
          <div className="task-icon mint">
            <CheckCircle2 size={22} />
          </div>
          <span className="eyebrow">LES RETOURS FONT AVANCER</span>
          <h2>Un regard sur ton travail.</h2>
          {reviewed ? (
            <>
              <h3>Ta correction est disponible</h3>
              <p>Lis les conseils de ton professeur pour la suite.</p>
              <ButtonLink
                to={`/etudiant/mes-travaux/${reviewed.id}`}
                variant="secondary"
              >
                Voir ma correction <ArrowRight size={16} />
              </ButtonLink>
            </>
          ) : (
            <p>
              Les corrections publiées par tes professeurs apparaîtront ici.
            </p>
          )}
        </Panel>
        {competition && (
          <Panel className="task-card challenge-task">
            <div className="task-icon yellow">
              <Trophy size={22} />
            </div>
            <span className="eyebrow">ET SI TU TE LANÇAIS ?</span>
            <h2>Une idée. Un défi.</h2>
            <h3>{competition.title}</h3>
            <p>À ton rythme, jusqu’au {date(competition.closes_at)}.</p>
            <ButtonLink
              to={`/etudiant/competitions/${competition.id}`}
              variant="secondary"
            >
              Découvrir le défi <ArrowRight size={16} />
            </ButtonLink>
          </Panel>
        )}
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">LA SUITE DE TON PARCOURS</span>
          <h2>Il y a encore tant à découvrir.</h2>
        </div>
        <Link to="/etudiant/matieres" className="text-link">
          Tous mes cours <ArrowRight size={16} />
        </Link>
      </div>
      <div className="grid-3">
        {courses.slice(0, 3).map((c) => (
          <CourseCard key={c.id} course={c} compact />
        ))}
      </div>
      <Panel
        className="dashboard-announcement"
        title="Du côté de tes professeurs"
        action={
          <Link to="/etudiant/annonces" className="text-link">
            Toutes les annonces <ArrowRight size={15} />
          </Link>
        }
      >
        {data.announcements
          .filter((a) => a.type === "notice" && a.status === "published")
          .slice(0, 2)
          .map((a) => (
            <div className="list-row" key={a.id}>
              <span className="avatar">
                {initials(
                  spaceInfo(data, a.teaching_space_id).teacher?.display_name,
                )}
              </span>
              <div>
                <h3>{a.title}</h3>
                <p>{a.body}</p>
              </div>
              <span className="muted desktop-only">{date(a.published_at)}</span>
            </div>
          ))}
        {!data.announcements.length && (
          <Empty
            title="Tu es à jour"
            description="Les nouvelles annonces apparaîtront ici."
          />
        )}
      </Panel>
    </>
  );
}
export function TeacherDashboard() {
  const { data, user, invoke } = useApp();
  const [google, setGoogle] = useState<{ state: string } | null>(null);
  useEffect(() => {
    void invoke<{ state: string }>("google-status")
      .then(setGoogle)
      .catch(() => setGoogle({ state: "error" }));
  }, []);
  const spaces = data.teaching_spaces.filter(
      (s) => s.teacher_id === user!.id && s.is_active,
    ),
    copies = data.submissions.filter((s) => s.status === "submitted"),
    courses = data.courses.filter((c) =>
      spaces.some((s) => s.id === c.teaching_space_id),
    );
  return (
    <>
      <PageHeader
        eyebrow="TRANSMETTRE, UN DÉCLIC À LA FOIS"
        title={`Bonjour ${user!.name.split(" ")[0]}`}
        description="Vos groupes, vos contenus et les travaux qui vous attendent."
        action={
          <ButtonLink to="/prof/cours/nouveau">
            <Plus size={18} />
            Créer un cours
          </ButtonLink>
        }
      />
      <div className="grid-3">
        {[
          [spaces.length, "Groupes pédagogiques", Users],
          [copies.length, "Copies à corriger", ClipboardList],
          [
            courses.filter((c) => c.status === "published").length,
            "Cours publiés",
            BookOpen,
          ],
        ].map(([n, label, Icon]) => {
          const I = Icon as typeof Users;
          return (
            <Panel key={label as string} className="metric-card">
              <I size={23} />
              <strong>{n as number}</strong>
              <span>{label as string}</span>
            </Panel>
          );
        })}
      </div>
      <div className="split-layout">
        <Panel
          title="Ces travaux attendent votre regard"
          action={
            <Link className="text-link" to="/prof/copies">
              Toutes les copies <ArrowRight size={15} />
            </Link>
          }
        >
          {copies.slice(0, 5).map((s) => (
            <div className="list-row" key={s.id}>
              <span className="avatar">
                {initials(
                  data.profiles.find((p) => p.id === s.student_id)
                    ?.display_name,
                )}
              </span>
              <div>
                <h3>
                  {
                    data.profiles.find((p) => p.id === s.student_id)
                      ?.display_name
                  }
                </h3>
                <p>
                  {data.exercises.find((e) => e.id === s.exercise_id)?.title ||
                    data.competitions.find((c) => c.id === s.competition_id)
                      ?.title}
                </p>
              </div>
              <ButtonLink to={`/prof/copies/${s.id}`} variant="secondary">
                Corriger <ArrowRight size={15} />
              </ButtonLink>
            </div>
          ))}
          {!copies.length && (
            <Empty
              title="Toutes les copies sont à jour"
              description="Les prochains travaux remis apparaîtront ici."
            />
          )}
        </Panel>
        <Panel className="teacher-google-card">
          <div className="google-icon">G</div>
          <h2>
            Retrouvez vos élèves
            <br />
            en direct.
          </h2>
          <p>
            Connectez votre compte Google pour créer vos séances et partager
            automatiquement un lien Meet.
          </p>
          {google ? (
            <Badge status={google.state} />
          ) : (
            <span className="muted small-text">
              Vérification de la connexion…
            </span>
          )}
          <ButtonLink to="/prof/integrations/google" variant="secondary">
            Gérer ma connexion <ArrowUpRight size={16} />
          </ButtonLink>
        </Panel>
      </div>
      <div className="section-heading">
        <h2>Vos cours récents</h2>
        <Link className="text-link" to="/prof/cours">
          La bibliothèque <ArrowRight size={16} />
        </Link>
      </div>
      <div className="grid-3">
        {courses.slice(0, 3).map((c) => (
          <CourseCard key={c.id} course={c} compact />
        ))}
      </div>
    </>
  );
}
export function Subjects() {
  const { data, user } = useApp();
  const allowed = data.student_subject_access.filter(
    (a) =>
      a.status === "active" &&
      data.class_enrollments.some(
        (e) =>
          e.id === a.enrollment_id &&
          e.student_id === user!.id &&
          e.status === "active",
      ),
  );
  return (
    <>
      <PageHeader
        eyebrow="CHAQUE MATIÈRE OUVRE UN MONDE"
        title="Mes matières"
        description="Les matières auxquelles l’administration t’a donné accès."
      />
      <div className="grid-2">
        {data.class_subjects
          .filter((cs) => allowed.some((a) => a.class_subject_id === cs.id))
          .map((cs) => {
            const sub = data.subjects.find((s) => s.id === cs.subject_id),
              spaces = data.teaching_spaces.filter(
                (s) => s.class_subject_id === cs.id,
              );
            return (
              <Panel className="subject-card" key={cs.id}>
                <span className="subject-icon">
                  <Calculator size={30} />
                </span>
                <span className="eyebrow">
                  {data.classes.find((c) => c.id === cs.class_id)?.name}
                </span>
                <h2>{sub?.label}</h2>
                <p>
                  Comprendre les idées, explorer les méthodes et trouver ta
                  solution.
                </p>
                <div className="subject-teachers">
                  {spaces.map((s) => (
                    <span key={s.id} className="teacher-label">
                      <span className="avatar tiny">
                        {initials(
                          data.profiles.find((p) => p.id === s.teacher_id)
                            ?.display_name,
                        )}
                      </span>
                      {
                        data.profiles.find((p) => p.id === s.teacher_id)
                          ?.display_name
                      }
                    </span>
                  ))}
                </div>
                <div className="subject-card-bottom">
                  <span>
                    {
                      data.courses.filter(
                        (c) =>
                          spaces.some((s) => s.id === c.teaching_space_id) &&
                          c.status === "published",
                      ).length
                    }{" "}
                    cours publiés
                  </span>
                  <ButtonLink to={`/etudiant/matieres/${cs.id}`}>
                    Voir les cours <ArrowRight size={17} />
                  </ButtonLink>
                </div>
              </Panel>
            );
          })}
      </div>
      {!allowed.length && (
        <Panel>
          <Empty
            title="Tes accès ne sont pas encore attribués"
            description="Contacte ton administration pour connaître les matières qui te sont ouvertes."
          />
        </Panel>
      )}
      <Notice>
        Une matière manque ? Adresse-toi à ton administration. Les accès sont
        attribués individuellement.
      </Notice>
    </>
  );
}
export function Courses() {
  const { data, user, hasMore, loadMore } = useApp(),
    { id } = useParams();
  const teacher = user!.role === "teacher";
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("Tous"),
    [prof, setProf] = useState(""),
    [page, setPage] = useState(1);
  const spaces = id
    ? data.teaching_spaces.filter((s) => s.class_subject_id === id)
    : data.teaching_spaces;
  const rows = data.courses.filter(
    (c) =>
      spaces.some((s) => s.id === c.teaching_space_id) &&
      (teacher || c.status === "published") &&
      c.title.toLowerCase().includes(search.toLowerCase()) &&
      (!prof ||
        spaces.find((s) => s.id === c.teaching_space_id)?.teacher_id ===
          prof) &&
      (status === "Tous" ||
        (teacher
          ? c.status ===
            (
              {
                Publiés: "published",
                Brouillons: "draft",
                Archivés: "archived",
              } as Record<string, string>
            )[status]
          : data.course_progress.some(
              (p) =>
                p.course_id === c.id &&
                p.status === (status === "Terminés" ? "completed" : "started"),
            ))),
  );
  useEffect(() => setPage(1), [search, status, prof]);
  const sub = data.subjects.find(
    (s) => s.id === data.class_subjects.find((cs) => cs.id === id)?.subject_id,
  );
  return (
    <>
      <PageHeader
        eyebrow={
          teacher
            ? "VOTRE BIBLIOTHÈQUE PÉDAGOGIQUE"
            : "UNE NOTION APRÈS L’AUTRE"
        }
        title={teacher ? "Mes cours" : sub?.label || "Mes cours"}
        description={
          teacher
            ? "Des idées à transmettre, des connaissances à partager."
            : "Les cours et exercices de ta matière, avec tes professeurs."
        }
        back={!teacher ? "/etudiant/matieres" : undefined}
        action={
          teacher ? (
            <ButtonLink to="/prof/cours/nouveau">
              <Plus size={18} />
              Nouveau cours
            </ButtonLink>
          ) : undefined
        }
      />
      <Panel className="filter-panel">
        <Tabs
          value={status}
          onChange={setStatus}
          options={
            teacher
              ? ["Tous", "Publiés", "Brouillons", "Archivés"]
              : ["Tous", "En cours", "Terminés"]
          }
        />
        <div className="filters">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Rechercher un cours…"
          />
          {!teacher && (
            <select
              aria-label="Filtrer par professeur"
              value={prof}
              onChange={(e) => setProf(e.target.value)}
            >
              <option value="">Tous les professeurs</option>
              {[...new Set(spaces.map((s) => s.teacher_id))].map((id) => (
                <option key={id} value={id}>
                  {data.profiles.find((p) => p.id === id)?.display_name}
                </option>
              ))}
            </select>
          )}
        </div>
      </Panel>
      <div className="grid-3">
        {rows.slice((page - 1) * 8, page * 8).map((c) => (
          <CourseCard course={c} key={c.id} />
        ))}
      </div>
      {!rows.length && (
        <Panel>
          <Empty
            title="Aucun cours dans cette sélection"
            description="Essaie une autre recherche ou reviens un peu plus tard."
          />
        </Panel>
      )}
      <Pagination page={page} total={rows.length} onChange={setPage} />
      {hasMore.courses && (
        <Button variant="secondary" onClick={() => void loadMore("courses")}>
          Charger les cours suivants
        </Button>
      )}
    </>
  );
}
export function Groups() {
  const { data } = useApp(),
    { id } = useParams();
  const [tab, setTab] = useState("Cours");
  const spaces = data.teaching_spaces.filter((s) => s.is_active);
  const s = spaces.find((s) => s.id === id),
    info = s ? spaceInfo(data, s) : null;
  if (id && !s) return <Unavailable />;
  const students = info
    ? data.class_enrollments.filter(
        (e) =>
          e.status === "active" &&
          data.student_subject_access.some(
            (a) =>
              a.enrollment_id === e.id &&
              a.class_subject_id === info.cs?.id &&
              a.status === "active",
          ),
      )
    : [];
  return (
    <>
      <PageHeader
        eyebrow="UN GROUPE, DES POSSIBILITÉS"
        title={
          info
            ? `${info.schoolClass?.name} · ${info.subject?.label}`
            : "Mes groupes"
        }
        description={
          info
            ? `${students.length} étudiants autorisés · 2026–2027`
            : "Les classes et les matières qui vous sont affectées."
        }
        back={id ? "/prof/groupes" : undefined}
        action={
          id ? (
            <ButtonLink to={`/prof/cours/nouveau?groupe=${id}`}>
              <Plus size={17} />
              Créer un cours
            </ButtonLink>
          ) : undefined
        }
      />
      {!id ? (
        <div className="grid-2">
          {spaces.map((s) => {
            const i = spaceInfo(data, s);
            const n = data.class_enrollments.filter(
              (e) =>
                e.status === "active" &&
                data.student_subject_access.some(
                  (a) =>
                    a.enrollment_id === e.id &&
                    a.class_subject_id === i.cs?.id &&
                    a.status === "active",
                ),
            ).length;
            return (
              <Panel className="group-card" key={s.id}>
                <span className="subject-icon">
                  <Users size={26} />
                </span>
                <Badge>{i.subject?.label}</Badge>
                <h2>{i.schoolClass?.name}</h2>
                <p>{n} étudiants autorisés</p>
                <div className="subject-card-bottom">
                  <span>
                    {
                      data.courses.filter(
                        (c) =>
                          c.teaching_space_id === s.id &&
                          c.status === "published",
                      ).length
                    }{" "}
                    cours publiés
                  </span>
                  <ButtonLink to={`/prof/groupes/${s.id}`} variant="secondary">
                    Ouvrir le groupe <ArrowRight size={16} />
                  </ButtonLink>
                </div>
              </Panel>
            );
          })}
        </div>
      ) : (
        <>
          <Tabs
            options={["Cours", "Étudiants", "Annonces"]}
            value={tab}
            onChange={setTab}
          />
          {tab === "Cours" ? (
            <div className="grid-3">
              {data.courses
                .filter((c) => c.teaching_space_id === id)
                .map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
            </div>
          ) : tab === "Étudiants" ? (
            <Panel>
              {students.map((e) => (
                <div className="list-row" key={e.id}>
                  <span className="avatar">
                    {initials(
                      data.profiles.find((p) => p.id === e.student_id)
                        ?.display_name,
                    )}
                  </span>
                  <div>
                    <h3>
                      {
                        data.profiles.find((p) => p.id === e.student_id)
                          ?.display_name
                      }
                    </h3>
                    <p>
                      {
                        data.submissions.filter(
                          (s) => s.student_id === e.student_id,
                        ).length
                      }{" "}
                      travaux remis
                    </p>
                  </div>
                </div>
              ))}
              {!students.length && <Empty title="Aucun étudiant autorisé" />}
            </Panel>
          ) : (
            <Panel>
              {data.announcements
                .filter((a) => a.teaching_space_id === id)
                .map((a) => (
                  <div className="list-row" key={a.id}>
                    <div>
                      <h3>{a.title}</h3>
                      <p>{a.body}</p>
                    </div>
                    <Badge status={a.status} />
                  </div>
                ))}
            </Panel>
          )}
        </>
      )}
      <Notice>
        Les affectations et les accès des étudiants sont gérés par
        l’administration.
      </Notice>
    </>
  );
}
export function Unavailable({ notFound = false }: { notFound?: boolean }) {
  const { user } = useApp();
  return (
    <Panel className="unavailable">
      <BookOpen size={44} />
      <span className="eyebrow">ON RETROUVE LE BON CHEMIN</span>
      <h1>
        {notFound
          ? "Cette page est introuvable."
          : "Ce contenu n’est pas accessible."}
      </h1>
      <p>
        {notFound
          ? "Le lien a peut-être changé. Retrouve ton parcours depuis ton espace."
          : "Ton accès à cette matière ou à ce contenu a peut-être changé."}
      </p>
      <ButtonLink to={user ? rolePath(user.role) : "/"}>
        Retour à mon espace <ArrowRight size={17} />
      </ButtonLink>
    </Panel>
  );
}
export function CourseReader() {
  const { data, user, mutate, demo, fileURL } = useApp(),
    { id } = useParams();
  const course = data.courses.find((c) => c.id === id);
  const [tab, setTab] = useState("Le cours"),
    [play, setPlay] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    setPlay(false);
    setTab("Le cours");
    setError("");
    if (course && user?.role === "student")
      void mutate("set_course_progress", {
        p_course_id: course.id,
        p_status:
          data.course_progress.find((p) => p.course_id === course.id)?.status ||
          "started",
      }).catch(() => {});
  }, [id]);
  if (!course) return <Unavailable />;
  const info = spaceInfo(data, course.teaching_space_id),
    exercises = data.exercises.filter(
      (e) => e.course_id === course.id && e.status === "published",
    ),
    complete = data.course_progress.some(
      (p) => p.course_id === course.id && p.status === "completed",
    );
  const siblings = data.courses
    .filter(
      (c) =>
        c.status === "published" &&
        spaceInfo(data, c.teaching_space_id).cs?.id === info.cs?.id,
    )
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
  const index = siblings.findIndex((c) => c.id === course.id);
  return (
    <>
      <PageHeader
        eyebrow={`${info.subject?.label} / ${course.chapter_label || "Leçon"}`}
        title={course.title}
        description={
          <span className="teacher-label">
            <span className="avatar small">
              {initials(info.teacher?.display_name)}
            </span>
            {info.teacher?.display_name} <span className="dot-divider">•</span>
            {info.schoolClass?.name}
          </span>
        }
        back={`/etudiant/matieres/${info.cs?.id}`}
      />
      <div className="reader-layout">
        <div className="stack">
          <div className="video-player">
            {play && course.video_id ? (
              <iframe
                title={`Vidéo : ${course.title}`}
                src={
                  course.video_provider === "youtube"
                    ? `https://www.youtube-nocookie.com/embed/${course.video_id}?autoplay=1`
                    : `https://player.vimeo.com/video/${course.video_id}?autoplay=1`
                }
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <>
                <div className="video-blackboard">
                  <span>{course.chapter_label}</span>
                  <strong>
                    {course.chapter_label === "Géométrie"
                      ? "a² + b² = c²"
                      : "3x + 5 = 20"}
                  </strong>
                  <small>COMPRENDRE AVANT TOUT.</small>
                </div>
                <button
                  className="video-play"
                  onClick={() =>
                    course.video_id
                      ? setPlay(true)
                      : setError(
                          demo
                            ? "Démonstration : aucune vidéo réelle n’a été configurée pour ce cours."
                            : "La vidéo de ce cours est indisponible.",
                        )
                  }
                  aria-label="Lire la vidéo"
                >
                  <Play size={29} fill="currentColor" />
                </button>
                <span className="video-caption">
                  L’explication de ton professeur
                </span>
              </>
            )}
          </div>
          {error && <Notice>{error}</Notice>}
          <Panel className="lesson-panel">
            <Tabs
              options={["Le cours", "Documents"]}
              value={tab}
              onChange={setTab}
            />
            {tab === "Le cours" ? (
              <div
                className="lesson-body"
                dir={course.content_language === "ar" ? "rtl" : "auto"}
              >
                <span className="eyebrow">PRENDS LE TEMPS DE COMPRENDRE</span>
                <h2>{course.chapter_label || "Les idées essentielles"}</h2>
                <Markdown>{course.body}</Markdown>
              </div>
            ) : (
              <div className="stack">
                {data.course_resources
                  .filter((r) => r.course_id === id)
                  .map((r) => (
                    <button
                      className="document-link"
                      key={r.id}
                      onClick={async () => {
                        try {
                          const url = await fileURL(r.file_id);
                          window.open(url, "_blank", "noopener,noreferrer");
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      <FileText size={22} />
                      {r.label ||
                        data.files.find((f) => f.id === r.file_id)
                          ?.original_name}
                      <ArrowUpRight size={17} />
                    </button>
                  ))}
                {!data.course_resources.some((r) => r.course_id === id) && (
                  <Empty
                    title="Pas de document supplémentaire"
                    description="Tout ce qu’il faut pour commencer est dans le cours."
                  />
                )}
              </div>
            )}
          </Panel>
          <div className="actions">
            <Button
              onClick={async () => {
                try {
                  await mutate("set_course_progress", {
                    p_course_id: course.id,
                    p_status: complete ? "started" : "completed",
                  });
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
              variant={complete ? "secondary" : "primary"}
            >
              <CheckCircle2 size={18} />
              {complete ? "Cours marqué terminé" : "Marquer comme terminé"}
            </Button>
            <span className="muted small-text">
              À toi de décider quand tu es prêt.
            </span>
          </div>
          <nav
            className="course-pagination"
            aria-label="Navigation entre les cours"
          >
            {siblings[index - 1] && (
              <ButtonLink
                variant="secondary"
                to={"/etudiant/cours/" + siblings[index - 1].id}
              >
                Cours précédent
              </ButtonLink>
            )}
            {siblings[index + 1] && (
              <ButtonLink
                variant="secondary"
                to={"/etudiant/cours/" + siblings[index + 1].id}
              >
                Cours suivant <ArrowRight size={16} />
              </ButtonLink>
            )}
          </nav>
        </div>
        <aside className="stack">
          <Panel title="À toi de pratiquer">
            <p className="muted">
              La meilleure façon de comprendre, c’est d’essayer.
            </p>
            <div className="exercise-list">
              {exercises.map((e, i) => {
                const s = data.submissions.find(
                  (s) => s.exercise_id === e.id && s.student_id === user!.id,
                );
                return (
                  <Link key={e.id} to={`/etudiant/exercices/${e.id}`}>
                    <span className="exercise-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <strong>{e.title}</strong>
                      <small>
                        {s ? (
                          <Badge status={s.status} />
                        ) : (
                          <>À faire · /{e.max_score}</>
                        )}
                      </small>
                    </div>
                    <ChevronRight size={18} />
                  </Link>
                );
              })}
            </div>
            {!exercises.length && (
              <Empty title="Les exercices arrivent bientôt" />
            )}
          </Panel>
          <Panel className="study-tip">
            <LightbulbIcon />
            <h3>Un doute ? C’est normal.</h3>
            <p>
              Reprends l’exemple, pose ton raisonnement et vérifie chaque étape.
            </p>
          </Panel>
        </aside>
      </div>
    </>
  );
}
function LightbulbIcon() {
  return <Sparkles className="mint-text" size={24} />;
}
export function CourseEditor() {
  const { data, mutate, notify } = useApp(),
    { id } = useParams(),
    navigate = useNavigate();
  const initial = data.courses.find((c) => c.id === id);
  const [title, setTitle] = useState(initial?.title || ""),
    [body, setBody] = useState(initial?.body || ""),
    [video, setVideo] = useState(
      initial?.video_id
        ? initial.video_provider === "youtube"
          ? `https://www.youtube.com/watch?v=${initial.video_id}`
          : `https://vimeo.com/${initial.video_id}`
        : "",
    ),
    [space, setSpace] = useState(
      initial?.teaching_space_id ||
        new URLSearchParams(window.location.search).get("groupe") ||
        data.teaching_spaces[0]?.id ||
        "",
    ),
    [saved, setSaved] = useState<Course | undefined>(initial),
    [error, setError] = useState("");
  const normalized = videoURL(video);
  const exercises = data.exercises.filter(
    (e) => e.course_id === (saved?.id || id),
  );
  if (id && !initial) return <Unavailable />;
  return (
    <>
      <PageHeader
        eyebrow="UNE IDÉE À TRANSMETTRE"
        title={id ? "Modifier le cours" : "Créer un cours"}
        description="Préparez le contenu, la vidéo et les exercices de votre leçon."
        back="/prof/cours"
        action={<Badge status={saved?.status || "draft"} />}
      />
      <div className="split-layout">
        <Panel>
          <AsyncForm
            success="Le cours a été enregistré."
            onSubmit={async (f) => {
              const fd = new FormData(f);
              const c = await mutate<Course>("save_course", {
                p_id: saved?.id || null,
                p_expected_version: saved?.row_version || null,
                p_data: {
                  title,
                  body,
                  teaching_space_id: space,
                  summary: fd.get("summary"),
                  chapter_label: fd.get("chapter"),
                  content_language: fd.get("language"),
                  video_provider: normalized?.provider || null,
                  video_id: normalized?.id || null,
                  position: Number(fd.get("position") || 0),
                },
              });
              setSaved(c);
              notify("Le cours a été enregistré.");
              if (!id) navigate(`/prof/cours/${c.id}`, { replace: true });
            }}
          >
            <h2>Les idées essentielles</h2>
            <Field label="Titre du cours">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
              />
            </Field>
            <Field label="Groupe pédagogique">
              <select
                value={space}
                onChange={(e) => setSpace(e.target.value)}
                required
              >
                {data.teaching_spaces
                  .filter((s) => s.is_active)
                  .map((s) => {
                    const i = spaceInfo(data, s);
                    return (
                      <option key={s.id} value={s.id}>
                        {i.schoolClass?.name} · {i.subject?.label}
                      </option>
                    );
                  })}
              </select>
            </Field>
            <div className="grid-2">
              <Field label="Chapitre">
                <input
                  name="chapter"
                  defaultValue={initial?.chapter_label || ""}
                />
              </Field>
              <Field label="Langue du contenu">
                <select
                  name="language"
                  defaultValue={initial?.content_language || "fr"}
                >
                  <option value="fr">Français</option>
                  <option value="ar">Arabe / Darija</option>
                </select>
              </Field>
            </div>
            <Field label="Résumé">
              <textarea
                name="summary"
                rows={2}
                defaultValue={initial?.summary || ""}
              />
            </Field>
            <RichTextEditor
              label="Contenu du cours"
              value={body}
              onChange={setBody}
            />
            <Field
              label="Lien vidéo YouTube ou Vimeo"
              hint="Une URL HTTPS reconnue est nécessaire pour publier."
            >
              <input
                type="url"
                value={video}
                onChange={(e) => setVideo(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
              />
            </Field>
            {video && !normalized && (
              <Notice tone="error">Ce lien vidéo n’est pas reconnu.</Notice>
            )}
            <Field label="Ordre d’affichage">
              <input
                type="number"
                name="position"
                min="0"
                defaultValue={initial?.position || 0}
              />
            </Field>
            <div className="actions">
              <Button type="submit">Enregistrer le cours</Button>
              <ButtonLink variant="ghost" to="/prof/cours">
                Annuler
              </ButtonLink>
            </div>
          </AsyncForm>
        </Panel>
        <aside className="stack">
          <Panel title="Prêt à transmettre ?">
            <div className="publication-checklist">
              {[
                [!!title.trim(), "Un titre clair"],
                [!!body.trim(), "Un contenu exploitable"],
                [!!normalized, "Une vidéo valide"],
                [exercises.length > 0, "Au moins un exercice"],
              ].map(([valid, text]) => (
                <div key={text as string} className={valid ? "valid" : ""}>
                  <CheckCircle2 size={18} />
                  {text as string}
                </div>
              ))}
            </div>
            <Button
              disabled={
                !saved || !title || !body || !normalized || !exercises.length
              }
              onClick={async () => {
                try {
                  await mutate("publish_course", {
                    p_course_id: saved!.id,
                    p_expected_version: saved!.row_version,
                  });
                  notify("Le cours et ses exercices sont publiés.");
                  navigate("/prof/cours");
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Publier le cours <ArrowUpRight size={16} />
            </Button>
            {error && <Notice tone="error">{error}</Notice>}
          </Panel>
          <Panel title="Les exercices">
            {exercises.map((e) => (
              <Link
                className="document-link"
                to={`/prof/cours/${saved?.id}/exercices/${e.id}`}
                key={e.id}
              >
                <ClipboardList size={18} />
                {e.title}
                <ChevronRight size={16} />
              </Link>
            ))}
            {saved ? (
              <ButtonLink
                variant="secondary"
                to={`/prof/cours/${saved.id}/exercices/nouveau`}
              >
                <Plus size={17} />
                Ajouter un exercice
              </ButtonLink>
            ) : (
              <p className="muted">
                Enregistrez le cours avant de préparer un exercice.
              </p>
            )}
          </Panel>
          <CourseDocuments id={saved?.id} />
        </aside>
      </div>
    </>
  );
}
function CourseDocuments({ id }: { id?: string }) {
  const { upload, data, notify } = useApp();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Panel title="Documents de cours">
      <p className="muted">PDF ou image · 20 Mo par fichier.</p>
      {data.course_resources
        .filter((r) => r.course_id === id)
        .map((r) => (
          <div className="document-link" key={r.id}>
            <FileText size={18} />
            {r.label ||
              data.files.find((f) => f.id === r.file_id)?.original_name}
          </div>
        ))}
      <label className={`button secondary ${!id || busy ? "disabled" : ""}`}>
        <Plus size={17} />
        {busy ? "Envoi en cours…" : "Ajouter un document"}
        <input
          className="sr-only"
          type="file"
          disabled={!id || busy}
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f || !id) return;
            setBusy(true);
            setError("");
            try {
              if (f.size > 20 * 1024 * 1024)
                throw Error("Le fichier dépasse 20 Mo.");
              await upload(f, "course", id, () => {});
              notify("Le document est prêt.");
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {error && <Notice tone="error">{error}</Notice>}
    </Panel>
  );
}
export function ExerciseEditor() {
  const { data, mutate, notify } = useApp(),
    { courseId, exerciseId } = useParams(),
    navigate = useNavigate();
  const course = data.courses.find((c) => c.id === courseId),
    e = data.exercises.find((e) => e.id === exerciseId);
  if (!course || (exerciseId && exerciseId !== "nouveau" && !e))
    return <Unavailable />;
  return (
    <>
      <PageHeader
        eyebrow={course.title}
        title={e ? "Modifier l’exercice" : "Ajouter un exercice"}
        description="Une consigne claire, un cadre pour progresser."
        back={`/prof/cours/${course.id}`}
      />
      <Panel>
        <AsyncForm
          onSubmit={async (f) => {
            const fd = new FormData(f);
            await mutate<Exercise>("save_exercise", {
              p_id: e?.id || null,
              p_expected_version: e?.row_version || null,
              p_data: {
                course_id: course.id,
                title: fd.get("title"),
                instructions: fd.get("instructions"),
                max_score: Number(fd.get("score")),
                difficulty: fd.get("difficulty"),
                due_at: fd.get("due")
                  ? localToISO(String(fd.get("due")))
                  : null,
                allow_late: fd.get("late") === "on",
                status: fd.get("publish") === "on" ? "published" : "draft",
                position: 1,
              },
            });
            notify("L’exercice a été enregistré.");
            navigate(`/prof/cours/${course.id}`);
          }}
        >
          <div className="split-layout">
            <div>
              <Field label="Titre">
                <input name="title" defaultValue={e?.title} required />
              </Field>
              <Field label="Consigne">
                <textarea
                  name="instructions"
                  defaultValue={e?.instructions}
                  rows={12}
                  required
                  dir="auto"
                />
              </Field>
              {e && (
                <Resources
                  kind="exercise"
                  id={e.id}
                  editable={
                    !data.submissions.some(
                      (s) => s.exercise_id === e.id && s.status !== "draft",
                    )
                  }
                />
              )}
            </div>
            <div>
              <Field label="Barème maximal">
                <input
                  name="score"
                  type="number"
                  min="1"
                  max="1000"
                  step="0.5"
                  defaultValue={e?.max_score || 20}
                  required
                />
              </Field>
              <Field label="Date limite · Africa/Casablanca">
                <input
                  name="due"
                  type="datetime-local"
                  defaultValue={
                    e?.due_at
                      ? formatInTimeZone(
                          e.due_at,
                          "Africa/Casablanca",
                          "yyyy-MM-dd'T'HH:mm",
                        )
                      : ""
                  }
                />
              </Field>
              <Field label="Difficulté">
                <select name="difficulty" defaultValue={e?.difficulty || ""}>
                  <option value="">Non précisée</option>
                  <option>Facile</option>
                  <option>Intermédiaire</option>
                  <option>Avancé</option>
                </select>
              </Field>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="late"
                  defaultChecked={e?.allow_late}
                />
                Autoriser les remises en retard
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="publish"
                  defaultChecked={e?.status === "published"}
                />
                Publier avec le cours
              </label>
              <Notice>
                Après réception d’une copie, l’énoncé et le barème sont
                protégés.
              </Notice>
            </div>
          </div>
          <div className="actions">
            <Button type="submit">Enregistrer l’exercice</Button>
            <ButtonLink to={`/prof/cours/${course.id}`} variant="ghost">
              Annuler
            </ButtonLink>
          </div>
        </AsyncForm>
      </Panel>
    </>
  );
}
