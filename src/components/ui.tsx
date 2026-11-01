import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
  type ButtonHTMLAttributes,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Search,
  X,
  LoaderCircle,
  Inbox,
  Check,
  AlertCircle,
  BookOpen,
  Sun,
} from "lucide-react";
import { statusLabel } from "../lib/utils";
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="logo" aria-label="Kon-fanan, accueil">
      <span className="logo-mark">
        <Sun size={32} />
        <BookOpen size={30} />
      </span>
      {!compact && (
        <span>
          Kon-fanan<span className="logo-dot">.</span>
        </span>
      )}
    </Link>
  );
}
export function Button({
  variant = "primary",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button className={`button ${variant}`} {...props}>
      {children}
    </button>
  );
}
export function ButtonLink({
  to,
  children,
  variant = "primary",
  className = "",
}: {
  to: string;
  children: ReactNode;
  variant?: string;
  className?: string;
}) {
  return (
    <Link className={`button ${variant} ${className}`} to={to}>
      {children}
    </Link>
  );
}
export function Panel({
  children,
  className = "",
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-heading">
          <h2>{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  back,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  back?: string;
}) {
  return (
    <header className="page-heading">
      {back && (
        <Link className="back-link" to={back}>
          <ArrowLeft size={16} />
          Retour
        </Link>
      )}
      <div className="heading-row">
        <div>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
export function Badge({
  status,
  children,
}: {
  status?: string;
  children?: ReactNode;
}) {
  return (
    <span className={`badge ${status || ""}`}>
      {children || statusLabel[status || ""] || status}
    </span>
  );
}
export function Empty({
  title = "Rien à afficher pour le moment",
  description = "Les éléments disponibles apparaîtront ici.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Inbox size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Notice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <div
      className={`notice ${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {tone === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
      <div>{children}</div>
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" />
      <span>Chargement de votre espace…</span>
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Tabs({
  options,
  value,
  onChange,
}: {
  options: (string | { value: string; label: string })[];
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        return (
          <button
            key={v}
            role="tab"
            aria-selected={v === value}
            className={v === value ? "active" : ""}
            onClick={() => onChange(v)}
          >
            {typeof o === "string" ? o : o.label}
          </button>
        );
      })}
    </div>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = "Rechercher…",
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="search-field">
      <Search size={18} />
      <input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
export function Pagination({
  page,
  total,
  onChange,
  size = 8,
}: {
  page: number;
  total: number;
  onChange: (n: number) => void;
  size?: number;
}) {
  const max = Math.max(1, Math.ceil(total / size));
  return total > size ? (
    <div className="pagination">
      <span>
        {Math.min(total, (page - 1) * size + 1)}–{Math.min(page * size, total)}{" "}
        sur {total}
      </span>
      <Button
        variant="ghost"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Précédent
      </Button>
      <span>
        {page}/{max}
      </span>
      <Button
        variant="ghost"
        disabled={page >= max}
        onClick={() => onChange(page + 1)}
      >
        Suivant
      </Button>
    </div>
  ) : null;
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-inner">
        <div className="panel-heading">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Fermer">
            <X />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export function AsyncForm({
  children,
  onSubmit,
  success,
  className = "",
}: {
  children: ReactNode;
  onSubmit: (form: HTMLFormElement) => Promise<unknown>;
  success?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setDone(false);
    try {
      await onSubmit(e.currentTarget);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d’enregistrer.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className={`form ${className}`}>
      <fieldset disabled={busy}>{children}</fieldset>
      {busy && (
        <p className="muted" role="status">
          <LoaderCircle size={16} className="spin" /> Enregistrement…
        </p>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {done && success && <Notice tone="success">{success}</Notice>}
    </form>
  );
}
export const Arrow = () => <ArrowRight size={17} />;
