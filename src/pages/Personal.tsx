import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bell, Check, LockKeyhole, LogOut } from "lucide-react";
import { useApp } from "../app/AppProvider";
import {
  AsyncForm,
  Badge,
  Button,
  ButtonLink,
  Empty,
  Field,
  Logo,
  Notice,
  PageHeader,
  Panel,
  Pagination,
  Tabs,
} from "../components/ui";
import { date, initials, roleLabel, rolePath } from "../lib/utils";
import { supabase, appURL } from "../lib/supabase";
const notificationLabels: Record<string, string> = {
  pack_active: "Ton pack est actif",
  pack_rejected: "Une réponse à ta demande de pack",
  pack_revoked: "Un pack a été révoqué",
  correction_published: "Une correction est disponible",
  evaluation_published: "Une correction est disponible",
  work_submitted: "Un nouveau travail a été remis",
  course_published: "Un nouveau cours est disponible",
  announcement_published: "Une nouvelle annonce",
  meeting_scheduled: "Une nouvelle séance",
  meeting_cancelled: "Une séance a été annulée",
  meeting_updated: "Une séance a été modifiée",
  admission_accepted: "Ton inscription est acceptée",
  admission_rejected: "Une réponse à ta demande",
  subject_access_changed: "Un accès matière a été modifié",
  resubmission_requested: "Une nouvelle version est demandée",
  results_published: "Les résultats sont disponibles",
};
export function Notifications() {
  const { data, user, mutate, notify, hasMore, loadMore } = useApp();
  const [tab, setTab] = useState("Toutes"),
    [error, setError] = useState(""),
    [page, setPage] = useState(1);
  const rows = data.notifications
    .filter(
      (n) => n.recipient_id === user!.id && (tab === "Toutes" || !n.read_at),
    )
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  function target(type: string, id: string) {
    const base = rolePath(user!.role);
    return (
      (
        {
          submission: `${base}/${user!.role === "teacher" ? "copies" : "mes-travaux"}/${id}`,
          course: `${base}/cours/${id}`,
          meeting: `${base}/seances/${id}`,
          competition: `${base}/competitions/${id}`,
          announcement: `${base}/annonces`,
          admission: "/admission",
          pack_order: "/etudiant/packs",
        } as Record<string, string>
      )[type] || base
    );
  }
  return (
    <>
      <PageHeader
        eyebrow="NE RIEN MANQUER D’ESSENTIEL"
        title="Notifications"
        description="Les nouvelles de ton parcours, au même endroit."
        action={
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await mutate("mark_notification_read", { p_id: null });
                notify("Toutes les notifications sont marquées comme lues.");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <Check size={17} />
            Tout marquer comme lu
          </Button>
        }
      />
      <Panel>
        <Tabs
          options={["Toutes", "Non lues"]}
          value={tab}
          onChange={(s) => {
            setTab(s);
            setPage(1);
          }}
        />
        {rows.slice((page - 1) * 8, page * 8).map((n) => (
          <Link
            className={`notification-row ${n.read_at ? "read" : ""}`}
            key={n.id}
            to={target(n.target_type, n.target_id)}
            onClick={() =>
              void mutate("mark_notification_read", { p_id: n.id }).catch((e) =>
                setError(e.message),
              )
            }
          >
            <span className="notification-icon">
              <Bell size={20} />
            </span>
            <div>
              <h3>
                {notificationLabels[n.type] ||
                  "Une nouvelle information dans ton espace"}
              </h3>
              <p>
                Ouvre ton espace pour consulter les informations disponibles.
              </p>
              <small>{date(n.created_at, true)}</small>
            </div>
            {!n.read_at && <span className="unread-dot" />}
            <ArrowRight size={17} />
          </Link>
        ))}
        {!rows.length && (
          <Empty
            title="Tu es à jour."
            description="Les prochaines nouvelles apparaîtront ici."
          />
        )}
        <Pagination total={rows.length} page={page} onChange={setPage} />
        {hasMore.notifications && (
          <Button
            variant="secondary"
            onClick={() => void loadMore("notifications")}
          >
            Charger les notifications suivantes
          </Button>
        )}
        {error && <Notice tone="error">{error}</Notice>}
      </Panel>
    </>
  );
}
export function Profile() {
  const { data, user, updateProfile, logout, demo } = useApp();
  const [tab, setTab] = useState("Informations"),
    [error, setError] = useState(""),
    [resetSent, setResetSent] = useState(false);
  const enrollment = data.class_enrollments.find(
      (e) => e.student_id === user!.id && e.status === "active",
    ),
    cls = data.classes.find((c) => c.id === enrollment?.class_id);
  return (
    <>
      <PageHeader
        eyebrow="TON PARCOURS, TON ESPACE"
        title="Mon profil"
        description="Les informations utiles pour apprendre ensemble."
      />
      <div className="profile-layout">
        <Panel className="profile-card">
          <span className="avatar profile-avatar">{initials(user!.name)}</span>
          <h2>{user!.name}</h2>
          <Badge>{roleLabel(user!.role)}</Badge>
          {cls && <p>{cls.name}</p>}
          <p className="muted">{user!.email}</p>
        </Panel>
        <Panel>
          <Tabs
            options={["Informations", "Sécurité"]}
            value={tab}
            onChange={setTab}
          />
          {tab === "Informations" ? (
            <AsyncForm
              success="Le profil a été mis à jour."
              onSubmit={async (f) => {
                const fd = new FormData(f);
                await updateProfile(
                  String(fd.get("name")),
                  String(fd.get("language")),
                );
              }}
            >
              <Field label="Nom d’affichage">
                <input
                  name="name"
                  defaultValue={user!.name}
                  required
                  maxLength={120}
                  autoComplete="name"
                />
              </Field>
              <Field label="Adresse email">
                <input type="email" readOnly value={user!.email} />
              </Field>
              <Field label="Langue préférée">
                <select
                  name="language"
                  defaultValue={
                    data.profiles.find((p) => p.id === user!.id)
                      ?.preferred_language || "fr"
                  }
                >
                  <option value="fr">Français</option>
                  <option value="ar">العربية (contenus et préférence)</option>
                </select>
              </Field>
              {user!.role === "student" && (
                <>
                  <Field label="Classe">
                    <input readOnly value={cls?.name || "Non attribuée"} />
                  </Field>
                  <Field label="Année scolaire">
                    <input
                      readOnly
                      value={
                        data.academic_years.find(
                          (y) => y.id === cls?.academic_year_id,
                        )?.label || "—"
                      }
                    />
                  </Field>
                  <Notice>
                    La classe, le rôle et les autorisations sont gérés par
                    l’administration.
                  </Notice>
                </>
              )}
              <Button type="submit">Enregistrer les modifications</Button>
            </AsyncForm>
          ) : (
            <div className="stack">
              <div className="security-block">
                <LockKeyhole size={24} />
                <div>
                  <h2>Mot de passe</h2>
                  <p>
                    Un lien de récupération permet de choisir un nouveau mot de
                    passe en toute sécurité.
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                disabled={demo || resetSent}
                onClick={async () => {
                  try {
                    if (!supabase) return;
                    const r = await supabase.auth.resetPasswordForEmail(
                      user!.email,
                      { redirectTo: `${appURL}/nouveau-mot-de-passe` },
                    );
                    if (r.error) throw r.error;
                    setResetSent(true);
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Recevoir un lien de modification
              </Button>
              {resetSent && (
                <Notice tone="success">
                  Un lien de récupération a été envoyé.
                </Notice>
              )}
              {demo && (
                <Notice>
                  Les emails de sécurité sont désactivés dans la démonstration.
                </Notice>
              )}
              <Button variant="ghost" onClick={() => void logout()}>
                <LogOut size={17} />
                Se déconnecter
              </Button>
              {error && <Notice tone="error">{error}</Notice>}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
export function Legal() {
  const isPrivacy = window.location.pathname === "/confidentialite";
  return (
    <div className="legal-page">
      <header>
        <Logo />
        <ButtonLink variant="secondary" to="/">
          Retour à l’accueil
        </ButtonLink>
      </header>
      <main>
        <span className="editorial-kicker">
          KON-FANAN · INFORMATION DE PRÉLANCEMENT
        </span>
        <h1>{isPrivacy ? "Confidentialité" : "Conditions d’utilisation"}</h1>
        <Notice>
          Cette plateforme est en préparation. Les mentions de l’exploitant, les
          coordonnées de contact et les durées de conservation doivent être
          complétées avant une ouverture au public.
        </Notice>
        {isPrivacy ? (
          <>
            <h2>Un espace pédagogique privé</h2>
            <p>
              Le compte utilise un nom d’affichage et une adresse email. Les
              copies, commentaires, notes et autorisations sont accessibles
              uniquement aux personnes habilitées dans leur contexte
              pédagogique.
            </p>
            <h2>Les services utilisés</h2>
            <p>
              Supabase assure l’identité, les données et les fichiers privés.
              Les vidéos YouTube/Vimeo ne sont chargées qu’à l’ouverture du
              lecteur. Les séances Google Meet sont ouvertes dans un nouvel
              onglet ; la connexion Google du professeur permet de créer les
              événements de cours.
            </p>
            <h2>La démonstration</h2>
            <p>
              Les personnes et les données pédagogiques préchargées sont
              fictives. Les fichiers ajoutés en démonstration sont conservés
              uniquement dans ce navigateur via IndexedDB. Évite d’y déposer des
              documents personnels réels.
            </p>
            <h2>Demandes relatives aux données</h2>
            <p>
              Le responsable de traitement et le moyen de contact seront publiés
              ici avant le lancement. La politique de conservation, d’export et
              de suppression doit être arrêtée par l’exploitant.
            </p>
          </>
        ) : (
          <>
            <h2>Accès à la plateforme</h2>
            <p>
              L’inscription étudiante est soumise à confirmation de l’email et à
              validation de l’administration. Les contenus accessibles dépendent
              de la classe et des matières autorisées. Les professeurs sont
              invités par l’administration.
            </p>
            <h2>Travail personnel</h2>
            <p>
              Les copies déposées doivent correspondre à ton travail et ne
              contenir que les éléments nécessaires à l’exercice. Une version
              remise est conservée ; une nouvelle version nécessite une
              réouverture par le professeur.
            </p>
            <h2>Contenus et séances</h2>
            <p>
              Les ressources sont destinées à l’apprentissage dans le groupe
              autorisé. Les séances et les vidéos externes dépendent de la
              disponibilité de leurs fournisseurs.
            </p>
            <h2>Avant l’ouverture publique</h2>
            <p>
              Les mentions d’éditeur et d’hébergeur, les coordonnées de support
              et les conditions définitives adaptées au public visé restent à
              finaliser.
            </p>
          </>
        )}
        <ButtonLink to="/inscription">
          Retour à l’inscription <ArrowRight size={16} />
        </ButtonLink>
      </main>
    </div>
  );
}
