import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import type { Data, Space, Role } from "./types";
export const rolePath = (r: Role) =>
  r === "teacher" ? "/prof" : r === "student" ? "/etudiant" : "/admin";
export const roleLabel = (r: Role) =>
  ({ admin: "Administrateur", teacher: "Professeur", student: "Étudiant" })[r];
export const initials = (s = "") =>
  s
    .split(" ")
    .filter(Boolean)
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
export const date = (s: string | null | undefined, time = false) =>
  s
    ? new Intl.DateTimeFormat("fr-MA", {
        dateStyle: "medium",
        ...(time ? { timeStyle: "short" as const } : {}),
        timeZone: "Africa/Casablanca",
      }).format(new Date(s))
    : "—";
export const clockTime = (s: string) =>
  new Intl.DateTimeFormat("fr-MA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Casablanca",
  }).format(new Date(s));
export const localToISO = (s: string) => {
  const instant = fromZonedTime(s, "Africa/Casablanca");
  if (
    !Number.isFinite(instant.getTime()) ||
    formatInTimeZone(instant, "Africa/Casablanca", "yyyy-MM-dd'T'HH:mm") !==
      s.slice(0, 16)
  )
    throw Error(
      "Cet horaire n’existe pas dans le fuseau Africa/Casablanca. Choisissez un autre horaire.",
    );
  return instant.toISOString();
};
export const spaceInfo = (d: Data, id: string | Space) => {
  const space =
    typeof id === "string" ? d.teaching_spaces.find((x) => x.id === id) : id;
  const cs = d.class_subjects.find((x) => x.id === space?.class_subject_id);
  return {
    space,
    cs,
    subject: d.subjects.find((x) => x.id === cs?.subject_id),
    schoolClass: d.classes.find((x) => x.id === cs?.class_id),
    teacher: d.profiles.find((x) => x.id === space?.teacher_id),
  };
};
export function videoURL(
  input: string,
): { provider: string; id: string } | null {
  try {
    const u = new URL(input);
    if (u.protocol !== "https:") return null;
    const h = u.hostname.replace(/^www\./, "");
    if (h === "youtu.be" && /^[\w-]{11}$/.test(u.pathname.slice(1)))
      return { provider: "youtube", id: u.pathname.slice(1) };
    if (["youtube.com", "m.youtube.com"].includes(h)) {
      const id =
        u.searchParams.get("v") ||
        u.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})$/)?.[1];
      if (id && /^[\w-]{11}$/.test(id)) return { provider: "youtube", id };
    }
    if (h === "vimeo.com" && /^\/\d{6,12}$/.test(u.pathname))
      return { provider: "vimeo", id: u.pathname.slice(1) };
  } catch {
    /* input not yet valid */
  }
  return null;
}
export function validateFiles(files: File[]): string | null {
  if (files.length > 5) return "Tu peux joindre 5 fichiers maximum.";
  if (files.reduce((s, f) => s + f.size, 0) > 30 * 1024 * 1024)
    return "Le total des fichiers doit rester inférieur à 30 Mo.";
  for (const f of files) {
    if (
      !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
        f.type,
      )
    )
      return `${f.name} : choisis une image JPEG, PNG, WebP ou un PDF.`;
    if (f.size > (f.type === "application/pdf" ? 20 : 10) * 1024 * 1024)
      return `${f.name} dépasse la taille autorisée.`;
    if (!f.size) return `${f.name} est vide.`;
  }
  return null;
}
export function errorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (/failed to send a request to the edge function/i.test(raw))
    return "Le service est inaccessible. Vérifie la connexion et l’adresse autorisée de l’application, puis réessaie.";
  const pairs: Record<string, string> = {
    PACK_UNAVAILABLE: "Ce pack n’est plus disponible. Choisis un autre pack.",
    PAYMENT_REFERENCE_REQUIRED:
      "Indiquez la référence du règlement vérifié avant d’activer ce pack.",
    CLASS_FULL: "Cette classe est complète. Choisissez une autre classe.",
    ACCESS_DENIED: "Cet accès a changé. Actualisez votre espace.",
    VERSION_CONFLICT:
      "Cette information a été modifiée. Actualisez avant de réessayer.",
    DEADLINE_PASSED: "La date limite de remise est dépassée.",
    AUTH_REQUIRED: "Reconnectez-vous pour continuer.",
    GOOGLE_RECONNECT_REQUIRED:
      "Reconnectez votre compte Google avant de publier.",
    CONFIGURATION_REQUIRED:
      "Cette intégration doit être configurée par l’administrateur.",
    ALREADY_ENROLLED: "Cet étudiant est déjà inscrit pour cette année.",
    INVALID_FILES: "Les fichiers doivent être validés avant la remise.",
    FILES_NOT_READY:
      "La validation de tous les fichiers doit être terminée avant la remise.",
    FILE_QUOTA_EXCEEDED:
      "Le nombre ou la taille totale des fichiers dépasse la limite autorisée.",
    STATEMENT_LOCKED:
      "Une copie a déjà été remise : l’énoncé, son barème et ses documents sont protégés.",
    RESUBMISSION_NOT_ALLOWED:
      "Une nouvelle version doit être demandée par votre professeur.",
    INVALID_SCORE:
      "La note doit être comprise entre zéro et le barème maximal.",
    COURSE_INCOMPLETE:
      "Ajoutez un titre, du contenu et une vidéo valide avant de publier.",
    EXERCISE_REQUIRED:
      "Ajoutez au moins un exercice au cours avant de publier.",
    FEEDBACK_REQUIRED:
      "Ajoutez un commentaire pédagogique avant de publier la correction.",
    CLASS_UNAVAILABLE:
      "Cette classe n’est plus disponible. Choisissez une autre classe.",
    TEACHER_UNAVAILABLE:
      "Ce professeur n’est pas disponible pour cette affectation.",
    RESOURCE_NOT_FOUND: "Cette ressource n’est pas disponible.",
    INVALID_SUBJECTS:
      "Choisissez les matières actives de la classe sélectionnée.",
    EMAIL_NOT_CONFIRMED: "Confirmez votre adresse email avant de poursuivre.",
    IDEMPOTENCY_CONFLICT:
      "Cette commande a déjà été utilisée avec d’autres informations. Actualisez avant de réessayer.",
    CAPACITY_BELOW_ENROLLMENT:
      "La capacité ne peut pas être inférieure à l’effectif actuel.",
    INVALID_TIMEZONE: "Ce fuseau horaire n’est pas reconnu.",
    COMPETITION_NOT_CLOSED:
      "Attendez la clôture de la compétition avant de publier les résultats.",
    EVALUATIONS_INCOMPLETE:
      "Corrigez et publiez les évaluations de toutes les participations avant les résultats.",
  };
  for (const [key, value] of Object.entries(pairs))
    if (raw.includes(key)) return value;
  if (/fetch|network/i.test(raw))
    return "Connexion interrompue. Vos informations sont conservées : réessayez.";
  return raw.length > 250
    ? "L’action n’a pas abouti. Vérifiez les informations et réessayez."
    : raw;
}
export const statusLabel: Record<string, string> = {
  pending_review: "Règlement à vérifier",
  revoked: "Révoqué",
  active: "Actif",
  pending: "En attente",
  accepted: "Acceptée",
  rejected: "Refusée",
  suspended: "Suspendu",
  archived: "Archivé",
  published: "Publié",
  draft: "Brouillon",
  submitted: "Envoyé",
  reviewed: "Corrigé",
  changes_requested: "À reprendre",
  scheduled: "Planifiée",
  publishing: "Préparation du lien",
  cancelled: "Annulée",
  finished: "Terminée",
  error: "À vérifier",
  closed: "Clôturé",
  ready: "Validé",
  connected: "Connecté",
  disconnected: "Non connecté",
  reconnect_required: "À reconnecter",
  completed: "Terminé",
  started: "En cours",
};
