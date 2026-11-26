import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Logo } from "./ui";
import { useCatalog, type Journey } from "../lib/packs";

export function EnrollmentStart() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  function start() {
    localStorage.removeItem("kf-checkout-return");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      navigate("/packs");
      return;
    }
    setLeaving(true);
    timer.current = setTimeout(() => navigate("/packs"), 220);
  }
  return (
    <div className="auth-page enrollment-welcome">
      <div className="auth-brand">
        <Logo />
        <Link to="/" className="back-link">
          Retour à l’accueil
        </Link>
      </div>
      <main className={`enrollment-intro ${leaving ? "is-leaving" : ""}`}>
        <span className="eyebrow">TON PARCOURS COMMENCE ICI</span>
        <h1>
          Un pack. Tes matières.
          <br />
          <span>Ton compte.</span>
        </h1>
        <p>
          Choisis le pack qui te convient, sélectionne tes matières, puis crée
          ton compte.
        </p>
        <ol className="enrollment-intro-steps">
          <li>
            <Check size={18} aria-hidden="true" />
            Choisis ton pack
          </li>
          <li>
            <Check size={18} aria-hidden="true" />
            Sélectionne tes matières
          </li>
          <li>
            <Check size={18} aria-hidden="true" />
            Renseigne tes informations
          </li>
        </ol>
        <button
          type="button"
          className="button primary enrollment-start"
          onClick={start}
          disabled={leaving}
        >
          Sign in <ArrowRight size={26} aria-hidden="true" />
        </button>
        <p className="enrollment-login">
          Tu as déjà un compte ? <Link to="/connexion">Se connecter</Link>
        </p>
      </main>
    </div>
  );
}

export function EnrollmentSteps({
  step,
  subjectsURL = "/packs",
}: {
  step: 1 | 2 | 3;
  subjectsURL?: string;
}) {
  return (
    <nav className="enrollment-progress" aria-label="Étapes d’inscription">
      <ol>
        {["Pack", "Matières", "Compte"].map((label, index) => (
          <li
            key={label}
            className={index + 1 <= step ? "current" : ""}
            aria-current={step === index + 1 ? "step" : undefined}
          >
            {index + 1 < step ? (
              <Link to={index === 0 ? "/packs" : subjectsURL}>
                <span>{index + 1}</span>
                {label}
              </Link>
            ) : (
              <span className="enrollment-step-label">
                <span>{index + 1}</span>
                {label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function EnrollmentRecap({ journey }: { journey: Journey }) {
  const { catalog } = useCatalog(journey);
  const offer = catalog?.packs.find((p) => p.id === journey.pack);
  const level = catalog?.levels.find((l) => l.id === journey.level);
  return (
    <div
      className="enrollment-recap"
      aria-label="Ton choix de pack et de matières"
    >
      <strong>
        {offer?.name || "Ton pack"}
        {offer ? ` · ${Number(offer.total_price)} DH au total` : ""}
      </strong>
      {level && <span>{level.label}</span>}
      <span>
        {journey.subjects
          ?.map((id) => catalog?.subjects.find((s) => s.id === id)?.label)
          .filter(Boolean)
          .join(" · ") ||
          `${journey.subjects?.length || 0} matière(s) sélectionnée(s)`}
      </span>
    </div>
  );
}
