import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useApp } from "../app/AppProvider";
import { Button, Notice } from "./ui";
import type { Data } from "../lib/types";
/** Bounded API pages. The user explicitly requests subsequent rows. */
export function MoreData() {
  const { hasMore, loadMore } = useApp(),
    { pathname } = useLocation();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const mapping: Record<string, (keyof Data)[]> = {
    admissions: ["admission_requests", "profiles", "account_access"],
    classes: [
      "classes",
      "class_subjects",
      "teaching_spaces",
      "class_enrollments",
      "student_subject_access",
    ],
    etudiants: [
      "profiles",
      "account_access",
      "class_enrollments",
      "student_subject_access",
    ],
    professeurs: ["profiles", "account_access", "teaching_spaces"],
    referentiels: ["subjects", "levels", "academic_years"],
    contenus: ["courses", "exercises", "competitions", "announcements"],
    groupes: [
      "teaching_spaces",
      "class_subjects",
      "classes",
      "class_enrollments",
      "student_subject_access",
    ],
    matieres: ["courses", "teaching_spaces", "class_subjects", "subjects"],
    copies: [
      "submissions",
      "submission_versions",
      "evaluations",
      "submission_files",
      "files",
      "profiles",
    ],
    ["mes-travaux"]: [
      "submissions",
      "submission_versions",
      "evaluations",
      "submission_files",
      "files",
    ],
  };
  const segment = pathname.split("/")[2] || "";
  const candidates = (mapping[segment] || []).filter((k) => hasMore[k]);
  if (!candidates.length) return null;
  return (
    <div className="load-more">
      <div>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              for (const key of candidates) await loadMore(key);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Chargement…" : "Afficher davantage"}
        </Button>
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </div>
  );
}
