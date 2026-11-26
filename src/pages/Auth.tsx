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
import {
  checkoutReturn,
  checkoutJourney,
  rememberCheckout,
} from "../lib/packs";
import {
  EnrollmentStart,
  EnrollmentSteps,
  EnrollmentRecap,
} from "../components/EnrollmentStart";
import { StudentPacks } from "./Discovery";
import { rolePath, roleLabel } from "../lib/utils";
import type { Role } from "../lib/types";
import { normalizeWhatsApp } from "../lib/whatsapp";
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
  const { user, loginDemo, refresh } = useApp();
  const [show, setShow] = useState(false),
    [creating, setCreating] = useState(false),
    [complete, setComplete] = useState(false);
  const path = location.pathname;
  const returnTo = checkoutReturn();
  const selectedCheckout = checkoutJourney();
  const signup = path === "/inscription",
    forgot = path === "/mot-de-passe-oublie",
    reset = path === "/nouveau-mot-de-passe";
  useEffect(() => {
    const title = signup
      ? "Inscription"
      : forgot
        ? "Mot de passe oublié"
        : reset
          ? "Nouveau mot de passe"
          : "Connexion";
    document.title = `motafawiq.ma — ${title}`;
    return () => {
      document.title = "motafawiq.ma — Apprends. Comprends. Réussis.";
    };
  }, [signup, forgot, reset]);
  useEffect(() => {
    setComplete(false);
  }, [path]);
  if (user && !reset && !creating)
    return (
      <Navigate
        to={
          signup && user.status === "pending"
            ? "/admission"
            : returnTo &&
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
  if (
    signup &&
    (!selectedCheckout ||
      new URLSearchParams(location.search).get("etape") !== "compte")
  )
    return <EnrollmentStart />;
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
      setCreating(true);
      try {
        const r = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: String(fd.get("name")),
              whatsapp_number: normalizeWhatsApp(
                String(fd.get("whatsapp") || ""),
              ),
            },
            emailRedirectTo: `${appURL}/auth/callback${returnTo ? `?retour=${encodeURIComponent(returnTo)}` : ""}`,
          },
        });
        if (r.error) throw Error(r.error.message);
        if (r.data.session) {
          if (selectedCheckout) {
            const result = await supabase.rpc("request_pack_order", {
              p_pack_id: selectedCheckout.pack,
              p_level_id: selectedCheckout.level,
              p_subject_ids: selectedCheckout.subjects,
              p_idempotency_key: selectedCheckout.key || crypto.randomUUID(),
              p_course_id: selectedCheckout.course || null,
              p_exercise_id: selectedCheckout.exercise || null,
            });
            if (result.error) {
              navigate(returnTo!);
              return;
            }
            await refresh();
            localStorage.removeItem("kf-checkout-return");
          }
          navigate("/admission", { replace: true });
          return;
        }
        setComplete(true);
      } finally {
        setCreating(false);
      }
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
          {signup && selectedCheckout && (
            <>
              <EnrollmentSteps step={3} subjectsURL={returnTo!} />
              <EnrollmentRecap journey={selectedCheckout} />
            </>
          )}
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
                    ? "Ton compte est en cours de traitement. Ton choix de pack est conservé. L’administration te contactera sur WhatsApp après validation."
                    : "Ton compte est en cours de traitement. L’administration te contactera sur WhatsApp dès sa validation."
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
                      aria-label={
                        reset ? "Nouveau mot de passe" : "Mot de passe"
                      }
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
              {signup && (
                <Field
                  label="Numéro WhatsApp"
                  hint="L’administration te contactera sur ce numéro après validation de ton compte."
                >
                  <input
                    name="whatsapp"
                    aria-label="Numéro WhatsApp"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    maxLength={25}
                    placeholder="+212 6 12 34 56 78"
                  />
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
                      ? "Ton choix de pack est conservé. Tes droits seront activés après validation du règlement ; l’administration te contactera sur WhatsApp."
                      : "Ton compte restera en cours de traitement jusqu’à la validation de l’administration. Tu recevras un message sur WhatsApp après son activation."}
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
                disabled={creating}
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
              <Link
                to={
                  signup
                    ? "/connexion"
                    : selectedCheckout
                      ? "/inscription?etape=compte"
                      : "/inscription"
                }
              >
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
        <div className="footer-brand">
          <Logo compact />
          <span>motafawiq.ma © 2026</span>
        </div>
        <span>Du collège au lycée, à ton rythme.</span>
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
  const { user, data, loading, logout, refresh, mutate } = useApp();
  const [choices, setChoices] = useState<{ id: string; name: string }[]>([]);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (supabase)
      void supabase.rpc("open_classes").then((r) => setChoices(r.data || []));
  }, []);
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/connexion" replace />;
  if (user.status === "active")
    return <Navigate to={rolePath(user.role)} replace />;
  const admission = data.admission_requests.find(
    (a) => a.student_id === user.id,
  );
  const contact = data.student_contacts.find((c) => c.student_id === user.id);
  const requestedPack = data.pack_orders.some(
    (order) =>
      order.student_id === user.id &&
      ["pending_review", "active"].includes(order.status),
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
              : "Ton compte est en cours de traitement."}
        </h1>
        <p>
          {suspended
            ? "Contacte ton administration pour connaître les prochaines étapes."
            : user.status === "rejected"
              ? admission?.public_message ||
                "L’administration n’a pas donné suite à ta demande."
              : "L’administration examine ton inscription. Tu recevras un message sur ton numéro WhatsApp dès que ton compte sera validé."}
        </p>
        <div className="identity-line">
          <span className="avatar">{user.name.charAt(0)}</span>
          <strong>{user.name}</strong>
        </div>
        {!suspended &&
          user.status === "pending" &&
          (contact ? (
            <p>Numéro WhatsApp : {contact.whatsapp_number}</p>
          ) : (
            <AsyncForm
              onSubmit={async (form) => {
                await mutate("save_student_contact", {
                  p_whatsapp_number: normalizeWhatsApp(
                    String(new FormData(form).get("whatsapp") || ""),
                  ),
                });
                setMsg("Ton numéro WhatsApp a été enregistré.");
              }}
            >
              <Field label="Ton numéro WhatsApp">
                <input
                  name="whatsapp"
                  type="tel"
                  required
                  maxLength={25}
                  placeholder="+212 6 12 34 56 78"
                />
              </Field>
              <Button type="submit">Enregistrer mon numéro WhatsApp</Button>
            </AsyncForm>
          ))}
        {!suspended && user.status === "pending" && (
          <ol className="admission-steps">
            <li>
              <Check size={16} />
              Compte créé
            </li>
            <li>
              {admission || requestedPack ? (
                <Check size={16} />
              ) : (
                <span>2</span>
              )}
              {requestedPack
                ? "Pack et matières sélectionnés"
                : admission
                  ? "Demande envoyée"
                  : "Demande à compléter"}
            </li>
            <li>
              <Clock size={16} />
              Validation de l’administration
            </li>
          </ol>
        )}
        {!admission && !requestedPack && !suspended && (
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
