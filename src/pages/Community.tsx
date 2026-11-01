import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Megaphone,
  Plus,
  Send,
  Trophy,
  Video,
  X,
} from "lucide-react";
import { Resources } from "../components/Resources";
import { useApp } from "../app/AppProvider";
import {
  AsyncForm,
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
} from "../components/ui";
import {
  clockTime,
  date,
  initials,
  localToISO,
  rolePath,
  spaceInfo,
} from "../lib/utils";
import { formatInTimeZone } from "date-fns-tz";
import type { Announcement, Competition, Meeting } from "../lib/types";
import { Unavailable } from "./Learning";
import { UploadWork } from "./Work";
export function Competitions() {
  const { data, user, hasMore, loadMore } = useApp();
  const teacher = user!.role === "teacher";
  const [tab, setTab] = useState("Toutes"),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1);
  const current = Date.now();
  const rows = data.competitions.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) &&
      (tab === "Toutes" ||
        (tab === "Ouverts" &&
          c.status === "published" &&
          Date.parse(c.opens_at) <= current &&
          Date.parse(c.closes_at) > current) ||
        (tab === "À venir" && Date.parse(c.opens_at) > current) ||
        (tab === "Terminés" &&
          (Date.parse(c.closes_at) <= current || c.status === "closed")) ||
        (tab === "Brouillons" && c.status === "draft")),
  );
  useEffect(() => setPage(1), [search, tab]);
  return (
    <>
      <PageHeader
        eyebrow="LA CURIOSITÉ PASSE À L’ACTION"
        title={teacher ? "Challenges et concours" : "À toi de relever le défi."}
        description={
          teacher
            ? "Créez des occasions d’apprendre autrement."
            : "Une occasion de chercher, d’essayer et de te surprendre."
        }
        action={
          teacher ? (
            <ButtonLink to="/prof/competitions/nouvelle">
              <Plus size={18} />
              Créer une compétition
            </ButtonLink>
          ) : undefined
        }
      />
      <Panel className="filter-panel">
        <Tabs
          options={
            teacher
              ? ["Toutes", "Ouverts", "À venir", "Terminés", "Brouillons"]
              : ["Toutes", "Ouverts", "À venir", "Terminés"]
          }
          value={tab}
          onChange={setTab}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher un défi…"
        />
      </Panel>
      <div className="grid-2">
        {rows.slice((page - 1) * 8, page * 8).map((c) => {
          const i = spaceInfo(data, c.teaching_space_id),
            open =
              c.status === "published" &&
              Date.parse(c.opens_at) <= current &&
              Date.parse(c.closes_at) > current;
          return (
            <Panel className="competition-card" key={c.id}>
              <div className="competition-card-top">
                <span className="competition-icon">
                  <Trophy size={28} />
                </span>
                <Badge status={teacher ? c.status : undefined}>
                  {teacher
                    ? undefined
                    : open
                      ? "Ouvert"
                      : Date.parse(c.opens_at) > current
                        ? "À venir"
                        : "Terminé"}
                </Badge>
              </div>
              <div className="eyebrow">
                {c.kind === "contest" ? "CONCOURS" : "CHALLENGE"} ·{" "}
                {i.subject?.label}
              </div>
              <h2>{c.title}</h2>
              <p>
                Avec {i.teacher?.display_name} · {i.schoolClass?.name}
              </p>
              <div className="competition-dates">
                <span>
                  <Clock size={16} />
                  Du {date(c.opens_at)} au {date(c.closes_at)}
                </span>
                <span>Barème /{c.max_score}</span>
              </div>
              <ButtonLink
                to={`${teacher ? "/prof" : "/etudiant"}/competitions/${c.id}`}
                variant="secondary"
              >
                {teacher
                  ? "Gérer le défi"
                  : c.results_published_at
                    ? "Voir les résultats"
                    : open
                      ? "Découvrir et participer"
                      : "Voir les détails"}
                <ArrowRight size={17} />
              </ButtonLink>
            </Panel>
          );
        })}
      </div>
      {!rows.length && (
        <Panel>
          <Empty
            title="Les prochains défis se préparent"
            description="Les compétitions de ton groupe apparaîtront ici."
          />
        </Panel>
      )}
      <Pagination page={page} total={rows.length} onChange={setPage} />
      {hasMore.competitions && (
        <Button
          variant="secondary"
          onClick={() => void loadMore("competitions")}
        >
          Charger les défis suivants
        </Button>
      )}
    </>
  );
}
export function CompetitionEditor() {
  const { data, mutate, notify } = useApp(),
    { id } = useParams(),
    navigate = useNavigate();
  const c = data.competitions.find((c) => c.id === id);
  if (id && !c) return <Unavailable />;
  return (
    <>
      <PageHeader
        eyebrow="UNE NOUVELLE FAÇON D’APPRENDRE"
        title={c ? "Modifier la compétition" : "Créer une compétition"}
        description="Énoncé, période, règles : donnez à vos élèves un cadre pour se dépasser."
        back="/prof/competitions"
      />
      <Panel>
        <AsyncForm
          onSubmit={async (f) => {
            const fd = new FormData(f);
            const opens = localToISO(String(fd.get("opens"))),
              closes = localToISO(String(fd.get("closes")));
            if (Date.parse(opens) >= Date.parse(closes))
              throw Error("La clôture doit être postérieure à l’ouverture.");
            let result = await mutate<Competition>("save_competition", {
              p_id: c?.id || null,
              p_expected_version: c?.row_version || null,
              p_data: {
                title: fd.get("title"),
                kind: fd.get("kind"),
                teaching_space_id: fd.get("space"),
                instructions: fd.get("instructions"),
                rules: fd.get("rules"),
                opens_at: opens,
                closes_at: closes,
                max_score: Number(fd.get("score")),
                leaderboard_enabled: fd.get("leaderboard") === "on",
              },
            });
            if (fd.get("publish") === "on")
              result = await mutate("publish_competition", {
                p_competition_id: result.id,
                p_expected_version: result.row_version,
              });
            notify("La compétition a été enregistrée.");
            navigate(`/prof/competitions/${result.id}`);
          }}
        >
          <div className="split-layout">
            <div>
              <Field label="Type">
                <select name="kind" defaultValue={c?.kind || "challenge"}>
                  <option value="challenge">Challenge</option>
                  <option value="contest">Concours</option>
                </select>
              </Field>
              <Field label="Titre">
                <input
                  name="title"
                  defaultValue={c?.title}
                  required
                  maxLength={200}
                />
              </Field>
              <Field label="Groupe">
                <SpaceSelect name="space" initial={c?.teaching_space_id} />
              </Field>
              <Field label="Énoncé">
                <textarea
                  rows={10}
                  name="instructions"
                  defaultValue={c?.instructions}
                  required
                  dir="auto"
                />
              </Field>
              {c && (
                <Resources
                  kind="competition"
                  id={c.id}
                  editable={
                    !data.submissions.some(
                      (s) => s.competition_id === c.id && s.status !== "draft",
                    )
                  }
                />
              )}
              <Field label="Règles de participation">
                <textarea
                  name="rules"
                  rows={3}
                  placeholder="Travail personnel, justifications attendues…"
                />
              </Field>
            </div>
            <div>
              <Field label="Ouverture · Africa/Casablanca">
                <input
                  name="opens"
                  type="datetime-local"
                  defaultValue={
                    c
                      ? formatInTimeZone(
                          c.opens_at,
                          "Africa/Casablanca",
                          "yyyy-MM-dd'T'HH:mm",
                        )
                      : ""
                  }
                  required
                />
              </Field>
              <Field label="Clôture · Africa/Casablanca">
                <input
                  name="closes"
                  type="datetime-local"
                  defaultValue={
                    c
                      ? formatInTimeZone(
                          c.closes_at,
                          "Africa/Casablanca",
                          "yyyy-MM-dd'T'HH:mm",
                        )
                      : ""
                  }
                  required
                />
              </Field>
              <Field label="Barème">
                <input
                  name="score"
                  type="number"
                  min="1"
                  max="1000"
                  defaultValue={c?.max_score || 20}
                />
              </Field>
              <label className="checkbox-row">
                <input
                  name="leaderboard"
                  type="checkbox"
                  defaultChecked={c?.leaderboard_enabled}
                />
                Activer le classement sous pseudonymes dans le groupe
              </label>
              <Notice>
                Les participants remettent des photos ou un PDF. La correction
                est manuelle et les résultats sont publiés après la clôture.
              </Notice>
              <label className="checkbox-row">
                <input type="checkbox" name="publish" />
                Publier après l’enregistrement
              </label>
            </div>
          </div>
          <div className="actions">
            <Button type="submit">Enregistrer la compétition</Button>
            <ButtonLink to="/prof/competitions" variant="ghost">
              Annuler
            </ButtonLink>
          </div>
        </AsyncForm>
      </Panel>
    </>
  );
}
export function CompetitionDetail() {
  const { data, user, mutate, notify } = useApp(),
    { id } = useParams();
  const c = data.competitions.find((c) => c.id === id);
  const teacher = user!.role === "teacher";
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [leaderboard, setLeaderboard] = useState<
      {
        rank: number;
        pseudonym: string;
        score: number;
        max_score: number;
        is_me: boolean;
      }[]
    >([]);
  useEffect(() => {
    if (c?.results_published_at && c.leaderboard_enabled)
      void mutate<typeof leaderboard>("competition_leaderboard", {
        p_competition_id: c.id,
      })
        .then(setLeaderboard)
        .catch((e) => setError(e.message));
  }, [c?.id, c?.results_published_at]);
  if (!c) return <Unavailable />;
  const info = spaceInfo(data, c.teaching_space_id),
    open =
      c.status === "published" &&
      Date.parse(c.opens_at) <= Date.now() &&
      Date.parse(c.closes_at) > Date.now(),
    submissions = data.submissions.filter((s) => s.competition_id === c.id),
    my = submissions.find((s) => s.student_id === user!.id),
    ev = data.evaluations.find(
      (e) => e.submission_version_id === my?.latest_version_id,
    );
  return (
    <>
      <PageHeader
        eyebrow={`${c.kind === "contest" ? "CONCOURS" : "CHALLENGE"} · ${info.subject?.label}`}
        title={c.title}
        description={`${info.schoolClass?.name} · ${info.teacher?.display_name}`}
        back={teacher ? "/prof/competitions" : "/etudiant/competitions"}
        action={
          teacher ? (
            <ButtonLink
              variant="secondary"
              to={`/prof/competitions/${c.id}/modifier`}
            >
              Modifier
            </ButtonLink>
          ) : (
            <Badge>
              {open
                ? "Ouvert"
                : c.results_published_at
                  ? "Résultats publiés"
                  : Date.parse(c.opens_at) > Date.now()
                    ? "À venir"
                    : "Clôturé"}
            </Badge>
          )
        }
      />
      <Panel className="competition-period">
        <span>
          <Clock size={18} />
          Ouverture : {date(c.opens_at, true)}
        </span>
        <span>Clôture : {date(c.closes_at, true)}</span>
        <span>Barème /{c.max_score}</span>
        <small>Africa/Casablanca</small>
      </Panel>
      {teacher ? (
        <Panel title="Participations et résultats">
          <Notice tone={c.results_published_at ? "success" : "info"}>
            {c.results_published_at
              ? "Les résultats sont publiés."
              : "Les résultats ne sont pas encore visibles par les étudiants."}
          </Notice>
          {submissions.map((s) => (
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
                <Badge status={s.status} />
              </div>
              <ButtonLink variant="secondary" to={`/prof/copies/${s.id}`}>
                Corriger <ArrowRight size={16} />
              </ButtonLink>
            </div>
          ))}
          {!submissions.length && (
            <Empty
              title="Aucune participation pour le moment"
              description="Les travaux remis par vos étudiants apparaîtront ici."
            />
          )}
          <Button
            disabled={
              busy ||
              !!c.results_published_at ||
              Date.parse(c.closes_at) > Date.now() ||
              submissions.some((s) => s.status !== "reviewed")
            }
            onClick={async () => {
              setBusy(true);
              try {
                await mutate("publish_competition_results", {
                  p_competition_id: c.id,
                  p_expected_version: c.row_version,
                });
                notify("Les résultats sont publiés.");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Publier les résultats
          </Button>
          {Date.parse(c.closes_at) > Date.now() && (
            <p className="muted">
              La publication sera possible après la clôture et la correction des
              participations.
            </p>
          )}
        </Panel>
      ) : c.results_published_at ? (
        <div className="split-layout">
          <Panel title="Mon résultat">
            {ev ? (
              <>
                <div className="correction-score">
                  {ev.score ?? "—"}
                  <span>/ {ev.max_score}</span>
                </div>
                <p className="published-feedback">{ev.feedback}</p>
                {my && (
                  <ButtonLink
                    variant="secondary"
                    to={`/etudiant/mes-travaux/${my.id}`}
                  >
                    Voir ma participation <ArrowRight size={16} />
                  </ButtonLink>
                )}
              </>
            ) : (
              <Empty
                title="Pas de résultat personnel"
                description="Tu n’as pas remis de participation à cette compétition."
              />
            )}
          </Panel>
          {c.leaderboard_enabled && (
            <Panel title="Classement du groupe">
              {leaderboard.map((row) => (
                <div
                  className={`list-row ${row.is_me ? "my-ranking" : ""}`}
                  key={row.pseudonym}
                >
                  <strong>{row.rank}</strong>
                  <span>
                    {row.pseudonym}
                    {row.is_me ? " · Toi" : ""}
                  </span>
                  <strong>
                    {row.score}/{row.max_score}
                  </strong>
                </div>
              ))}
            </Panel>
          )}
        </div>
      ) : (
        <div className="submission-layout">
          <Panel title="Le défi">
            <div className="statement-text" dir="auto">
              {c.instructions}
            </div>
            <Resources kind="competition" id={c.id} />
            <Notice>
              Une participation personnelle, des corrections manuelles et des
              résultats publiés par ton professeur.
            </Notice>
          </Panel>
          <Panel title="Ma participation">
            {open || my ? (
              <UploadWork
                competitionId={c.id}
                disabled={!open && my?.status !== "changes_requested"}
              />
            ) : (
              <Empty
                title={
                  Date.parse(c.opens_at) > Date.now()
                    ? "Encore un peu de patience"
                    : "La compétition est clôturée"
                }
                description={
                  Date.parse(c.opens_at) > Date.now()
                    ? `La participation ouvre le ${date(c.opens_at, true)}.`
                    : "Les résultats apparaîtront après leur publication par le professeur."
                }
              />
            )}
          </Panel>
        </div>
      )}
      {error && <Notice tone="error">{error}</Notice>}
    </>
  );
}
export function Announcements() {
  const { data, user, hasMore, loadMore } = useApp();
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("Toutes"),
    [page, setPage] = useState(1),
    [opened, setOpened] = useState<Announcement | null>(null);
  const teacher = user!.role === "teacher";
  const rows = data.announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) &&
      (status === "Toutes" || a.status === "draft"),
  );
  useEffect(() => setPage(1), [search, status]);
  return (
    <>
      <PageHeader
        eyebrow="LE LIEN AVEC VOS PROFESSEURS"
        title={teacher ? "Mes annonces" : "Les annonces de mes professeurs"}
        description={
          teacher
            ? "Un message clair pour préparer la suite."
            : "Les informations utiles, au bon endroit."
        }
        action={
          teacher ? (
            <ButtonLink to="/prof/annonces/nouvelle">
              <Plus size={18} />
              Nouvelle annonce
            </ButtonLink>
          ) : undefined
        }
      />
      <Panel className="filter-panel">
        {teacher && (
          <Tabs
            options={["Toutes", "Brouillons"]}
            value={status}
            onChange={setStatus}
          />
        )}
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher une annonce…"
        />
      </Panel>
      <div className="announcement-feed">
        {rows.slice((page - 1) * 8, page * 8).map((a) => {
          const info = spaceInfo(data, a.teaching_space_id),
            m = data.meetings.find((m) => m.announcement_id === a.id);
          return (
            <Panel className="announcement-card" key={a.id}>
              <div className="announcement-author">
                <span className="avatar">
                  {initials(info.teacher?.display_name)}
                </span>
                <div>
                  <strong>{info.teacher?.display_name}</strong>
                  <small>
                    {info.subject?.label} · {info.schoolClass?.name}
                  </small>
                </div>
                <span>{date(a.published_at)}</span>
              </div>
              <h2>{a.title}</h2>
              <p>{a.body}</p>
              <div className="actions">
                {teacher && <Badge status={a.status} />}
                <Button variant="ghost" onClick={() => setOpened(a)}>
                  Lire l’annonce <ArrowRight size={16} />
                </Button>
                {teacher && a.type === "notice" && (
                  <ButtonLink
                    to={`/prof/annonces/${a.id}/modifier`}
                    variant="ghost"
                  >
                    Modifier
                  </ButtonLink>
                )}
                {m && (
                  <ButtonLink
                    variant="secondary"
                    to={`${rolePath(user!.role)}/seances/${m.id}`}
                  >
                    Voir la séance <Video size={16} />
                  </ButtonLink>
                )}
              </div>
            </Panel>
          );
        })}
      </div>
      {!rows.length && (
        <Panel>
          <Empty
            title="Tu es à jour"
            description="Les annonces de tes groupes apparaîtront ici."
          />
        </Panel>
      )}
      <Pagination page={page} total={rows.length} onChange={setPage} />
      {hasMore.announcements && (
        <Button
          variant="secondary"
          onClick={() => void loadMore("announcements")}
        >
          Charger les annonces suivantes
        </Button>
      )}
      {opened && (
        <Modal title={opened.title} onClose={() => setOpened(null)}>
          <p className="statement-text">{opened.body}</p>
          <Resources kind="announcement" id={opened.id} />
        </Modal>
      )}
    </>
  );
}
export function AnnouncementEditor() {
  const { data, mutate, notify } = useApp(),
    { id } = useParams(),
    navigate = useNavigate();
  const a = data.announcements.find((a) => a.id === id);
  if (id && !a) return <Unavailable />;
  return (
    <>
      <PageHeader
        eyebrow="UN MESSAGE POUR VOTRE GROUPE"
        title={a ? "Modifier l’annonce" : "Nouvelle annonce"}
        back="/prof/annonces"
      />
      <Panel>
        <AsyncForm
          onSubmit={async (f) => {
            const fd = new FormData(f);
            const result = await mutate<Announcement>("save_announcement", {
              p_id: a?.id || null,
              p_expected_version: a?.row_version || null,
              p_data: {
                title: fd.get("title"),
                body: fd.get("body"),
                teaching_space_id: fd.get("space"),
              },
            });
            if (fd.get("publish") === "on")
              await mutate("publish_announcement", {
                p_announcement_id: result.id,
                p_expected_version: result.row_version,
              });
            notify("L’annonce a été enregistrée.");
            navigate("/prof/annonces");
          }}
        >
          <Field label="Titre">
            <input
              name="title"
              defaultValue={a?.title}
              required
              maxLength={200}
            />
          </Field>
          <Field label="Groupe destinataire">
            <SpaceSelect name="space" initial={a?.teaching_space_id} />
          </Field>
          <Field label="Message">
            <textarea
              name="body"
              rows={10}
              defaultValue={a?.body}
              required
              dir="auto"
            />
          </Field>
          {a && <Resources kind="announcement" id={a.id} editable />}
          <Notice>
            Ce message sera visible uniquement par les étudiants autorisés dans
            la matière et la classe sélectionnées.
          </Notice>
          <label className="checkbox-row">
            <input name="publish" type="checkbox" />
            Publier l’annonce après l’enregistrement
          </label>
          <div className="actions">
            <Button type="submit">Enregistrer l’annonce</Button>
            <ButtonLink to="/prof/seances/nouvelle" variant="ghost">
              Planifier plutôt une séance <Video size={16} />
            </ButtonLink>
          </div>
        </AsyncForm>
      </Panel>
    </>
  );
}
function SpaceSelect({
  name,
  initial,
  disabled = false,
}: {
  name: string;
  initial?: string;
  disabled?: boolean;
}) {
  const { data } = useApp();
  return (
    <select
      disabled={disabled}
      name={name}
      defaultValue={initial || data.teaching_spaces[0]?.id || ""}
      required
    >
      <option value="" disabled>
        Choisir un groupe
      </option>
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
  );
}
export function Sessions() {
  const { data, user } = useApp();
  const [tab, setTab] = useState("À venir"),
    [view, setView] = useState("Liste");
  const teacher = user!.role === "teacher";
  const rows = data.meetings
    .filter((m) =>
      tab === "Annulées"
        ? m.status === "cancelled"
        : tab === "Passées"
          ? Date.parse(m.ends_at) < Date.now() && m.status !== "cancelled"
          : Date.parse(m.ends_at) >= Date.now() && m.status !== "cancelled",
    )
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  return (
    <>
      <PageHeader
        eyebrow="ON SE RETROUVE POUR COMPRENDRE"
        title="Mes séances"
        description="Des temps pour poser tes questions et avancer ensemble. · Africa/Casablanca"
        action={
          teacher ? (
            <ButtonLink to="/prof/seances/nouvelle">
              <Plus size={18} />
              Planifier une séance
            </ButtonLink>
          ) : undefined
        }
      />
      <Panel className="filter-panel">
        <div className="actions">
          <Tabs
            options={["À venir", "Passées", ...(teacher ? ["Annulées"] : [])]}
            value={tab}
            onChange={setTab}
          />
          {teacher && (
            <Tabs
              options={["Liste", "Calendrier"]}
              value={view}
              onChange={setView}
            />
          )}
        </div>
      </Panel>
      {view === "Calendrier" && <MeetingCalendar meetings={rows} />}
      {view === "Liste" && (
        <div className="stack">
          {rows.map((m) => {
            const a = data.announcements.find(
                (a) => a.id === m.announcement_id,
              ),
              info = a ? spaceInfo(data, a.teaching_space_id) : null;
            return (
              <Panel className="session-row" key={m.id}>
                <div className="session-date">
                  <span>
                    {formatInTimeZone(m.starts_at, "Africa/Casablanca", "dd")}
                  </span>
                  <small>
                    {formatInTimeZone(
                      m.starts_at,
                      "Africa/Casablanca",
                      "MM / yyyy",
                    )}
                  </small>
                </div>
                <div className="session-copy">
                  <div className="eyebrow">{info?.subject?.label}</div>
                  <h2>{a?.title}</h2>
                  <p>
                    {clockTime(m.starts_at)}–{clockTime(m.ends_at)} ·{" "}
                    {info?.teacher?.display_name}
                  </p>
                  <small>{info?.schoolClass?.name} · Africa/Casablanca</small>
                </div>
                <div className="session-actions">
                  <Badge status={m.status} />
                  <ButtonLink
                    variant="secondary"
                    to={`${rolePath(user!.role)}/seances/${m.id}`}
                  >
                    Voir la séance <ArrowRight size={16} />
                  </ButtonLink>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
      {!rows.length && (
        <Panel>
          <Empty
            title="Un prochain rendez-vous à venir"
            description="Les séances publiées par tes professeurs apparaîtront ici."
          />
        </Panel>
      )}
    </>
  );
}
export function SessionEditor() {
  const { data, mutate, invoke, notify, refresh } = useApp(),
    { id } = useParams(),
    navigate = useNavigate();
  const m = data.meetings.find((m) => m.id === id),
    a = data.announcements.find((a) => a.id === m?.announcement_id);
  const [publish, setPublish] = useState(false);
  if (id && !m) return <Unavailable />;
  return (
    <>
      <PageHeader
        eyebrow="UN RENDEZ-VOUS POUR AVANCER"
        title={m ? "Modifier la séance" : "Planifier une séance"}
        description="Le lien Google Meet est créé côté serveur et ajouté à l’annonce une fois prêt."
        back="/prof/seances"
      />
      <div className="split-layout">
        <Panel>
          <AsyncForm
            onSubmit={async (f) => {
              const fd = new FormData(f);
              const changes = {
                title: fd.get("title"),
                body: fd.get("body"),
                teaching_space_id: fd.get("space"),
                course_id: fd.get("course") || null,
                starts_at: localToISO(String(fd.get("starts"))),
                ends_at: localToISO(String(fd.get("ends"))),
                timezone: "Africa/Casablanca",
              };
              if (Date.parse(changes.ends_at) <= Date.parse(changes.starts_at))
                throw Error("L’heure de fin doit être postérieure au début.");
              if (m && m.status !== "draft") {
                await invoke("meetings-update", {
                  meetingId: m.id,
                  expectedVersion: m.row_version,
                  idempotencyKey: crypto.randomUUID(),
                  changes: {
                    title: changes.title,
                    body: changes.body,
                    starts_at: changes.starts_at,
                    ends_at: changes.ends_at,
                    timezone: changes.timezone,
                  },
                });
                await refresh();
                notify("La synchronisation de la séance a été demandée.");
                navigate(`/prof/seances/${m.id}`);
                return;
              }
              const result = await mutate<Meeting>("save_meeting", {
                p_id: m?.id || null,
                p_expected_version: m?.row_version || null,
                p_data: changes,
              });
              if (publish) {
                try {
                  await invoke("meetings-publish", {
                    meetingId: result.id,
                    expectedVersion: result.row_version,
                    idempotencyKey: crypto.randomUUID(),
                  });
                } catch (e) {
                  notify(
                    "Le brouillon est conservé. La publication n’a pas abouti.",
                  );
                  throw e;
                }
              }
              notify(
                publish
                  ? "La préparation du lien a été demandée."
                  : "Le brouillon de séance a été enregistré.",
              );
              navigate(`/prof/seances/${result.id}`);
            }}
          >
            <Field label="Titre">
              <input
                name="title"
                required
                defaultValue={a?.title}
                maxLength={200}
              />
            </Field>
            <Field label="Groupe destinataire">
              <SpaceSelect
                name="space"
                initial={a?.teaching_space_id}
                disabled={!!m && m.status !== "draft"}
              />
            </Field>
            <Field label="Cours associé (facultatif)">
              <select name="course" defaultValue={m?.course_id || ""}>
                <option value="">Aucun</option>
                {data.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Début · Africa/Casablanca">
              <input
                name="starts"
                type="datetime-local"
                required
                defaultValue={
                  m
                    ? formatInTimeZone(
                        m.starts_at,
                        "Africa/Casablanca",
                        "yyyy-MM-dd'T'HH:mm",
                      )
                    : ""
                }
              />
            </Field>
            <Field label="Fin · Africa/Casablanca">
              <input
                name="ends"
                type="datetime-local"
                required
                defaultValue={
                  m
                    ? formatInTimeZone(
                        m.ends_at,
                        "Africa/Casablanca",
                        "yyyy-MM-dd'T'HH:mm",
                      )
                    : ""
                }
              />
            </Field>
            <Field label="Description">
              <textarea name="body" rows={4} defaultValue={a?.body} />
            </Field>
            <div className="actions">
              <Button
                type="submit"
                onClick={() => setPublish(false)}
                variant="secondary"
              >
                {m?.status === "scheduled"
                  ? "Synchroniser les modifications"
                  : "Enregistrer le brouillon"}
              </Button>
              {(!m || m.status === "draft") && (
                <Button type="submit" onClick={() => setPublish(true)}>
                  Publier la séance <Video size={17} />
                </Button>
              )}
            </div>
          </AsyncForm>
        </Panel>
        <Panel className="session-help">
          <div className="google-icon">G</div>
          <h2>
            Le cours commence ici.
            <br />
            La rencontre, sur Meet.
          </h2>
          <p>
            Connectez votre compte Google, planifiez la séance, puis laissez
            Kon-fanan préparer le lien pour votre groupe.
          </p>
          <Notice>
            L’annonce n’est publiée aux étudiants que lorsque le lien est prêt.
            Aucune adresse email d’étudiant n’est transmise aux invités
            Calendar.
          </Notice>
          <ButtonLink variant="secondary" to="/prof/integrations/google">
            Gérer mon compte Google <ArrowUpRight size={16} />
          </ButtonLink>
        </Panel>
      </div>
    </>
  );
}
export function SessionDetail() {
  const { data, user, invoke, notify, refresh, demo } = useApp(),
    { id } = useParams();
  const m = data.meetings.find((m) => m.id === id),
    a = data.announcements.find((a) => a.id === m?.announcement_id);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [cancel, setCancel] = useState(false),
    [link, setLink] = useState("");
  if (!m || !a) return <Unavailable />;
  const teacher = user!.role === "teacher",
    info = spaceInfo(data, a.teaching_space_id);
  const joinable =
    m.status === "scheduled" &&
    m.sync_status === "synced" &&
    Date.now() >= Date.parse(m.starts_at) - 15 * 60000 &&
    Date.now() <= Date.parse(m.ends_at);
  async function join() {
    setBusy(true);
    try {
      const result = await invoke<{ url: string }>("meetings-join", {
        meetingId: m!.id,
      });
      setLink(result.url);
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow={`${info.subject?.label} · ${info.schoolClass?.name}`}
        title={a.title}
        description={info.teacher?.display_name}
        back={`${rolePath(user!.role)}/seances`}
        action={<Badge status={m.status} />}
      />
      <div className="split-layout">
        <Panel title="Notre rendez-vous">
          <div className="meeting-details">
            <div>
              <CalendarDays />
              <span>
                Date<strong>{date(m.starts_at)}</strong>
              </span>
            </div>
            <div>
              <Clock />
              <span>
                Horaire
                <strong>
                  {clockTime(m.starts_at)}–{clockTime(m.ends_at)}
                </strong>
                <small>Africa/Casablanca</small>
              </span>
            </div>
            <div>
              <Video />
              <span>
                Organisateur<strong>{info.teacher?.display_name}</strong>
              </span>
            </div>
          </div>
          <p className="statement-text">{a.body}</p>
          {m.course_id && (
            <ButtonLink
              variant="secondary"
              to={
                teacher
                  ? `/prof/cours/${m.course_id}`
                  : `/etudiant/cours/${m.course_id}`
              }
            >
              Revoir le cours associé <ArrowRight size={16} />
            </ButtonLink>
          )}
          {teacher && m.status !== "cancelled" && (
            <div className="actions">
              <ButtonLink
                variant="secondary"
                to={`/prof/seances/${m.id}/modifier`}
              >
                Modifier
              </ButtonLink>
              <Button variant="ghost" onClick={() => setCancel(true)}>
                Annuler la séance
              </Button>
            </div>
          )}
        </Panel>
        <Panel className="join-card">
          <span className="join-icon">
            <Video size={32} />
          </span>
          <h2>On se retrouve en direct.</h2>
          <p>
            {m.status === "draft"
              ? "Enregistrez puis publiez la séance pour préparer un lien Google Meet."
              : m.status === "cancelled"
                ? "Cette séance a été annulée."
                : m.status === "publishing"
                  ? "Le lien est en préparation. Revenez ici pour connaître son état."
                  : m.status === "error"
                    ? "La préparation du lien nécessite une action de votre professeur."
                    : !joinable
                      ? "L’accès ouvre 15 minutes avant le début de la séance."
                      : "La séance s’ouvre dans un nouvel onglet."}
          </p>
          {teacher && m.status === "draft" ? (
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await invoke("meetings-publish", {
                    meetingId: m.id,
                    expectedVersion: m.row_version,
                    idempotencyKey: crypto.randomUUID(),
                  });
                  await refresh();
                  notify("La préparation du lien a été demandée.");
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Publier la séance <ArrowRight size={17} />
            </Button>
          ) : (
            <Button disabled={!joinable || busy} onClick={() => void join()}>
              Ouvrir Google Meet <ExternalLink size={17} />
            </Button>
          )}
          {link && (
            <a
              className="text-link"
              href={link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ouvrir le lien si l’onglet est bloqué <ArrowUpRight size={16} />
            </a>
          )}
          {m.last_error_code && teacher && (
            <Notice>
              Une erreur de synchronisation est signalée. Vérifiez votre
              connexion Google puis consultez l’état des intégrations.
            </Notice>
          )}
          {demo && (
            <small className="muted">
              Démonstration : aucun lien Meet n’est créé.
            </small>
          )}
        </Panel>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      {cancel && (
        <Modal title="Annuler la séance ?" onClose={() => setCancel(false)}>
          <p>
            Le bouton Rejoindre sera retiré immédiatement. L’annulation Google
            sera synchronisée et le groupe sera informé.
          </p>
          <Button
            variant="danger"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await invoke("meetings-cancel", {
                  meetingId: m.id,
                  expectedVersion: m.row_version,
                  idempotencyKey: crypto.randomUUID(),
                });
                await refresh();
                setCancel(false);
                notify("L’annulation a été enregistrée.");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Confirmer l’annulation
          </Button>
          {error && <Notice tone="error">{error}</Notice>}
        </Modal>
      )}
    </>
  );
}
export function GoogleIntegration() {
  const { invoke, demo, notify } = useApp();
  const [state, setState] = useState<{ state: string; email?: string }>({
      state: "disconnected",
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false);
  useEffect(() => {
    const outcome = new URLSearchParams(window.location.search).get("google");
    if (outcome && outcome !== "connected")
      setError(
        (
          {
            OAUTH_DENIED:
              "L’autorisation Google a été refusée. Vous pouvez recommencer.",
            OAUTH_SCOPE_MISSING:
              "L’accès au calendrier n’a pas été accordé. Reconnectez votre compte.",
            GOOGLE_RECONNECT_REQUIRED:
              "Google n’a pas fourni d’accès durable. Reconnectez votre compte.",
            ACCOUNT_CHANGE_BLOCKED:
              "Des séances dépendent de votre compte précédent. Reconnectez ce même compte ou annulez ces séances.",
          } as Record<string, string>
        )[outcome] ||
          "La connexion Google n’a pas abouti. Recommencez depuis cette page.",
      );
    void invoke<typeof state>("google-status")
      .then(setState)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <PageHeader
        eyebrow="DES COURS, DES RENCONTRES"
        title="Google Calendar & Meet"
        description="Planifiez vos séances directement depuis Kon-fanan."
      />
      <Panel className="google-integration">
        <div className="google-icon large">G</div>
        <Badge status={state.state} />
        <h2>
          Vos élèves à un clic.
          <br />
          Votre calendrier, à jour.
        </h2>
        <p>
          Autorisez Kon-fanan à gérer les événements créés pour vos cours dans
          votre calendrier Google. Les identifiants de connexion restent
          protégés côté serveur.
        </p>
        <div className="google-steps">
          {[
            ["01", "Connectez votre compte"],
            ["02", "Planifiez une séance"],
            ["03", "Retrouvez votre groupe sur Meet"],
          ].map(([n, t]) => (
            <div key={n}>
              <span>{n}</span>
              <strong>{t}</strong>
            </div>
          ))}
        </div>
        {state.email && (
          <p>
            Compte connecté : <strong>{state.email}</strong>
          </p>
        )}
        {state.state === "connected" ? (
          <div className="actions">
            <ButtonLink to="/prof/seances/nouvelle">
              Planifier une séance <Plus size={17} />
            </ButtonLink>
            <Button variant="ghost" onClick={() => setConfirm(true)}>
              Déconnecter
            </Button>
          </div>
        ) : (
          <Button
            disabled={busy || demo}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const r = await invoke<{ url: string }>("google-oauth-start");
                window.location.assign(r.url);
              } catch (e) {
                setError((e as Error).message);
                setBusy(false);
              }
            }}
          >
            {state.state === "reconnect_required"
              ? "Reconnecter Google"
              : "Connecter mon compte Google"}
            <ArrowUpRight size={17} />
          </Button>
        )}
        {demo && (
          <Notice>
            Cette intégration est désactivée dans la démonstration. Aucun compte
            Google n’est connecté.
          </Notice>
        )}
        {error && <Notice tone="error">{error}</Notice>}
      </Panel>
      {confirm && (
        <Modal title="Déconnecter Google ?" onClose={() => setConfirm(false)}>
          <p>
            Vos événements existants sont conservés. Les futures
            synchronisations seront bloquées jusqu’à la reconnexion.
          </p>
          <Button
            disabled={busy}
            variant="danger"
            onClick={async () => {
              setBusy(true);
              try {
                await invoke("google-disconnect");
                setState({ state: "disconnected" });
                setConfirm(false);
                notify("Le compte Google a été déconnecté.");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Déconnecter mon compte
          </Button>
        </Modal>
      )}
    </>
  );
}

function MeetingCalendar({ meetings }: { meetings: Meeting[] }) {
  const { data } = useApp();
  const [month, setMonth] = useState(
    () =>
      new Date(
        formatInTimeZone(new Date(), "Africa/Casablanca", "yyyy-MM") +
          "-01T12:00:00Z",
      ),
  );
  const y = month.getUTCFullYear(),
    m = month.getUTCMonth(),
    offset = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7,
    days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const heading = new Intl.DateTimeFormat("fr", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(month);
  function move(n: number) {
    setMonth(new Date(Date.UTC(y, m + n, 1, 12)));
  }
  return (
    <Panel>
      <div className="panel-heading">
        <h2>{heading}</h2>
        <div className="actions no-margin">
          <button
            className="icon-button"
            aria-label="Mois précédent"
            onClick={() => move(-1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Mois suivant"
            onClick={() => move(1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="calendar-mobile">
        {meetings
          .filter(
            (mt) =>
              formatInTimeZone(mt.starts_at, "Africa/Casablanca", "yyyy-MM") ===
              `${y}-${String(m + 1).padStart(2, "0")}`,
          )
          .map((mt) => (
            <Link
              key={mt.id}
              className="agenda-event"
              to={"/prof/seances/" + mt.id}
            >
              <strong>
                {date(mt.starts_at)} · {clockTime(mt.starts_at)}
              </strong>
              <span>
                {
                  data.announcements.find((a) => a.id === mt.announcement_id)
                    ?.title
                }
              </span>
            </Link>
          ))}
        {!meetings.some(
          (mt) =>
            formatInTimeZone(mt.starts_at, "Africa/Casablanca", "yyyy-MM") ===
            `${y}-${String(m + 1).padStart(2, "0")}`,
        ) && (
          <Empty
            title="Aucune séance ce mois-ci"
            description="Choisissez un autre mois pour consulter votre agenda."
          />
        )}
      </div>
      <div className="meeting-calendar">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
          <span className="calendar-weekday" key={day}>
            {day}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <div className="calendar-cell muted-cell" key={"blank" + i} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const d = i + 1,
            key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          return (
            <div className="calendar-cell" key={key}>
              <span>{d}</span>
              {meetings
                .filter(
                  (mt) =>
                    formatInTimeZone(
                      mt.starts_at,
                      "Africa/Casablanca",
                      "yyyy-MM-dd",
                    ) === key,
                )
                .map((mt) => (
                  <Link
                    to={"/prof/seances/" + mt.id}
                    key={mt.id}
                    className="calendar-event"
                  >
                    <strong>{clockTime(mt.starts_at)}</strong>
                    <span>
                      {
                        data.announcements.find(
                          (a) => a.id === mt.announcement_id,
                        )?.title
                      }
                    </span>
                  </Link>
                ))}
            </div>
          );
        })}
      </div>
      <p className="small-text muted">
        Horaires affichés dans le fuseau Africa/Casablanca.
      </p>
    </Panel>
  );
}
