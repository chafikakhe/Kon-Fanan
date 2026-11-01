import { Link } from "react-router-dom";
import "@fontsource/archivo-black/latin-400.css";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Atom,
  Calculator,
  Lightbulb,
  Play,
  GraduationCap,
  Menu,
  X,
  Sparkles,
  Video,
} from "lucide-react";
import { Logo, ButtonLink } from "../components/ui";
import { demoEnabled } from "../lib/supabase";
export default function Landing() {
  const [menu, setMenu] = useState(false);
  return (
    <div className="landing">
      <header className="landing-header">
        <Logo />
        <nav className={menu ? "open" : ""}>
          <a href="#matieres" onClick={() => setMenu(false)}>
            Les cours
          </a>
          <a href="#methode" onClick={() => setMenu(false)}>
            La méthode
          </a>
          <a href="#challenges" onClick={() => setMenu(false)}>
            Concours
          </a>
        </nav>
        <div className="landing-header-actions">
          <Link to="/connexion" className="login-link">
            Se connecter <ArrowRight size={14} />
          </Link>
          <ButtonLink to="/inscription">S’inscrire</ButtonLink>
          <button
            className="icon-button mobile-only"
            onClick={() => setMenu(!menu)}
            aria-label={menu ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main>
        <section className="landing-hero">
          <img
            src="/images/hero.webp"
            alt="Étudiants réunis autour de leurs cours"
            fetchPriority="high"
            width="1920"
            height="1280"
          />
          <div className="hero-shade" />
          <div className="hero-content">
            <span className="hero-kicker">
              <span />
              DU COLLÈGE AU LYCÉE, LE DÉCLIC COMMENCE ICI
            </span>
            <h1>
              APPRENDS.
              <br />
              COMPRENDS.
              <br />
              <span>RÉUSSIS.</span>
            </h1>
            <p>
              Des cours qui éclairent. Des profs qui t’accompagnent.
              <br />
              Un avenir qui se construit, à ton rythme.
            </p>
            <ButtonLink to="/decouvrir">
              Commencer <ArrowRight size={18} />
            </ButtonLink>
            <div className="hero-footnote">
              Tes idées vont plus loin que tu ne le penses.
            </div>
          </div>
          <div className="sticker sun-sticker">
            <BookOpen size={42} />
          </div>
          <div className="sticker grad-sticker">
            <GraduationCap size={40} />
            <small>À TOI DE JOUER</small>
          </div>
          <div className="hero-caption">
            APPRENDRE ENSEMBLE. AVANCER VRAIMENT.
          </div>
        </section>
        <section className="intro-section landing-section">
          <div className="intro-copy">
            <span className="editorial-kicker">BIENVENUE CHEZ KON-FANAN</span>
            <h2>
              TON AVENIR
              <br />
              COMMENCE <span className="underline-scribble">ICI.</span>
            </h2>
            <p>
              Une notion qui paraît compliquée peut devenir une évidence. Il
              suffit parfois d’une autre explication, d’un bon exemple, d’un
              professeur à tes côtés.
            </p>
            <p>
              Des cours clairs, des vidéos et des exercices pour transformer tes
              questions en déclics.
            </p>
            <a href="#methode" className="editorial-link">
              Découvrir notre méthode <ArrowRight size={18} />
            </a>
          </div>
          <div className="intro-photo">
            <img
              src="/images/together.webp"
              alt="Un groupe travaille et échange autour d’un ordinateur"
              loading="lazy"
              width="1000"
              height="667"
            />
            <div className="photo-note">
              <Sparkles size={20} />
              Chaque question est un début.
            </div>
          </div>
        </section>
        <section id="matieres" className="subjects-section landing-section">
          <span className="editorial-kicker">
            LA CURIOSITÉ N’A PAS DE LIMITES
          </span>
          <h2>
            UNE MATIÈRE.
            <br className="mobile-only" /> MILLE DÉCOUVERTES.
          </h2>
          <p>De la 1ère année collège à la 3ème année lycée.</p>
          <div className="landing-subjects">
            {[
              [Calculator, "Mathématiques", "mint"],
              [Atom, "Physique-chimie", "yellow"],
              [BookOpen, "Français", "orange"],
              [Lightbulb, "Philosophie", "cream"],
            ].map(([Icon, label, color]) => {
              const I = Icon as typeof Calculator;
              return (
                <Link
                  key={label as string}
                  to="/decouvrir"
                  className="landing-subject"
                >
                  <span className={`subject-blob ${color}`}>
                    <I size={48} strokeWidth={1.4} />
                  </span>
                  <h3>{label as string}</h3>
                  <span>
                    Ouvre le champ des possibles <ArrowRight size={14} />
                  </span>
                </Link>
              );
            })}
          </div>
          <small className="subject-footnote">
            Choisis ton niveau pour découvrir ses matières et ses cours sans
            créer de compte.
          </small>
        </section>
        <section id="methode" className="method-section landing-section">
          <div className="section-top">
            <div>
              <span className="editorial-kicker">
                REGARDER. ESSAYER. PROGRESSER.
              </span>
              <h2>
                LA MÉTHODE
                <br />
                KON-FANAN.
              </h2>
            </div>
            <p>
              Tu n’as pas à tout comprendre du premier coup.
              <br />
              Tu as juste besoin du bon accompagnement.
            </p>
          </div>
          <div className="method-grid">
            {[
              [
                "video",
                "Comprendre en vidéo",
                "Le cours expliqué simplement, à revoir autant que tu en as besoin.",
                "01",
                "mint",
              ],
              [
                "study",
                "S’entraîner à son rythme",
                "Des exercices liés à chaque leçon. Prends le temps de trouver ta voie.",
                "02",
                "yellow",
              ],
              [
                "together",
                "Avancer avec son prof",
                "Envoie ton travail et reçois un retour pour savoir comment progresser.",
                "03",
                "orange",
              ],
            ].map(([img, title, text, n, color]) => (
              <article key={n}>
                <div className={`method-photo ${color}`}>
                  <img
                    src={`/images/${img}.webp`}
                    alt=""
                    loading="lazy"
                    width="600"
                    height="440"
                  />
                  <span>{n}</span>
                  {n === "01" && (
                    <div className="play-decoration">
                      <Play fill="currentColor" size={22} />
                    </div>
                  )}
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="challenges" className="challenge-banner">
          <span className="editorial-kicker">
            UN PEU DE CURIOSITÉ, BEAUCOUP D’ÉLAN
          </span>
          <h2>
            RELÈVE LE DÉFI<span>.</span>
          </h2>
          <p>
            Challenges, concours et séances en direct.
            <br />
            Ce que tu apprends prend une nouvelle dimension.
          </p>
          <ButtonLink to="/decouvrir">
            C’est parti <ArrowRight size={18} />
          </ButtonLink>
          <div className="challenge-collage">
            <img
              src="/images/study.webp"
              alt="Un cahier ouvert pour s’entraîner"
              loading="lazy"
              width="400"
              height="260"
            />
            <div>
              <Video size={28} />
              <strong>
                On se retrouve
                <br />
                en direct.
              </strong>
              <span>Avec ton professeur.</span>
            </div>
            <img
              src="/images/hero.webp"
              alt="Apprendre avec ses camarades"
              loading="lazy"
              width="400"
              height="260"
            />
          </div>
        </section>
        <section className="steps-section landing-section">
          <div>
            <span className="editorial-kicker">ET SI ON COMMENÇAIT ?</span>
            <h2>
              UN PARCOURS
              <br />
              TOUT SIMPLE.
            </h2>
          </div>
          <ol>
            {[
              [
                "Choisis ton niveau",
                "Retrouve les matières de ton niveau scolaire.",
              ],
              [
                "Découvre les cours",
                "Explore les contenus sans créer de compte.",
              ],
              [
                "Pratique avec ton pack",
                "Choisis tes matières pour les exercices et les séances live.",
              ],
            ].map(([t, p], i) => (
              <li key={t}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{p}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className="final-cta">
          <img
            src="/images/books.webp"
            alt="Un espace de travail prêt pour apprendre"
            loading="lazy"
            width="1400"
            height="800"
          />
          <div>
            <span>LE PROCHAIN CHAPITRE, C’EST LE TIEN.</span>
            <h2>
              PRÊT À FAIRE
              <br />
              LE DÉCLIC ?
            </h2>
            <ButtonLink to="/decouvrir">
              Explorer les cours <ArrowRight size={18} />
            </ButtonLink>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <div>
          <Logo />
          <p>Apprendre, comprendre, réussir.</p>
        </div>
        <div>
          <a href="#matieres">Les cours</a>
          <Link to="/connexion">Connexion</Link>
          <Link to="/confidentialite">Confidentialité</Link>
          <Link to="/conditions">Conditions</Link>
          {demoEnabled && <Link to="/connexion#demo">Explorer la démo</Link>}
        </div>
        <span>© 2026 Kon-fanan</span>
      </footer>
    </div>
  );
}
