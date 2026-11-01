import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ArrowLeft,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Clock,
  Check,
  GraduationCap,
  Users,
  Settings2,
  Mail,
} from "lucide-react";
import { useApp } from "../app/AppProvider";
import { appURL, supabase, demoEnabled } from "../lib/supabase";
import { demoID } from "../lib/demo";
import { checkoutReturn, rememberCheckout } from "../lib/packs";
import { StudentPacks } from "./Discovery";
import { rolePath, roleLabel } from "../lib/utils";
import type { Role } from "../lib/types";
import {
  Logo,
  Panel,
  Field,
  AsyncForm,
  Button,
  Notice,
  Badge,
  Loading,
  ButtonLink,
} from "../components/ui";
export default function Auth() {
  const location = useLocation(),
    navigate = useNavigate();
  const { user, loginDemo } = useApp();
  const [show, setShow] = useState(false),
    [complete, setComplete] = useState(false),
    [classes, setClasses] = useState<
      { id: string; name: string; year_label?: string }[]
    >([]),
    [classError, setClassError] = useState("");
  const path = location.pathname;
  const returnTo = checkoutReturn();
  const signup = path === "/inscription",
    forgot = path === "/mot-de-passe-oublie",
    reset = path === "/nouveau-mot-de-passe";
  useEffect(() => {
    setComplete(false);
    if (signup) {
      if (!supabase) {
        setClasses([
          { id: demoID(50), name: "3ème collège A", year_label: "2026–2027" },
        ]);
        return;
      }
      void supabase.rpc("open_classes").then((r) => {
        if (r.error)
          setClassError("Les classes ne sont pas disponibles. Réessayez.");
        else setClasses(r.data || []);
      });
    }
  }, [path]);
  if (user && !reset)
    return (
      <Navigate
        to={
          returnTo &&
          user.role === "student" &&
          ["pending", "active"].includes(user.status)
            ? returnTo
            : user.status === "active"
              ? rolePath(user.role)
              : user.status === "suspended"
                ? "/compte-suspendu"
                : "/admission"
        }
        replace
      />
    );
  async function submit(form: HTMLFormElement) {
    if (!supabase)
      throw Error(
        "Configurez Supabase pour utiliser l’authentification réelle. La démonstration est accessible ci-dessous.",
      );
    const fd = new FormData(form),
      email = String(fd.get("email") || ""),
      password = String(fd.get("password") || "");
    if (signup || reset) {
      if (password !== fd.get("confirmation"))
        throw Error("Les mots de passe ne correspondent pas.");
      if (password.length < 12)
        throw Error("Utilise au moins 12 caractères pour ton mot de passe.");
    }
    if (signup) {
      const chosen = String(fd.get("class"));
      const r = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: String(fd.get("name")) },
          emailRedirectTo: `${appURL}/auth/callback${returnTo ? `?retour=${encodeURIComponent(returnTo)}` : ""}`,
        },
      });
      if (r.error) throw Error(r.error.message);
      if (!returnTo) localStorage.setItem("kf-requested-class", chosen);
      setComplete(true);
    } else if (forgot) {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appURL}/nouveau-mot-de-passe`,
      });
      setComplete(true);
    } else if (reset) {
      const r = await supabase.auth.updateUser({ password });
      if (r.error)
        throw Error(
          "Ce lien ne peut plus être utilisé. Demande un nouveau lien de récupération.",
        );
      setComplete(true);
    } else {
      const r = await supabase.auth.signInWithPassword({ email, password });
      if (r.error)
        throw Error(
          r.error.code === "email_not_confirmed"
            ? "Confirme ton adresse email avant de te connecter."
            : "Adresse email ou mot de passe incorrect.",
        );
      navigate("/auth/callback");
    }
  }
  const title = signup
    ? "Crée ton compte."
    : forgot
      ? "Mot de passe oublié ?"
      : reset
        ? "Un nouveau départ."
        : "Heureux de te retrouver.";
  return (
    <div className="auth-page">
      <div className="auth-brand">
        <Logo />
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />
          Retour à l’accueil
        </Link>
      </div>
      <div className="auth-grid">
        <section className="auth-editorial">
          <div className="eyebrow">LE SAVOIR OUVRE DES PORTES</div>
          <h1>
            {signup ? (
              <>
                TON PARCOURS
                <br />
                COMMENCE <em>ICI.</em>
              </>
            ) : (
              <>
                CHAQUE JOUR,
                <br />
                UN NOUVEAU
                <br />
                <em>DÉCLIC.</em>
              </>
            )}
          </h1>
          <p>
            Une question. Une explication.
            <br />
            Et soudain, tout devient plus clair.
          </p>
          <span className="auth-mini-note">
            <BookOpen size={20} />
            Apprendre, comprendre, réussir.
          </span>
        </section>
        <Panel className="auth-form-panel">
          <span className="auth-icon">
            {forgot ? <Mail /> : <GraduationCap />}
          </span>
          <h2>{title}</h2>
          <p className="muted">
            {signup
              ? "Une première étape vers ce que tu peux devenir."
              : forgot
                ? "Un lien sécurisé pour retrouver ton espace."
                : reset
                  ? "Choisis un mot de passe d’au moins 12 caractères."
                  : "Retrouve tes cours et tes prochaines découvertes."}
          </p>
          {complete ? (
            <div className="stack">
              <Notice tone="success">
                {signup
                  ? returnTo
                    ? "Vérifie ta boîte email pour confirmer ton inscription. Ton pack et tes matières sont conservés pour reprendre ta demande d’achat."
                    : "Vérifie ta boîte email pour confirmer ton inscription. Tes matières seront attribuées après validation par l’administration."
                  : forgot
                    ? "Si un compte correspond à cette adresse, un email de récupération a été envoyé."
                    : "Ton mot de passe a été enregistré."}
              </Notice>
              <ButtonLink to="/connexion" variant="secondary">
                Retour à la connexion
              </ButtonLink>
            </div>
          ) : (
            <AsyncForm key={path} onSubmit={submit}>
              {signup && (
                <Field label="Nom complet">
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={120}
                    placeholder="Ton prénom et ton nom"
                  />
                </Field>
              )}
              {!reset && (
                <Field label="Adresse email">
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="toi@exemple.com"
                  />
                </Field>
              )}
              {!forgot && (
                <Field
                  label={reset ? "Nouveau mot de passe" : "Mot de passe"}
                  hint={
                    signup
                      ? "12 caractères minimum. Une phrase de passe est une bonne idée."
                      : undefined
                  }
                >
                  <span className="password-field">
                    <input
                      name="password"
                      type={show ? "text" : "password"}
                      autoComplete={
                        signup || reset ? "new-password" : "current-password"
                      }
                      minLength={signup || reset ? 12 : 1}
                      required
                      placeholder="Ton mot de passe"
                    />
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => setShow(!show)}
                      aria-label={
                        show
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                    >
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </span>
                </Field>
              )}
              {(signup || reset) && (
                <Field label="Confirmer le mot de passe">
                  <input
                    name="confirmation"
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={12}
                    required
                    placeholder="Le même mot de passe"
                  />
                </Field>
              )}
              {signup && (
                <>
                  {!returnTo && (
                    <Field label="Classe souhaitée">
                      <select name="class" required defaultValue="">
                        <option value="" disabled>
                          Choisir ta classe
                        </option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} — {c.year_label || "2026–2027"}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                  {!returnTo && classError && (
                    <Notice tone="error">{classError}</Notice>
                  )}
                  <label className="checkbox-row">
                    <input type="checkbox" required />
                    <span>
                      J’ai lu les{" "}
                      <Link to="/conditions">conditions d’utilisation</Link> et
                      l’
                      <Link to="/confidentialite">
                        information de confidentialité
                      </Link>
                      .
                    </span>
                  </label>
                  <Notice>
                    {returnTo
                      ? "Retrouve ton choix de pack après confirmation de ton email. Tes droits seront activés après validation du règlement par l’administration."
                      : "Ton inscription sera validée par l’administration, qui attribuera tes matières."}
                  </Notice>
                </>
              )}
              {!signup && !forgot && !reset && (
                <Link className="forgot-link" to="/mot-de-passe-oublie">
                  Mot de passe oublié ?
                </Link>
              )}
              <Button
                type="submit"
                className="button primary full-width"
                disabled={signup && !returnTo && !classes.length}
              >
                {signup
                  ? "Créer mon compte"
                  : forgot
                    ? "Envoyer le lien"
                    : reset
                      ? "Enregistrer mon mot de passe"
                      : "Se connecter"}
                <ArrowRight size={17} />
              </Button>
            </AsyncForm>
          )}
          {!complete && (
            <p className="auth-switch">
              {signup ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
              <Link to={signup ? "/connexion" : "/inscription"}>
                {signup ? "Se connecter" : "S’inscrire"}
              </Link>
            </p>
          )}
          {!supabase && (
            <Notice>
              Authentification réelle non configurée.
              {!demoEnabled &&
                " Renseignez les variables Supabase pour ouvrir la plateforme."}
            </Notice>
          )}
          {demoEnabled && !signup && !forgot && !reset && (
            <div id="demo" className="demo-login">
              <span>EXPLORER LA DÉMONSTRATION</span>
              <p>Données fictives · aucun compte requis</p>
              <div>
                {(["student", "teacher", "admin"] as Role[]).map((role, i) => {
                  const Icon = [GraduationCap, Users, Settings2][i];
                  return (
                    <button
                      key={role}
                      onClick={() => {
                        loginDemo(role);
                        navigate(
                          role === "student" && returnTo
                            ? returnTo
                            : rolePath(role),
                        );
                      }}
                    >
                      <Icon size={19} />
                      {roleLabel(role)}
                      <ArrowRight size={14} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="auth-security">
            <ShieldCheck size={14} />
            Un espace personnel, des accès encadrés.
          </div>
        </Panel>
      </div>
      <footer className="auth-footer">
        Kon-fanan © 2026 <span>Du collège au lycée, à ton rythme.</span>
      </footer>
    </div>
  );
}
export function AuthCallback() {
  const { user, loading, refresh } = useApp();
  const [error, setError] = useState(""),
    [done, setDone] = useState(false);
  useEffect(() => {
    let alive = true;
    async function run() {
      if (!supabase) return;
      const resume = new URLSearchParams(window.location.search).get("retour");
      if (resume) {
        try {
          const target = new URL(resume, window.location.origin);
          if (
            target.origin === window.location.origin &&
            target.pathname === "/packs"
          )
            rememberCheckout(target.pathname + target.search);
        } catch {
          /* ignore invalid return paths */
        }
      }
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const r = await supabase.auth.exchangeCodeForSession(code);
        if (r.error) {
          const s = await supabase.auth.getSession();
          if (!s.data.session) throw Error("Le lien est invalide ou expiré.");
        }
      }
      const cls = localStorage.getItem("kf-requested-class");
      if (cls) {
        const r = await supabase.rpc("request_admission", { p_class_id: cls });
        if (!r.error) localStorage.removeItem("kf-requested-class");
      }
      await refresh();
      if (alive) setDone(true);
    }
    void run().catch((e) => setError(e.message));
    return () => {
      alive = false;
    };
  }, []);
  if (error)
    return (
      <div className="full-state">
        <Notice tone="error">{error}</Notice>
        <ButtonLink to="/connexion">Se connecter</ButtonLink>
      </div>
    );
  if (loading || !done)
    return (
      <div className="full-state">
        <Loading />
      </div>
    );
  return (
    <Navigate
      replace
      to={
        user
          ? checkoutReturn() &&
            user.role === "student" &&
            ["pending", "active"].includes(user.status)
            ? checkoutReturn()!
            : user.status === "active"
              ? rolePath(user.role)
              : "/admission"
          : "/connexion"
      }
    />
  );
}
export function AccountState({ suspended = false }: { suspended?: boolean }) {
  const { user, data, logout, refresh, mutate } = useApp();
  const [choices, setChoices] = useState<{ id: string; name: string }[]>([]);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (supabase)
      void supabase.rpc("open_classes").then((r) => setChoices(r.data || []));
  }, []);
  if (!user) return <Navigate to="/connexion" replace />;
  if (user.status === "active")
    return <Navigate to={rolePath(user.role)} replace />;
  const admission = data.admission_requests.find(
    (a) => a.student_id === user.id,
  );
  return (
    <div className="account-state auth-page">
      <div className="auth-brand">
        <Logo />
        <Button variant="ghost" onClick={() => void logout()}>
          Se déconnecter
        </Button>
      </div>
      <Panel className="account-state-card">
        <span className="state-illustration">
          {suspended ? <ShieldCheck size={40} /> : <Clock size={40} />}
        </span>
        <Badge
          status={
            suspended
              ? "suspended"
              : user.status === "rejected"
                ? "rejected"
                : "pending"
          }
        />
        <h1>
          {suspended
            ? "Ton accès est temporairement suspendu."
            : user.status === "rejected"
              ? "Une réponse à ta demande."
              : "Ton parcours est en préparation."}
        </h1>
        <p>
          {suspended
            ? "Contacte ton administration pour connaître les prochaines étapes."
            : user.status === "rejected"
              ? admission?.public_message ||
                "L’administration n’a pas donné suite à ta demande."
              : "Tes cours et tes matières apparaîtront ici après validation par l’administration."}
        </p>
        <div className="identity-line">
          <span className="avatar">{user.name.charAt(0)}</span>
          <strong>{user.name}</strong>
        </div>
        {!suspended && user.status === "pending" && (
          <ol className="admission-steps">
            <li>
              <Check size={16} />
              Email confirmé
            </li>
            <li>
              {admission ? <Check size={16} /> : <span>2</span>}Demande{" "}
              {admission ? "envoyée" : "à compléter"}
            </li>
            <li>
              <Clock size={16} />
              Validation de l’administration
            </li>
          </ol>
        )}
        {!admission && !suspended && (
          <AsyncForm
            onSubmit={async (f) => {
              await mutate("request_admission", {
                p_class_id: new FormData(f).get("class"),
              });
              setMsg("Ta demande a été envoyée.");
            }}
          >
            <Field label="Classe souhaitée">
              <select required name="class">
                <option value="">Choisir une classe</option>
                {choices.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Button type="submit">Envoyer ma demande</Button>
          </AsyncForm>
        )}
        {msg && <Notice tone="success">{msg}</Notice>}
        {!suspended && user.role === "student" && <StudentPacks />}
        <div className="actions">
          <Button onClick={() => void refresh()}>Actualiser mon statut</Button>
          <Button variant="secondary" onClick={() => void logout()}>
            Se déconnecter
          </Button>
        </div>
      </Panel>
    </div>
  );
}
