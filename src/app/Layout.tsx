import { useEffect, useState, useRef } from "react";
import { NavLink, Outlet, Navigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Users,
  GraduationCap,
  School,
  UserRoundCheck,
  Settings2,
  CalendarDays,
  Trophy,
  Megaphone,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ArrowUpRight,
  PanelsTopLeft,
  ScrollText,
  Plug,
  UserRound,
} from "lucide-react";
import type { Role } from "../lib/types";
import { rolePath, roleLabel, initials } from "../lib/utils";
import { MoreData } from "../components/MoreData";
import { useApp } from "./AppProvider";
import { Logo, Loading, Notice, Button } from "../components/ui";
const navigation = {
  student: [
    ["", "Mon espace", LayoutDashboard],
    ["/matieres", "Mes matières", BookOpen],
    ["/mes-travaux", "Mes travaux", ClipboardList],
    ["/competitions", "Challenges et concours", Trophy],
    ["/annonces", "Annonces", Megaphone],
    ["/seances", "Mes séances", CalendarDays],
  ],
  teacher: [
    ["", "Vue d’ensemble", LayoutDashboard],
    ["/groupes", "Mes groupes", Users],
    ["/cours", "Mes cours", BookOpen],
    ["/copies", "Copies à corriger", ClipboardList],
    ["/competitions", "Challenges et concours", Trophy],
    ["/annonces", "Annonces", Megaphone],
    ["/seances", "Mes séances", CalendarDays],
    ["/integrations/google", "Connexion Google", Plug],
  ],
  admin: [
    ["", "Vue d’ensemble", LayoutDashboard],
    ["/admissions", "Admissions", UserRoundCheck],
    ["/classes", "Classes", School],
    ["/etudiants", "Étudiants", GraduationCap],
    ["/professeurs", "Professeurs", Users],
    ["/referentiels", "Référentiels", Settings2],
    ["/contenus", "Contenus", PanelsTopLeft],
    ["/integrations", "Intégrations", Plug],
    ["/audit", "Journal d’activité", ScrollText],
  ],
} as const;
export function Guard({ role }: { role?: Role }) {
  const { user, loading, error, refresh } = useApp();
  if (loading)
    return (
      <div className="full-state">
        <Loading />
      </div>
    );
  if (error)
    return (
      <div className="full-state">
        <Notice tone="error">{error}</Notice>
        <Button onClick={() => void refresh()}>Réessayer</Button>
      </div>
    );
  if (!user) return <Navigate to="/connexion" replace />;
  if (user.status === "suspended" || user.status === "archived")
    return <Navigate to="/compte-suspendu" replace />;
  if (user.status !== "active") return <Navigate to="/admission" replace />;
  if (role && user.role !== role) return <Navigate to="/403" replace />;
  return <Outlet />;
}
export function Layout() {
  const { user, demo, data, logout, loginDemo, error, refresh } = useApp();
  const [menu, setMenu] = useState(false);
  const [isMobile, setMobile] = useState(
    () => window.matchMedia("(max-width:760px)").matches,
  );
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(max-width:760px)");
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!menu || !isMobile) return;
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebar.current?.querySelector<HTMLElement>("button")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
      if (e.key === "Tab") {
        const items = Array.from(
          sidebar.current?.querySelectorAll<HTMLElement>(
            "a[href],button:not([disabled]),select",
          ) || [],
        ).filter((el) => el.offsetParent !== null);
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [menu, isMobile]);
  const location = useLocation();
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
    document.title = `Kon-fanan — ${roleLabel(user!.role)}`;
  }, [location.pathname]);
  useEffect(() => {
    const m = document.createElement("meta");
    m.name = "robots";
    m.content = "noindex,nofollow";
    document.head.appendChild(m);
    return () => m.remove();
  }, []);
  if (!user) return <Navigate to="/connexion" replace />;
  const base = rolePath(user.role),
    nav = navigation[user.role],
    active =
      nav.find(([path]) => path && location.pathname.startsWith(base + path)) ||
      nav[0];
  const unread = data.notifications.filter((n) => !n.read_at).length;
  const mobile = nav.filter(([path]) =>
    user.role === "student"
      ? ["", "/matieres", "/mes-travaux", "/seances"].includes(path)
      : user.role === "teacher"
        ? ["", "/cours", "/copies", "/seances"].includes(path)
        : ["", "/admissions", "/classes", "/etudiants"].includes(path),
  );
  return (
    <div className={`app-layout role-${user.role}`}>
      <a href="#main-content" className="skip-link">
        Aller au contenu
      </a>
      {menu && (
        <button
          className="nav-backdrop"
          aria-label="Fermer le menu"
          onClick={() => setMenu(false)}
        />
      )}
      <aside
        ref={sidebar}
        inert={isMobile && !menu}
        className={`sidebar glass ${menu ? "is-open" : ""}`}
      >
        <div className="sidebar-brand">
          <Logo />
          <button
            className="icon-button mobile-only"
            onClick={() => setMenu(false)}
            aria-label="Fermer le menu"
          >
            <X />
          </button>
        </div>
        <div className="role-tag">
          <span className="tiny-dot" />
          {roleLabel(user.role)}
        </div>
        <div className="nav-section-label">MON ESPACE</div>
        <nav aria-label="Navigation principale">
          {nav.map(([path, label, Icon]) => (
            <NavLink
              key={path}
              to={base + path}
              end={!path}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{label}</span>
              {path === "/admissions" &&
                data.admission_requests.some((a) => a.status === "pending") && (
                  <span className="nav-count">
                    {
                      data.admission_requests.filter(
                        (a) => a.status === "pending",
                      ).length
                    }
                  </span>
                )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <BookOpen size={22} />
            <strong>
              Un peu chaque jour.
              <br />
              Beaucoup pour demain.
            </strong>
            <p>
              Apprends à ton rythme,
              <br />
              avec tes professeurs.
            </p>
          </div>
          <NavLink className="nav-link" to="/notifications">
            <Bell size={18} />
            Notifications
            {unread > 0 && <span className="nav-count">{unread}</span>}
          </NavLink>
          <NavLink className="nav-link" to="/profil">
            <UserRound size={18} />
            Mon profil
          </NavLink>
          <button className="nav-link logout" onClick={() => void logout()}>
            <LogOut size={18} />
            Se déconnecter
          </button>
          <div className="sidebar-user">
            <span className="avatar">{initials(user.name)}</span>
            <div>
              <strong>{user.name}</strong>
              <small>{roleLabel(user.role)}</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar glass">
          <div className="topbar-context">
            <button
              className="icon-button mobile-only"
              onClick={() => setMenu(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu />
            </button>
            <span className="desktop-only">
              Espace {roleLabel(user.role).toLowerCase()}
              <span className="breadcrumb-slash">/</span>
            </span>
            <span>{active[1]}</span>
          </div>
          <div className="topbar-actions">
            {demo ? (
              <label className="demo-selector">
                <span className="tiny-dot" />
                <span className="desktop-only">Démonstration</span>
                <span className="mobile-only">Démo</span>
                <select
                  aria-label="Espace de démonstration"
                  value={user.role}
                  onChange={(e) => {
                    const r = e.target.value as Role;
                    loginDemo(r);
                    window.location.assign(rolePath(r));
                  }}
                >
                  <option value="student">Étudiant</option>
                  <option value="teacher">Professeur</option>
                  <option value="admin">Admin</option>
                </select>
                <ChevronDown size={13} />
              </label>
            ) : (
              <span className="school-year desktop-only">
                {data.academic_years.find((y) => y.is_current)?.label ||
                  "Année scolaire"}
              </span>
            )}
            <Link
              className="icon-button notification-bell"
              to="/notifications"
              aria-label={`Notifications, ${unread} non lues`}
            >
              <Bell size={20} />
              {unread > 0 && <i />}
            </Link>
            <Link className="avatar small" to="/profil" aria-label="Mon profil">
              {initials(user.name)}
            </Link>
          </div>
        </header>
        <main id="main-content" className="main-content">
          {error ? (
            <Notice tone="error">
              {error}
              <Button variant="secondary" onClick={() => void refresh()}>
                Réessayer
              </Button>
            </Notice>
          ) : (
            <>
              <Outlet />
              <MoreData />
            </>
          )}
        </main>
        <footer className="workspace-footer">
          <span>Kon-fanan. Apprendre ouvre des portes.</span>
          <Link to="/">
            Découvrir Kon-fanan <ArrowUpRight size={12} />
          </Link>
        </footer>
      </div>
      <nav className="mobile-nav glass" aria-label="Navigation mobile">
        {mobile.map(([p, l, Icon]) => (
          <NavLink to={base + p} end={!p} key={p}>
            <Icon size={20} />
            <span>
              {p === ""
                ? "Accueil"
                : l.replace("Mes ", "").replace(" à corriger", "")}
            </span>
          </NavLink>
        ))}
        <button onClick={() => setMenu(true)} aria-expanded={menu}>
          <Menu size={20} />
          <span>Plus</span>
        </button>
      </nav>
    </div>
  );
}
