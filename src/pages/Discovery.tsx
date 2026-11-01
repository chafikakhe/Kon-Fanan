import { useEffect, useRef, useState } from "react";
import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { ArrowRight, BookOpen, Check, LockKeyhole, Video } from "lucide-react";
import { useApp } from "../app/AppProvider";
import {
  Badge,
  Button,
  ButtonLink,
  Empty,
  Field,
  Loading,
  Logo,
  Notice,
  PageHeader,
  Panel,
} from "../components/ui";
import { Markdown } from "../components/RichText";
import { CourseVideo, CourseBook } from "../components/CourseMedia";
import { supabase } from "../lib/supabase";
import {
  journeyURL,
  readJourney,
  rememberCheckout,
  useCatalog,
  type Journey,
  type PackOrder,
} from "../lib/packs";
import { date, errorMessage, rolePath } from "../lib/utils";

export function DiscoveryLayout() {
  const { user, demo } = useApp(),
    location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <div
      className={`discovery-page ${location.pathname.startsWith("/decouvrir/cours/") ? "discovery-course-page" : ""}`}
    >
      <a href="#discovery-main" className="skip-link">
        Aller au contenu
      </a>
      <header className="discovery-header">
        <Logo />
        <nav aria-label="Découverte">
          <Link to="/decouvrir">Les cours</Link>
          <Link to="/packs">Les packs</Link>
          <ButtonLink
            variant="secondary"
            to={
              user
                ? user.status === "active"
                  ? rolePath(user.role)
                  : "/admission"
                : "/connexion"
            }
          >
            {user ? "Mon espace" : "Se connecter"}
          </ButtonLink>
        </nav>
      </header>
      <main id="discovery-main" className="discovery-main">
        {demo && (
          <Notice>
            Démonstration · données fictives. Aucun paiement ni achat réussi
            n’est simulé.
          </Notice>
        )}
        <Outlet />
      </main>
      <footer className="discovery-footer">
        <Logo compact />
        <span>Apprendre ouvre des portes.</span>
        <Link to="/conditions">Conditions</Link>
      </footer>
    </div>
  );
}
export function CatalogPage() {
  const location = useLocation(),
    { id } = useParams(),
    j = readJourney(location.search),
    [offset, setOffset] = useState(0);
  const query = id ? { ...j, course: id } : j;
  const { catalog, loading, error, retry } = useCatalog(query, offset);
  useEffect(() => setOffset(0), [j.level, j.subject, id]);
  if (loading) return <Loading />;
  if (error) return <CatalogError error={error} retry={retry} />;
  if (!catalog) return null;
  const level = catalog.levels.find((l) => l.id === catalog.level_id),
    subject = catalog.subjects.find((s) => s.id === catalog.subject_id),
    course = id ? catalog.courses[0] : undefined;
  const context: Journey = {
    level: catalog.level_id || undefined,
    subject: catalog.subject_id || undefined,
    course: course?.id,
  };
  return (
    <>
      <nav className="discovery-steps" aria-label="Ton parcours">
        <Link to="/decouvrir">1. Niveau</Link>
        <span>›</span>
        {level ? (
          <Link to={journeyURL("/decouvrir", { level: level.id })}>
            2. {level.label}
          </Link>
        ) : (
          <span>2. Matière</span>
        )}
        <span>›</span>
        {subject ? (
          <Link
            to={journeyURL("/decouvrir", {
              level: level?.id,
              subject: subject.id,
            })}
          >
            3. {subject.label}
          </Link>
        ) : (
          <span>3. Cours</span>
        )}
      </nav>
      <PageHeader
        eyebrow="À TON RYTHME, SANS COMPTE POUR DÉCOUVRIR"
        title={
          id
            ? course?.title || "Cours indisponible"
            : subject
              ? `Les cours de ${subject.label}`
              : level
                ? "Choisis ta matière"
                : "Quel est ton niveau ?"
        }
        description={
          id
            ? course?.summary
            : level
              ? level.label
              : "Explore les matières, lis les cours, puis choisis le pack qui te correspond."
        }
      />
      {id ? (
        course ? (
          <div className="course-reading-layout">
            <div className="stack">
              <Panel>
                <span className="eyebrow">
                  {subject?.label} · {course.teacher_name}
                </span>
                <h2>{course.chapter_label || course.title}</h2>
              </Panel>
              <CourseVideo
                provider={course.video_provider}
                id={course.video_id}
                title={course.title}
              />
              <CourseBook key={course.id} courseId={course.id} discovery />
              <Panel>
                <div
                  className="lesson-body"
                  dir={course.content_language === "ar" ? "rtl" : "auto"}
                >
                  <Markdown>{course.body}</Markdown>
                </div>
              </Panel>
            </div>
            <section
              className="stack course-practice"
              aria-label="Exercices du cours"
            >
              <Panel title="À toi de pratiquer">
                <p>
                  Les exercices et les lives sont inclus dans les packs de cette
                  matière.
                </p>
                <div className="exercise-list">
                  {catalog.exercises.map((e, i) => (
                    <Link
                      key={e.id}
                      to={journeyURL(`/decouvrir/exercices/${e.id}`, {
                        ...context,
                        exercise: e.id,
                      })}
                    >
                      <span className="exercise-number">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <strong>{e.title}</strong>
                        <small>{e.difficulty}</small>
                      </div>
                      <LockKeyhole size={18} />
                    </Link>
                  ))}
                </div>
                {!catalog.exercises.length && (
                  <Empty title="Les exercices arrivent bientôt" />
                )}
              </Panel>
              <ButtonLink to={journeyURL("/packs", context)}>
                Découvrir les packs <ArrowRight size={17} />
              </ButtonLink>
            </section>
          </div>
        ) : (
          <Empty
            title="Ce cours n’est pas disponible"
            action={
              <ButtonLink to="/decouvrir">Explorer les niveaux</ButtonLink>
            }
          />
        )
      ) : !level ? (
        <div className="discovery-grid">
          {catalog.levels.map((l) => (
            <Link
              className="discovery-tile"
              key={l.id}
              to={journeyURL("/decouvrir", { level: l.id })}
            >
              <BookOpen />
              <span>{l.cycle === "college" ? "COLLÈGE" : "LYCÉE"}</span>
              <h2>{l.label}</h2>
              <ArrowRight />
            </Link>
          ))}
        </div>
      ) : !subject ? (
        <>
          <div className="discovery-grid">
            {catalog.subjects.map((s) => (
              <Link
                className="discovery-tile"
                key={s.id}
                to={journeyURL("/decouvrir", {
                  level: level.id,
                  subject: s.id,
                })}
              >
                <BookOpen />
                <h2>{s.label}</h2>
                <span>Voir les cours disponibles</span>
                <ArrowRight />
              </Link>
            ))}
          </div>
          {!catalog.subjects.length && (
            <Empty
              title="Les matières de ce niveau sont en préparation"
              description="Les matières apparaissent dès leur association à une classe active par l’administration."
            />
          )}
          <ButtonLink
            variant="secondary"
            to={journeyURL("/packs", { level: level.id })}
          >
            Consulter les packs
          </ButtonLink>
        </>
      ) : (
        <>
          <div className="discovery-grid">
            {catalog.courses.map((c) => (
              <Panel key={c.id} className="catalog-course">
                <Badge>{c.chapter_label || "Le cours"}</Badge>
                <h2>
                  <Link
                    to={journeyURL(`/decouvrir/cours/${c.id}`, {
                      level: level.id,
                      subject: subject.id,
                    })}
                  >
                    {c.title}
                  </Link>
                </h2>
                <p>{c.summary}</p>
                <span className="muted">Avec {c.teacher_name}</span>
                <ButtonLink
                  to={journeyURL(`/decouvrir/cours/${c.id}`, {
                    level: level.id,
                    subject: subject.id,
                  })}
                >
                  Ouvrir le cours <ArrowRight size={17} />
                </ButtonLink>
              </Panel>
            ))}
          </div>
          {!catalog.courses.length && (
            <Empty
              title="Les cours arrivent bientôt"
              description="Seuls les cours publiés par les professeurs sont présentés ici."
            />
          )}
          <div className="actions">
            {offset > 0 && (
              <Button
                variant="secondary"
                onClick={() => setOffset((n) => Math.max(0, n - 24))}
              >
                Page précédente
              </Button>
            )}
            {catalog.has_more && (
              <Button onClick={() => setOffset((n) => n + 24)}>
                Page suivante
              </Button>
            )}
          </div>
        </>
      )}
    </>
  );
}
function CatalogError({ error, retry }: { error: string; retry: () => void }) {
  return (
    <Notice tone="error">
      {error}
      <Button variant="secondary" onClick={retry}>
        Réessayer
      </Button>
    </Notice>
  );
}
export function ExerciseEntry() {
  const { id } = useParams(),
    { user, loading: accountLoading, data, demo } = useApp();
  const { catalog, loading, error, retry } = useCatalog({ exercise: id }),
    [allowed, setAllowed] = useState<boolean | null>(null),
    [accessRetry, setAccessRetry] = useState(0),
    [accessError, setAccessError] = useState("");
  useEffect(() => {
    let alive = true;
    setAllowed(null);
    setAccessError("");
    if (!user || user.status !== "active" || user.role !== "student") {
      setAllowed(false);
      return;
    }
    if (demo) {
      setAllowed(data.exercises.some((e) => e.id === id));
      return;
    }
    void supabase!.rpc("can_read_exercise", { p_exercise_id: id }).then((r) => {
      if (!alive) return;
      if (r.error)
        setAccessError("Impossible de vérifier ton accès. Réessaie.");
      else setAllowed(r.data === true);
    });
    return () => {
      alive = false;
    };
  }, [id, user?.id, user?.status, data.exercises, demo, accessRetry]);
  if (loading || accountLoading || (allowed === null && !accessError))
    return <Loading />;
  if (error || accessError)
    return (
      <CatalogError
        error={error || accessError}
        retry={() => {
          retry();
          setAccessError("");
          setAllowed(null);
          setAccessRetry((n) => n + 1);
        }}
      />
    );
  if (allowed) return <Navigate replace to={`/etudiant/exercices/${id}`} />;
  if (!catalog?.exercise_id)
    return (
      <Empty
        title="Cet exercice n’est pas disponible"
        action={<ButtonLink to="/decouvrir">Explorer les cours</ButtonLink>}
      />
    );
  return (
    <Navigate
      replace
      to={journeyURL("/packs", {
        level: catalog.level_id!,
        subject: catalog.subject_id!,
        course: catalog.course_id!,
        exercise: catalog.exercise_id,
      })}
    />
  );
}
export function PacksPage() {
  const location = useLocation(),
    navigate = useNavigate(),
    j = readJourney(location.search),
    { user, loading: accountLoading, mutate, refresh, demo, data } = useApp();
  const { catalog, loading, error, retry } = useCatalog(j);
  const [busy, setBusy] = useState(false),
    [selection, setSelection] = useState<string[] | null>(j.subjects ?? null),
    [failure, setFailure] = useState(""),
    [order, setOrder] = useState<PackOrder | null>(null),
    [checking, setChecking] = useState(false);
  const orderId = new URLSearchParams(location.search).get("order");
  const orderContext = useRef("");
  orderContext.current = `${user?.id || ""}:${orderId || ""}`;
  useEffect(
    () => setSelection(readJourney(location.search).subjects ?? null),
    [location.search],
  );
  async function checkOrder() {
    const context = orderContext.current;
    setChecking(true);
    setFailure("");
    try {
      if (!user || !orderId) {
        setOrder(null);
        return;
      }
      if (demo) {
        setOrder(
          data.pack_orders.find(
            (o) => o.id === orderId && o.student_id === user.id,
          ) || null,
        );
        return;
      }
      const r = await supabase!
        .from("pack_orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();
      if (r.error) throw Error("Impossible de vérifier la demande.");
      if (context !== orderContext.current) return;
      setOrder(r.data as PackOrder | null);
      await refresh();
    } catch (e) {
      if (context === orderContext.current) setFailure(errorMessage(e));
    } finally {
      setChecking(false);
    }
  }
  useEffect(() => {
    setOrder(null);
    if (user && orderId) void checkOrder();
  }, [orderId, user?.id]);
  if (loading || accountLoading) return <Loading />;
  if (error) return <CatalogError error={error} retry={retry} />;
  if (!catalog) return null;
  const level = catalog.levels.find(
      (l) => l.id === (catalog.level_id || j.level),
    ),
    offer = catalog.packs.find((p) => p.id === j.pack),
    available = catalog.subjects;
  const chosen = (
    selection ?? (catalog.subject_id ? [catalog.subject_id] : [])
  ).filter((id) => available.some((s) => s.id === id));
  const valid =
    !!level &&
    !!offer &&
    offer.is_active &&
    available.length >= offer.subject_count &&
    chosen.length === offer.subject_count;
  const context: Journey = {
    ...j,
    level: level?.id,
    subject: catalog.subject_id || j.subject,
    course: catalog.course_id || j.course,
    exercise: catalog.exercise_id || j.exercise,
  };
  function update(patch: Partial<Journey>) {
    setFailure("");
    if (patch.subjects) setSelection(patch.subjects);
    navigate(journeyURL("/packs", { ...context, ...patch, key: undefined }));
  }
  async function continueOrder() {
    if (!valid) return;
    const checkout = {
        ...context,
        pack: offer!.id,
        subjects: chosen,
        key: j.key || crypto.randomUUID(),
      },
      url = journeyURL("/packs", checkout);
    rememberCheckout(url);
    if (!user) {
      navigate("/connexion");
      return;
    }
    setBusy(true);
    setFailure("");
    try {
      const result = await mutate<PackOrder>("request_pack_order", {
        p_pack_id: offer!.id,
        p_level_id: level!.id,
        p_subject_ids: chosen,
        p_idempotency_key: checkout.key,
        p_course_id: context.course || null,
        p_exercise_id: context.exercise || null,
      });
      localStorage.removeItem("kf-checkout-return");
      setOrder(result);
      navigate(url + `&order=${result.id}`, { replace: true });
    } catch (e) {
      setFailure(errorMessage(e));
      navigate(url, { replace: true });
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="TES MATIÈRES, TON CHOIX"
        title={order ? "Ta demande de pack" : "Choisis ton pack"}
        description="Un prix total clair. Les cours, les exercices et les séances live des matières que tu choisis."
        back={
          context.course
            ? journeyURL(`/decouvrir/cours/${context.course}`, {
                level: context.level,
                subject: context.subject,
              })
            : "/decouvrir"
        }
      />
      {failure && <Notice tone="error">{failure}</Notice>}
      {order ? (
        <Panel className="checkout-summary">
          <Badge status={order.status} />
          <h2>
            {order.pack_name} · {Number(order.total_price)} DH au total
          </h2>
          <p>{catalog.levels.find((l) => l.id === order.level_id)?.label}</p>
          <ul>
            {order.subject_ids.map((id) => (
              <li key={id}>
                {available.find((s) => s.id === id)?.label ||
                  data.subjects.find((s) => s.id === id)?.label ||
                  id}
              </li>
            ))}
          </ul>
          <p className="small-text">
            Demande du {date(order.created_at, true)} · Référence {order.id}
          </p>
          {order.status === "pending_review" ? (
            <Notice>
              Demande enregistrée, en attente de vérification du règlement par
              l’administration. Aucun droit n’est encore activé. Le paiement en
              ligne n’est pas connecté ; contacte l’administration avec cette
              référence pour connaître les modalités de règlement.
            </Notice>
          ) : order.status === "active" ? (
            <Notice tone="success">
              Le règlement a été validé par l’administration. Tes matières sont
              accessibles.
            </Notice>
          ) : (
            <Notice>
              Cette demande est{" "}
              {order.status === "rejected" ? "refusée" : "révoquée"}. Elle ne
              donne aucun droit d’accès.
            </Notice>
          )}
          <div className="actions">
            <Button
              disabled={checking}
              onClick={() => void checkOrder()}
              variant="secondary"
            >
              {checking ? "Vérification…" : "Actualiser le statut"}
            </Button>
            {order.status === "active" && (
              <ButtonLink
                to={
                  order.exercise_id
                    ? `/decouvrir/exercices/${order.exercise_id}`
                    : "/etudiant"
                }
              >
                {order.exercise_id ? "Reprendre mon exercice" : "Mon espace"}
                <ArrowRight size={17} />
              </ButtonLink>
            )}
            <ButtonLink
              variant="ghost"
              to={journeyURL("/packs", { level: order.level_id })}
            >
              Consulter les packs
            </ButtonLink>
          </div>
          {order.status === "active" &&
            order.exercise_id &&
            !order.subject_ids.includes(catalog.subject_id || "") && (
              <Notice>
                La matière de l’exercice initial ne fait pas partie de ce pack.
                Cet exercice reste protégé.
              </Notice>
            )}
        </Panel>
      ) : (
        <>
          {context.exercise && (
            <Notice>
              <LockKeyhole size={17} /> Pour ouvrir cet exercice, choisis un
              pack incluant sa matière. Tu peux modifier la présélection.
            </Notice>
          )}
          <Field label="Ton niveau scolaire">
            <select
              value={level?.id || ""}
              onChange={(e) =>
                navigate(journeyURL("/packs", { level: e.target.value }))
              }
            >
              <option value="">Choisir un niveau</option>
              {catalog.levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="pack-grid">
            {catalog.packs.map((p) => {
              const reason = !p.is_active
                ? "Ce pack est temporairement indisponible."
                : !level
                  ? "Choisis d’abord ton niveau."
                  : available.length < p.subject_count
                    ? `Ce niveau propose ${available.length} matière${available.length > 1 ? "s" : ""} ; ce pack en nécessite ${p.subject_count}.`
                    : "";
              return (
                <Panel
                  className={`pack-card ${j.pack === p.id ? "selected" : ""}`}
                  key={p.id}
                >
                  <span className="eyebrow">{p.name}</span>
                  <div className="pack-price">
                    {Number(p.total_price)} <span>DH</span>
                  </div>
                  <p>Prix total du pack</p>
                  <h2>
                    {p.subject_count} matière{p.subject_count > 1 ? "s" : ""} au
                    choix
                  </h2>
                  <ul>
                    <li>
                      <Check size={17} />
                      Tous les cours et exercices
                    </li>
                    <li>
                      <Video size={17} />
                      Séances live avec les professeurs
                    </li>
                  </ul>
                  <Button
                    variant={j.pack === p.id ? "primary" : "secondary"}
                    disabled={!!reason}
                    aria-pressed={j.pack === p.id}
                    onClick={() =>
                      update({
                        pack: p.id,
                        subjects: chosen.slice(0, p.subject_count),
                      })
                    }
                  >
                    {j.pack === p.id ? "Pack sélectionné" : `Choisir ${p.name}`}
                  </Button>
                  {reason && <p className="small-text">{reason}</p>}
                </Panel>
              );
            })}
          </div>
          {offer && level && (
            <div className="split-layout pack-selection">
              <Panel title="Choisis tes matières">
                <p role="status" aria-live="polite">
                  {chosen.length}/{offer.subject_count} matière
                  {offer.subject_count > 1 ? "s" : ""} sélectionnée
                  {offer.subject_count > 1 ? "s" : ""}
                </p>
                <div className="subject-choices">
                  {available.map((s) => (
                    <label
                      className={`subject-choice ${chosen.includes(s.id) ? "selected" : ""}`}
                      key={s.id}
                    >
                      <input
                        type="checkbox"
                        checked={chosen.includes(s.id)}
                        disabled={
                          !chosen.includes(s.id) &&
                          chosen.length >= offer.subject_count
                        }
                        onChange={() =>
                          update({
                            subjects: chosen.includes(s.id)
                              ? chosen.filter((id) => id !== s.id)
                              : [...chosen, s.id],
                          })
                        }
                      />
                      <BookOpen size={20} />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
                {!available.length && (
                  <Empty title="Aucune matière disponible à ce niveau" />
                )}
              </Panel>
              <Panel title="Ton récapitulatif" className="checkout-summary">
                <h3>
                  {offer.name} · {Number(offer.total_price)} DH au total
                </h3>
                <p>{level.label}</p>
                <ul>
                  {chosen.map((id) => (
                    <li key={id}>
                      {available.find((s) => s.id === id)?.label}
                    </li>
                  ))}
                </ul>
                {context.subject &&
                  !chosen.includes(context.subject) &&
                  context.exercise && (
                    <Notice>
                      La matière de ton exercice n’est plus sélectionnée. Ce
                      pack ne débloquera pas cet exercice.
                    </Notice>
                  )}
                <Notice>
                  Le paiement en ligne n’est pas connecté. Ta demande sera
                  enregistrée ; seul un administrateur pourra activer le pack
                  après vérification du règlement.
                </Notice>
                {user && user.role !== "student" ? (
                  <Notice>
                    Les achats de packs sont réservés aux comptes étudiants.
                  </Notice>
                ) : user && !["pending", "active"].includes(user.status) ? (
                  <Notice>
                    Contacte l’administration pour rétablir ton compte avant de
                    demander un pack.
                  </Notice>
                ) : (
                  <Button
                    disabled={!valid || busy}
                    onClick={() => void continueOrder()}
                  >
                    {busy
                      ? "Enregistrement…"
                      : user
                        ? "Envoyer ma demande d’achat"
                        : "Continuer vers l’achat"}
                    <ArrowRight size={17} />
                  </Button>
                )}
                {!user && (
                  <p className="small-text">
                    Connexion ou inscription à la prochaine étape. Ton choix
                    sera conservé.
                  </p>
                )}
              </Panel>
            </div>
          )}
        </>
      )}
    </>
  );
}
export function StudentPacks({ compact = false }: { compact?: boolean }) {
  const { data, user, hasMore, loadMore } = useApp();
  const orders = data.pack_orders.filter((o) => o.student_id === user?.id),
    active = orders.filter((o) => o.status === "active");
  return (
    <Panel
      title={compact ? "Mes packs et matières" : "Mes packs"}
      action={
        <ButtonLink variant="secondary" to="/packs">
          Voir les autres packs
        </ButtonLink>
      }
    >
      {!active.length && (
        <p>
          Aucun pack actif. Tes accès déjà attribués par l’administration
          restent disponibles dans « Mes matières ».
        </p>
      )}
      {(compact ? active : orders).map((o) => (
        <div className="pack-order-row" key={o.id}>
          <div>
            <strong>
              {o.pack_name} · {Number(o.total_price)} DH au total
            </strong>
            <p>{data.levels.find((l) => l.id === o.level_id)?.label}</p>
            <div className="actions">
              {o.subject_ids.map((id) => (
                <Link
                  className="badge"
                  key={id}
                  to={journeyURL("/decouvrir", {
                    level: o.level_id,
                    subject: id,
                  })}
                >
                  {data.subjects.find((s) => s.id === id)?.label ||
                    "Voir la matière"}
                </Link>
              ))}
            </div>
          </div>
          <div className="stack">
            <Badge status={o.status} />
            <ButtonLink
              variant="ghost"
              to={
                journeyURL("/packs", {
                  level: o.level_id,
                  course: o.course_id || undefined,
                  exercise: o.exercise_id || undefined,
                }) + `&order=${o.id}`
              }
            >
              Voir la demande
            </ButtonLink>
          </div>
        </div>
      ))}
      {compact && orders.some((o) => o.status === "pending_review") && (
        <ButtonLink variant="ghost" to="/etudiant/packs">
          Voir mes demandes en attente
        </ButtonLink>
      )}
      {hasMore.pack_orders && (
        <Button
          variant="secondary"
          onClick={() => void loadMore("pack_orders")}
        >
          Charger d’autres packs
        </Button>
      )}
      {active.length > 0 && (
        <div className="actions">
          <ButtonLink to="/etudiant/matieres">
            Mes cours et exercices
          </ButtonLink>
          <ButtonLink variant="secondary" to="/etudiant/seances">
            Mes séances live
          </ButtonLink>
        </div>
      )}
    </Panel>
  );
}
export function StudentPacksPage() {
  return (
    <>
      <PageHeader
        title="Mes packs"
        description="Retrouve tes matières et le statut de tes demandes."
      />
      <StudentPacks />
    </>
  );
}
