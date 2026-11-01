import { useEffect, useState } from "react";
import { demoEnabled, supabase } from "./supabase";
import { seedDemo } from "./demo";
import type { Data, Level, Course } from "./types";
import { errorMessage } from "./utils";
export interface PackOffer {
  id: string;
  name: string;
  subject_count: number;
  total_price: number;
  currency: string;
  is_active: boolean;
}
export interface PackOrder {
  id: string;
  student_id: string;
  pack_id: string;
  pack_name: string;
  subject_count: number;
  total_price: number;
  currency: string;
  level_id: string;
  subject_ids: string[];
  status: "pending_review" | "active" | "rejected" | "revoked";
  idempotency_key: string;
  course_id: string | null;
  exercise_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  payment_reference: string | null;
  created_at: string;
}
export interface CatalogCourse extends Pick<
  Course,
  | "id"
  | "title"
  | "summary"
  | "chapter_label"
  | "body"
  | "content_language"
  | "video_provider"
  | "video_id"
  | "position"
> {
  level_id: string;
  subject_id: string;
  teacher_name: string;
}
export interface Catalog {
  levels: Level[];
  subjects: { id: string; level_id: string; label: string; code: string }[];
  courses: CatalogCourse[];
  exercises: {
    id: string;
    course_id: string;
    title: string;
    difficulty: string;
    position: number;
  }[];
  packs: PackOffer[];
  level_id: string | null;
  subject_id: string | null;
  course_id: string | null;
  exercise_id: string | null;
  has_more: boolean;
  checkout_mode: "administrative_review";
}
export const defaultOffers: PackOffer[] = [1, 2, 3].map((n, i) => ({
  id: `pack-${n}`,
  name: `Pack ${n}`,
  subject_count: n,
  total_price: [100, 180, 270][i],
  currency: "MAD",
  is_active: true,
}));
export interface Journey {
  level?: string;
  subject?: string;
  course?: string;
  exercise?: string;
  pack?: string;
  subjects?: string[];
  key?: string;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function readJourney(search: string): Journey {
  const q = new URLSearchParams(search),
    out: Journey = {};
  for (const k of ["level", "subject", "course", "exercise", "key"] as const) {
    const v = q.get(k);
    if (v && uuid.test(v)) out[k] = v;
  }
  const pack = q.get("pack");
  if (pack && /^pack-[123]$/.test(pack)) out.pack = pack;
  if (q.has("subjects"))
    out.subjects = [
      ...new Set(
        (q.get("subjects") || "").split(",").filter((v) => uuid.test(v)),
      ),
    ].slice(0, 3);
  return out;
}
export function journeyURL(path: string, j: Journey) {
  const q = new URLSearchParams();
  Object.entries(j).forEach(([k, v]) => {
    if (v !== undefined) q.set(k, Array.isArray(v) ? v.join(",") : v);
  });
  return path + (q.size ? `?${q}` : "");
}
export function rememberCheckout(url: string) {
  localStorage.setItem("kf-checkout-return", url);
}
export function checkoutReturn(): string | null {
  const raw = localStorage.getItem("kf-checkout-return");
  if (!raw) return null;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin === window.location.origin && url.pathname === "/packs")
      return url.pathname + url.search;
  } catch {
    /* ignore invalid storage */
  }
  return null;
}
export function demoCatalog(j: Journey, offset = 0): Catalog {
  let d: Data = seedDemo();
  try {
    const raw = sessionStorage.getItem("kf-demo-v1");
    if (raw) d = JSON.parse(raw);
  } catch {
    /* isolated fixtures */
  }
  const subjects = d.class_subjects
    .filter(
      (cs) =>
        cs.is_active &&
        d.classes.some(
          (c) =>
            c.id === cs.class_id &&
            c.status === "active" &&
            d.academic_years.some(
              (y) => y.id === c.academic_year_id && y.status === "active",
            ),
        ),
    )
    .map((cs) => {
      const c = d.classes.find((c) => c.id === cs.class_id)!,
        s = d.subjects.find((s) => s.id === cs.subject_id)!;
      return { ...s, level_id: c.level_id };
    })
    .filter((s) => s.is_active);
  const courses: CatalogCourse[] = d.courses
    .filter((c) => c.status === "published")
    .flatMap((c) => {
      const t = d.teaching_spaces.find(
          (t) => t.id === c.teaching_space_id && t.is_active,
        ),
        cs = d.class_subjects.find(
          (cs) => cs.id === t?.class_subject_id && cs.is_active,
        ),
        cl = d.classes.find(
          (cl) => cl.id === cs?.class_id && cl.status === "active",
        );
      if (
        !t ||
        !cs ||
        !cl ||
        !subjects.some(
          (s) => s.id === cs.subject_id && s.level_id === cl.level_id,
        ) ||
        !d.account_access.some(
          (a) =>
            a.user_id === t.teacher_id &&
            a.role === "teacher" &&
            a.status === "active",
        )
      )
        return [];
      const {
        id,
        title,
        summary,
        chapter_label,
        body,
        content_language,
        video_provider,
        video_id,
        position,
      } = c;
      return [
        {
          id,
          title,
          summary,
          chapter_label,
          body,
          content_language,
          video_provider,
          video_id,
          position,
          level_id: cl.level_id,
          subject_id: cs.subject_id,
          teacher_name:
            d.profiles.find((p) => p.id === t.teacher_id)?.display_name || "",
        },
      ];
    })
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
  const exercise = d.exercises.find(
    (e) => e.id === j.exercise && e.status === "published",
  );
  const course = courses.find(
    (c) => c.id === (j.exercise ? exercise?.course_id : j.course),
  );
  const level = j.course || j.exercise ? course?.level_id : j.level,
    subject = j.course || j.exercise ? course?.subject_id : j.subject;
  const filtered = courses.filter((c) =>
    course
      ? c.id === course.id
      : !j.course &&
        !j.exercise &&
        c.level_id === level &&
        c.subject_id === subject,
  );
  return {
    levels: d.levels.filter((l) => l.is_active),
    subjects: subjects.filter(
      (s, i, all) =>
        s.level_id === level &&
        all.findIndex((x) => x.id === s.id && x.level_id === s.level_id) === i,
    ),
    courses: filtered.slice(offset, offset + 24),
    exercises: course
      ? d.exercises
          .filter((e) => e.course_id === course.id && e.status === "published")
          .map(({ id, course_id, title, difficulty, position }) => ({
            id,
            course_id,
            title,
            difficulty: difficulty || "",
            position,
          }))
      : [],
    packs: d.pack_offers || defaultOffers,
    level_id: level || null,
    subject_id: subject || null,
    course_id: course?.id || null,
    exercise_id: course ? exercise?.id || null : null,
    has_more: filtered.length > offset + 24,
    checkout_mode: "administrative_review",
  };
}
export function useCatalog(j: Journey, offset = 0) {
  const [catalog, setCatalog] = useState<Catalog | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0);
  const key = JSON.stringify([
    j.level,
    j.subject,
    j.course,
    j.exercise,
    offset,
  ]);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    setCatalog(null);
    async function run() {
      if (demoEnabled) return demoCatalog(j, offset);
      if (!supabase)
        throw Error("Le catalogue nécessite la configuration Supabase.");
      const r = await supabase.rpc("discovery_catalog", {
        p_level_id: j.level || null,
        p_subject_id: j.subject || null,
        p_course_id: j.course || null,
        p_exercise_id: j.exercise || null,
        p_offset: offset,
      });
      if (r.error) throw Error(r.error.message);
      return r.data as Catalog;
    }
    void run()
      .then((c) => {
        if (alive) setCatalog(c);
      })
      .catch((e) => {
        if (alive) setError(errorMessage(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [key, retry]);
  return { catalog, loading, error, retry: () => setRetry((n) => n + 1) };
}
