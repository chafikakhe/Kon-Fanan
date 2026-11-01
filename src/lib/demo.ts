import {
  emptyData,
  type Data,
  type User,
  type Role,
  type Params,
} from "./types";
export const demoID = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
export function seedDemo(): Data {
  const d = emptyData();
  d.pack_offers = [1, 2, 3].map((n, i) => ({
    id: `pack-${n}`,
    name: `Pack ${n}`,
    subject_count: n,
    total_price: [100, 180, 270][i],
    currency: "MAD",
    is_active: true,
  }));
  d.profiles = [
    "Salma El Idrissi",
    "Youssef Amrani",
    "Nadia Berrada",
    "Amine • Administration",
    "Adam Bennani",
    "Lina Alaoui",
    "Yasmine El Fassi",
    "Omar Tazi",
  ].map((display_name, i) => ({
    id: demoID(i + 1),
    display_name,
    preferred_language: "fr",
  }));
  d.profiles.forEach((p, i) => (p.email = `person-${i + 1}@example.test`));
  d.account_access = d.profiles.map((p, i) => ({
    user_id: p.id,
    role: ([1, 2].includes(i)
      ? "teacher"
      : i === 3
        ? "admin"
        : "student") as Role,
    status: [4, 5].includes(i) ? "pending" : "active",
  }));
  d.academic_years = [
    {
      id: demoID(20),
      label: "2026–2027",
      starts_on: "2026-09-01",
      ends_on: "2027-07-31",
      status: "active",
      is_current: true,
    },
  ];
  d.levels = [
    "1ère année collège",
    "2ème année collège",
    "3ème année collège",
    "1ère année lycée",
    "2ème année lycée",
    "3ème année lycée",
  ].map((label, i) => ({
    id: demoID(30 + i),
    code: `N${i + 1}`,
    label,
    cycle: i < 3 ? "college" : "lycee",
    sort_order: i,
    is_active: true,
  }));
  d.subjects = [
    "Mathématiques",
    "Physique-chimie",
    "Français",
    "Philosophie",
  ].map((label, i) => ({
    id: demoID(40 + i),
    label,
    code: ["MAT", "PHY", "FRA", "PHI"][i],
    is_active: true,
  }));
  d.classes = ["3ème collège A", "2ème collège B", "1ère lycée A"].map(
    (name, i) => ({
      id: demoID(50 + i),
      name,
      level_id: demoID(32 - i),
      academic_year_id: demoID(20),
      capacity: i === 2 ? 1 : 30,
      status: "active",
      row_version: 1,
    }),
  );
  d.class_subjects = [
    {
      id: demoID(60),
      class_id: demoID(50),
      subject_id: demoID(40),
      is_active: true,
    },
    {
      id: demoID(61),
      class_id: demoID(50),
      subject_id: demoID(41),
      is_active: true,
    },
    {
      id: demoID(62),
      class_id: demoID(50),
      subject_id: demoID(42),
      is_active: true,
    },
    {
      id: demoID(63),
      class_id: demoID(51),
      subject_id: demoID(40),
      is_active: true,
    },
  ];
  d.teaching_spaces = [
    {
      id: demoID(70),
      class_subject_id: demoID(60),
      teacher_id: demoID(2),
      is_active: true,
    },
    {
      id: demoID(71),
      class_subject_id: demoID(60),
      teacher_id: demoID(3),
      is_active: true,
    },
    {
      id: demoID(72),
      class_subject_id: demoID(63),
      teacher_id: demoID(2),
      is_active: true,
    },
  ];
  d.class_enrollments = [0, 6, 7].map((i, k) => ({
    id: demoID(80 + k),
    student_id: demoID(i + 1),
    class_id: demoID(50),
    academic_year_id: demoID(20),
    status: "active",
    joined_at: "2026-10-01T10:00:00Z",
  }));
  d.student_subject_access = d.class_enrollments.map((e, i) => ({
    id: demoID(90 + i),
    enrollment_id: e.id,
    class_subject_id: demoID(60),
    status: "active",
  }));
  d.admission_requests = [4, 5].map((i, k) => ({
    id: demoID(100 + k),
    student_id: demoID(i + 1),
    requested_class_id: demoID(50),
    status: "pending",
    created_at: `2026-10-${29 + k}T10:00:00Z`,
    public_message: "",
  }));
  d.courses = [
    [
      "Les équations du premier degré",
      "Comprendre les équations, une étape à la fois.",
      "Algèbre",
      70,
    ],
    [
      "Le théorème de Pythagore",
      "Un triangle, trois côtés et une relation essentielle.",
      "Géométrie",
      71,
    ],
    [
      "Fractions et calcul",
      "Retrouve les bons réflexes pour calculer.",
      "Calcul numérique",
      70,
    ],
    [
      "Les fonctions linéaires",
      "Préparation du prochain chapitre.",
      "Fonctions",
      70,
    ],
  ].map((c, i) => ({
    id: demoID(110 + i),
    teaching_space_id: demoID(c[3] as number),
    title: c[0] as string,
    summary: c[1] as string,
    chapter_label: c[2] as string,
    body:
      i === 1
        ? "Dans un triangle rectangle, le carré de la longueur de l’hypoténuse est égal à la somme des carrés des longueurs des deux autres côtés.\n\nSi ABC est rectangle en A : BC² = AB² + AC².\n\nExemple : AB = 3 cm et AC = 4 cm. Alors BC² = 9 + 16 = 25, donc BC = 5 cm."
        : "Une équation est une égalité contenant une inconnue, souvent notée x. La résoudre, c’est trouver la valeur qui rend cette égalité vraie.\n\n1. Regroupe les termes contenant x d’un côté.\n2. Regroupe les nombres de l’autre côté.\n3. Divise pour isoler x, puis vérifie ta réponse.\n\nExemple : 3x + 5 = 20\n3x = 20 − 5\nx = 15 ÷ 3 = 5\n\nVérification : 3 × 5 + 5 = 20. À toi de jouer !",
    content_language: "fr",
    video_provider: "youtube",
    video_id: null,
    position: i,
    status: i === 3 ? "draft" : "published",
    published_at: i === 3 ? null : "2026-10-20T10:00:00Z",
    row_version: 1,
  }));
  // No demonstration video claims: the player explicitly prompts for the teacher's configured video.
  d.courses.forEach((c) => {
    c.video_id = null;
    c.video_provider = null;
  });
  d.exercises = d.courses.slice(0, 3).map((c, i) => ({
    id: demoID(120 + i),
    course_id: c.id,
    title: [
      "Résoudre des équations simples",
      "Appliquer le théorème",
      "Additionner des fractions",
    ][i],
    instructions: [
      "Résous ces équations en détaillant chaque étape :\n\n1. 3x + 5 = 20\n2. 2x − 7 = 9\n3. 5(x + 2) = 35\n\nVérifie chaque solution dans l’équation de départ.",
      "Un triangle ABC est rectangle en A. AB = 6 cm et AC = 8 cm. Calcule BC et justifie chaque étape.",
      "Calcule et simplifie : 1/2 + 1/3 ; 3/4 − 1/6.",
    ][i],
    due_at: "2026-11-06T17:00:00Z",
    allow_late: false,
    max_score: 20,
    status: "published",
    difficulty: "Facile",
    position: 1,
    row_version: 1,
  }));
  d.course_progress = [
    { student_id: demoID(1), course_id: demoID(110), status: "started" },
    { student_id: demoID(1), course_id: demoID(112), status: "completed" },
  ];
  d.submissions = [
    {
      id: demoID(130),
      student_id: demoID(1),
      exercise_id: demoID(121),
      competition_id: null,
      status: "reviewed",
      latest_version_id: demoID(140),
      resubmit_until: null,
      row_version: 1,
    },
    {
      id: demoID(131),
      student_id: demoID(7),
      exercise_id: demoID(120),
      competition_id: null,
      status: "submitted",
      latest_version_id: demoID(141),
      resubmit_until: null,
      row_version: 1,
    },
  ];
  d.submission_versions = d.submissions.map((s, i) => ({
    id: demoID(140 + i),
    submission_id: s.id,
    version_number: 1,
    student_comment:
      "Exemple pédagogique de démonstration. Aucun document personnel.",
    submitted_at: "2026-10-28T14:40:00Z",
    is_late: false,
    max_score_snapshot: 20,
    statement_snapshot: d.exercises[i === 0 ? 1 : 0].instructions,
  }));
  d.evaluations = [
    {
      id: demoID(150),
      submission_version_id: demoID(140),
      reviewer_id: demoID(3),
      feedback:
        "La relation de Pythagore est bien posée. Pense à écrire l’unité à chaque étape et à conclure par une phrase.",
      score: 16,
      max_score: 20,
      status: "published",
      published_at: "2026-10-30T10:00:00Z",
      row_version: 1,
    },
  ];
  d.competitions = [
    {
      id: demoID(160),
      teaching_space_id: demoID(70),
      kind: "challenge",
      title: "Le défi des équations",
      instructions:
        "Un nombre multiplié par 3, puis augmenté de 7, donne 34. Quel est ce nombre ?\n\nPropose une mise en équation et une résolution détaillée. Dépose une photo ou un PDF de ton raisonnement.",
      opens_at: "2026-10-25T08:00:00Z",
      closes_at: "2026-11-10T18:00:00Z",
      max_score: 20,
      status: "published",
      leaderboard_enabled: false,
      results_published_at: null,
      row_version: 1,
    },
  ];
  d.announcements = [
    {
      id: demoID(170),
      teaching_space_id: demoID(70),
      type: "notice",
      title: "Un peu de pratique, chaque jour",
      body: "Reprends les exemples du cours, puis essaie les exercices sans regarder la solution. Pense à détailler ton raisonnement !",
      status: "published",
      published_at: "2026-10-30T09:00:00Z",
      row_version: 1,
    },
    {
      id: demoID(171),
      teaching_space_id: demoID(70),
      type: "live_session",
      title: "Révision des équations",
      body: "Prépare ton cahier et tes questions pour notre séance de révision.",
      status: "draft",
      published_at: null,
      row_version: 1,
    },
  ];
  d.meetings = [
    {
      id: demoID(180),
      announcement_id: demoID(171),
      course_id: demoID(110),
      starts_at: "2026-11-03T16:00:00Z",
      ends_at: "2026-11-03T17:00:00Z",
      timezone: "Africa/Casablanca",
      status: "draft",
      sync_status: "disconnected",
      revision: 1,
      row_version: 1,
      last_error_code: null,
    },
  ];
  d.notifications = [
    {
      id: demoID(190),
      recipient_id: demoID(1),
      type: "correction_published",
      target_type: "submission",
      target_id: demoID(130),
      created_at: "2026-10-30T10:00:00Z",
      read_at: null,
    },
    {
      id: demoID(191),
      recipient_id: demoID(2),
      type: "work_submitted",
      target_type: "submission",
      target_id: demoID(131),
      created_at: "2026-10-28T14:40:00Z",
      read_at: null,
    },
  ];
  return d;
}
export function demoUser(role: Role, d: Data): User {
  const id = demoID(role === "student" ? 1 : role === "teacher" ? 2 : 4);
  const a = d.account_access.find((x) => x.user_id === id)!;
  return {
    id,
    name: d.profiles.find((x) => x.id === id)!.display_name,
    email: `${role}@example.test`,
    role,
    status: a.status,
  };
}
export function scopeDemo(source: Data, user: User): Data {
  const d = structuredClone(source);
  if (user.role === "admin") {
    d.notifications = d.notifications.filter((n) => n.recipient_id === user.id);
    return d;
  }
  const enroll = d.class_enrollments.filter(
    (e) => e.student_id === user.id && e.status === "active",
  );
  const allowed = new Set(
    d.student_subject_access
      .filter(
        (a) =>
          a.status === "active" && enroll.some((e) => e.id === a.enrollment_id),
      )
      .map((a) => a.class_subject_id),
  );
  const spaces = d.teaching_spaces.filter((s) =>
    user.role === "teacher"
      ? s.teacher_id === user.id && s.is_active
      : allowed.has(s.class_subject_id),
  );
  const sids = new Set(spaces.map((s) => s.id));
  if (user.status !== "active") {
    for (const key of Object.keys(d) as (keyof Data)[])
      if (!["profiles", "account_access", "admission_requests"].includes(key))
        (d[key] as unknown[]) = [];
  } else {
    d.teaching_spaces = spaces;
    d.courses = d.courses.filter(
      (c) =>
        sids.has(c.teaching_space_id) &&
        (user.role === "teacher" || c.status === "published"),
    );
    d.exercises = d.exercises.filter(
      (e) =>
        d.courses.some((c) => c.id === e.course_id) &&
        (user.role === "teacher" || e.status === "published"),
    );
    d.competitions = d.competitions.filter(
      (c) =>
        sids.has(c.teaching_space_id) &&
        (user.role === "teacher" || ["published", "closed"].includes(c.status)),
    );
    d.submissions = d.submissions.filter(
      (s) =>
        (user.role === "teacher" || s.student_id === user.id) &&
        (d.exercises.some((e) => e.id === s.exercise_id) ||
          d.competitions.some((c) => c.id === s.competition_id)),
    );
    d.submission_versions = d.submission_versions.filter((v) =>
      d.submissions.some((s) => s.id === v.submission_id),
    );
    d.evaluations = d.evaluations.filter(
      (e) =>
        d.submission_versions.some((v) => v.id === e.submission_version_id) &&
        (user.role === "teacher" ||
          (e.status === "published" &&
            !d.submissions.some(
              (s) =>
                s.competition_id &&
                s.latest_version_id === e.submission_version_id &&
                !d.competitions.find((c) => c.id === s.competition_id)
                  ?.results_published_at,
            ))),
    );
    d.announcements = d.announcements.filter(
      (a) =>
        sids.has(a.teaching_space_id) &&
        (user.role === "teacher" || a.status === "published"),
    );
    d.meetings = d.meetings.filter((m) =>
      d.announcements.some((a) => a.id === m.announcement_id),
    );
    d.class_subjects = d.class_subjects.filter((cs) =>
      spaces.some((s) => s.class_subject_id === cs.id),
    );
    d.classes = d.classes.filter((c) =>
      d.class_subjects.some((cs) => cs.class_id === c.id),
    );
    d.class_enrollments = d.class_enrollments.filter((e) =>
      user.role === "student"
        ? e.student_id === user.id
        : d.student_subject_access.some(
            (a) =>
              a.enrollment_id === e.id &&
              a.status === "active" &&
              d.class_subjects.some((cs) => cs.id === a.class_subject_id),
          ),
    );
    d.student_subject_access = d.student_subject_access.filter(
      (a) =>
        d.class_enrollments.some((e) => e.id === a.enrollment_id) &&
        d.class_subjects.some((cs) => cs.id === a.class_subject_id),
    );
  }
  const profileIDs = new Set([
    user.id,
    ...d.teaching_spaces.map((s) => s.teacher_id),
    ...d.class_enrollments.map((e) => e.student_id),
  ]);
  d.profiles = d.profiles.filter((p) => profileIDs.has(p.id));
  d.profiles = d.profiles.map(({ email, ...profile }) => profile);
  d.account_access = d.account_access.filter((a) => a.user_id === user.id);
  d.pack_orders = (d.pack_orders || []).filter((o) => o.student_id === user.id);
  d.admission_requests = d.admission_requests.filter(
    (a) => a.student_id === user.id,
  );
  d.notifications = d.notifications.filter((n) => n.recipient_id === user.id);
  d.course_progress = d.course_progress.filter((p) => p.student_id === user.id);
  d.submission_files = d.submission_files.filter((f) =>
    d.submission_versions.some((v) => v.id === f.submission_version_id),
  );
  d.files = d.files.filter(
    (f) =>
      d.submission_files.some((sf) => sf.file_id === f.id) ||
      d.course_resources.some((r) => r.file_id === f.id) ||
      (f.target_type === "exercise" &&
        d.exercises.some((e) => e.id === f.target_id)) ||
      (f.target_type === "competition" &&
        d.competitions.some((c) => c.id === f.target_id)) ||
      (f.target_type === "announcement" &&
        d.announcements.some((a) => a.id === f.target_id)),
  );

  return d;
}
export function demoMutate(d: Data, u: User, name: string, p: Params): unknown {
  const v = p as Record<string, any>; // Dynamic RPC argument boundary; domain rows remain typed.
  if (name === "request_pack_order") {
    const offer = d.pack_offers.find(
      (o) => o.id === v.p_pack_id && o.is_active,
    );
    const ids = v.p_subject_ids as string[];
    if (u.role !== "student" || !["pending", "active"].includes(u.status))
      throw Error("ACCESS_DENIED");
    if (
      !offer ||
      ids.length !== offer.subject_count ||
      new Set(ids).size !== ids.length ||
      ids.some(
        (id) =>
          !d.class_subjects.some(
            (cs) =>
              cs.subject_id === id &&
              cs.is_active &&
              d.classes.some(
                (c) =>
                  c.id === cs.class_id &&
                  c.level_id === v.p_level_id &&
                  c.status === "active",
              ),
          ),
      )
    )
      throw Error("INVALID_SUBJECTS");
    d.pack_orders ||= [];
    const existing = d.pack_orders.find(
      (o) => o.student_id === u.id && o.idempotency_key === v.p_idempotency_key,
    );
    if (existing) return existing;
    const order = {
      id: uid(),
      student_id: u.id,
      pack_id: offer.id,
      pack_name: offer.name,
      subject_count: offer.subject_count,
      total_price: offer.total_price,
      currency: "MAD",
      level_id: v.p_level_id,
      subject_ids: ids,
      status: "pending_review" as const,
      idempotency_key: v.p_idempotency_key,
      course_id: v.p_course_id || null,
      exercise_id: v.p_exercise_id || null,
      reviewed_by: null,
      reviewed_at: null,
      payment_reference: null,
      created_at: now(),
    };
    d.pack_orders.push(order);
    return order;
  }
  if (name === "review_pack_order" || name === "set_pack_availability")
    throw Error(
      "La validation des achats nécessite Supabase. Aucun règlement n’est simulé dans la démonstration.",
    );
  const tableMap: Record<string, keyof Data> = {
    save_class: "classes",
    save_course: "courses",
    save_exercise: "exercises",
    save_competition: "competitions",
    save_announcement: "announcements",
    save_meeting: "meetings",
  };
  if (name === "save_meeting" && !v.p_id) {
    const a = {
      id: uid(),
      teaching_space_id: v.p_data.teaching_space_id,
      type: "live_session",
      title: v.p_data.title,
      body: v.p_data.body || "",
      status: "draft",
      published_at: null,
      row_version: 1,
    };
    d.announcements.push(a);
    v.p_data = {
      ...v.p_data,
      announcement_id: a.id,
      revision: 1,
      sync_status: "disconnected",
      course_id: v.p_data.course_id || null,
      last_error_code: null,
    };
  }
  if (name === "save_meeting" && v.p_id) {
    const m = d.meetings.find((m) => m.id === v.p_id);
    const a = d.announcements.find((a) => a.id === m?.announcement_id);
    if (a) {
      a.title = v.p_data.title || a.title;
      a.body = v.p_data.body ?? a.body;
    }
  }
  if (tableMap[name]) {
    const rows = d[tableMap[name]] as unknown as Record<string, any>[];
    let row = rows.find((r) => r.id === v.p_id);
    if (row && v.p_expected_version && row.row_version !== v.p_expected_version)
      throw Error("VERSION_CONFLICT");
    if (!row) {
      row = {
        id: uid(),
        row_version: 1,
        status: "draft",
        created_at: now(),
        position: 0,
        published_at: null,
        ...v.p_data,
      };
      rows.push(row!);
    } else Object.assign(row, v.p_data, { row_version: row.row_version + 1 });
    if (name === "save_class") {
      row!.status = v.p_data.status || "active";
      for (const sid of v.p_data.subject_ids || [])
        if (
          !d.class_subjects.some(
            (x) => x.class_id === row!.id && x.subject_id === sid,
          )
        )
          d.class_subjects.push({
            id: uid(),
            class_id: row!.id,
            subject_id: sid,
            is_active: true,
          });
    }
    return row;
  }
  if (name === "decide_admission") {
    const a = d.admission_requests.find((x) => x.id === v.p_request_id)!;
    if (a.status !== "pending") return a;
    if (v.p_decision === "accepted") {
      const c = d.classes.find((x) => x.id === v.p_class_id)!;
      if (!v.p_subject_ids?.length)
        throw Error("Sélectionnez au moins une matière.");
      if (
        d.class_enrollments.filter(
          (e) => e.class_id === c.id && e.status === "active",
        ).length >= c.capacity
      )
        throw Error("CLASS_FULL");
      const e = {
        id: uid(),
        student_id: a.student_id,
        class_id: c.id,
        academic_year_id: c.academic_year_id,
        status: "active",
        joined_at: now(),
      };
      d.class_enrollments.push(e);
      v.p_subject_ids.forEach((sid: string) =>
        d.student_subject_access.push({
          id: uid(),
          enrollment_id: e.id,
          class_subject_id: sid,
          status: "active",
        }),
      );
    }
    a.status = v.p_decision;
    a.public_message = v.p_message || "";
    a.decided_at = now();
    d.account_access.find((x) => x.user_id === a.student_id)!.status =
      v.p_decision === "accepted" ? "active" : "rejected";
    return a;
  }
  if (name === "set_subject_access") {
    let a = d.student_subject_access.find(
      (a) =>
        a.enrollment_id === v.p_enrollment_id &&
        a.class_subject_id === v.p_class_subject_id,
    );
    if (!a) {
      a = {
        id: uid(),
        enrollment_id: v.p_enrollment_id,
        class_subject_id: v.p_class_subject_id,
        status: "active",
      };
      d.student_subject_access.push(a);
    }
    a.status = v.p_active ? "active" : "revoked";
    return a;
  }
  if (name === "set_account_status") {
    const a = d.account_access.find((a) => a.user_id === v.p_user_id)!;
    a.status = v.p_status;
    return a;
  }
  if (name === "assign_teacher") {
    let s = d.teaching_spaces.find(
      (s) =>
        s.teacher_id === v.p_teacher_id &&
        s.class_subject_id === v.p_class_subject_id,
    );
    if (!s) {
      s = {
        id: uid(),
        teacher_id: v.p_teacher_id,
        class_subject_id: v.p_class_subject_id,
        is_active: true,
      };
      d.teaching_spaces.push(s);
    }
    s.is_active = v.p_active ?? true;
    return s;
  }
  if (name === "save_reference") {
    const key = (
      {
        subjects: "subjects",
        levels: "levels",
        academic_years: "academic_years",
      } as Record<string, keyof Data>
    )[v.p_kind];
    if (!key) {
      if (v.p_kind === "settings") return v.p_data;
      throw Error("Paramètre non disponible dans la démonstration.");
    }
    const rows = d[key] as unknown as Record<string, unknown>[];
    let row = rows.find((x) => x.id === v.p_id);
    if (row) Object.assign(row, v.p_data);
    else {
      row = { id: uid(), is_active: true, ...v.p_data };
      rows.push(row!);
    }
    return row;
  }
  if (
    name.startsWith("publish_") &&
    ["publish_course", "publish_competition", "publish_announcement"].includes(
      name,
    )
  ) {
    const key =
      name === "publish_course"
        ? "courses"
        : name === "publish_competition"
          ? "competitions"
          : "announcements";
    const id = v.p_course_id || v.p_competition_id || v.p_announcement_id;
    const r = (
      d[key] as (
        | Data["courses"][number]
        | Data["competitions"][number]
        | Data["announcements"][number]
      )[]
    ).find((r) => r.id === id)!;
    if (key === "courses") {
      const c = r as Data["courses"][number];
      if (
        !c.title ||
        !c.body ||
        !c.video_id ||
        !d.exercises.some((e) => e.course_id === id)
      )
        throw Error(
          "Ajoutez un titre, du contenu, une vidéo valide et un exercice avant de publier.",
        );
      d.exercises
        .filter((e) => e.course_id === id)
        .forEach((e) => (e.status = "published"));
    }
    r.status = "published";
    r.row_version++;
    return r;
  }
  if (name === "start_submission_version") {
    let s = d.submissions.find(
      (s) =>
        s.student_id === u.id &&
        (v.p_exercise_id
          ? s.exercise_id === v.p_exercise_id
          : s.competition_id === v.p_competition_id),
    );
    if (s && s.status === "draft")
      return d.submission_versions.find((x) => x.id === s!.latest_version_id);
    if (s && !["changes_requested"].includes(s.status))
      throw Error("Ce travail a déjà été envoyé.");
    if (!s) {
      s = {
        id: uid(),
        student_id: u.id,
        exercise_id: v.p_exercise_id || null,
        competition_id: v.p_competition_id || null,
        status: "draft",
        latest_version_id: null,
        resubmit_until: null,
        row_version: 1,
      };
      d.submissions.push(s);
    }
    const version = {
      id: uid(),
      submission_id: s.id,
      version_number:
        d.submission_versions.filter((x) => x.submission_id === s!.id).length +
        1,
      student_comment: "",
      submitted_at: null,
      is_late: false,
      max_score_snapshot: null,
      statement_snapshot: null,
    };
    d.submission_versions.push(version);
    s.latest_version_id = version.id;
    s.status = "draft";
    return version;
  }
  if (name === "save_submission_draft") {
    const ver = d.submission_versions.find((x) => x.id === v.p_version_id)!;
    ver.student_comment = v.p_comment || "";
    return ver;
  }
  if (name === "delete_draft_file") {
    d.course_resources = d.course_resources.filter(
      (r) => r.file_id !== v.p_file_id,
    );
    d.submission_files = d.submission_files.filter(
      (f) => f.file_id !== v.p_file_id,
    );
    d.files = d.files.filter((f) => f.id !== v.p_file_id);
    return true;
  }
  if (name === "submit_work") {
    const ver = d.submission_versions.find((x) => x.id === v.p_version_id)!;
    const s = d.submissions.find((x) => x.id === ver.submission_id)!;
    if (ver.submitted_at) return s;
    if (
      !d.submission_files.some(
        (f) =>
          f.submission_version_id === ver.id &&
          d.files.some((x) => x.id === f.file_id && x.status === "ready"),
      )
    )
      throw Error("Joins au moins un fichier avant d’envoyer.");
    const e = d.exercises.find((e) => e.id === s.exercise_id);
    const c = d.competitions.find((c) => c.id === s.competition_id);
    const deadline = e?.due_at || c?.closes_at;
    if (
      deadline &&
      new Date(deadline).getTime() < Date.now() &&
      !e?.allow_late &&
      !(s.resubmit_until && new Date(s.resubmit_until).getTime() > Date.now())
    )
      throw Error("DEADLINE_PASSED");
    ver.submitted_at = now();
    ver.student_comment = v.p_comment;
    ver.statement_snapshot = e?.instructions || c?.instructions || "";
    ver.max_score_snapshot = Number(e?.max_score || c?.max_score || 20);
    s.status = "submitted";
    const course = e ? d.courses.find((x) => x.id === e.course_id) : null;
    const space = d.teaching_spaces.find(
      (x) => x.id === (course?.teaching_space_id || c?.teaching_space_id),
    );
    if (space)
      d.notifications.push({
        id: uid(),
        recipient_id: space.teacher_id,
        type: "work_submitted",
        target_type: "submission",
        target_id: s.id,
        created_at: now(),
        read_at: null,
      });
    return s;
  }
  if (name === "save_evaluation") {
    let e = d.evaluations.find(
      (e) => e.submission_version_id === v.p_version_id,
    );
    const ver = d.submission_versions.find((x) => x.id === v.p_version_id)!;
    if (
      v.p_score !== null &&
      (v.p_score < 0 || v.p_score > (ver.max_score_snapshot || 20))
    )
      throw Error("La note doit respecter le barème.");
    if (!e) {
      e = {
        id: uid(),
        submission_version_id: ver.id,
        reviewer_id: u.id,
        feedback: "",
        score: null,
        max_score: ver.max_score_snapshot || 20,
        status: "draft",
        published_at: null,
        row_version: 1,
      };
      d.evaluations.push(e);
    }
    Object.assign(e, {
      feedback: v.p_feedback,
      score: v.p_score,
      row_version: e.row_version + 1,
    });
    return e;
  }
  if (name === "publish_evaluation") {
    const e = d.evaluations.find((x) => x.id === v.p_evaluation_id)!;
    if (!e.feedback.trim())
      throw Error("Ajoutez un commentaire de correction.");
    e.status = "published";
    e.published_at = now();
    d.submissions.find(
      (s) => s.latest_version_id === e.submission_version_id,
    )!.status = "reviewed";
    const submission = d.submissions.find(
      (s) => s.latest_version_id === e.submission_version_id,
    )!;
    if (
      !submission.competition_id ||
      d.competitions.find((c) => c.id === submission.competition_id)
        ?.results_published_at
    )
      d.notifications.push({
        id: uid(),
        recipient_id: submission.student_id,
        type: "evaluation_published",
        target_type: "submission",
        target_id: submission.id,
        created_at: now(),
        read_at: null,
      });
    return e;
  }
  if (name === "publish_competition_results") {
    const c = d.competitions.find((c) => c.id === v.p_competition_id)!;
    if (new Date(c.closes_at).getTime() > Date.now())
      throw Error("La compétition doit être clôturée.");
    if (
      d.submissions.some(
        (s) =>
          s.competition_id === c.id &&
          !d.evaluations.some(
            (e) =>
              e.submission_version_id === s.latest_version_id &&
              e.status === "published",
          ),
      )
    )
      throw Error("Corrigez toutes les participations avant de publier.");
    c.results_published_at = now();
    return c;
  }
  if (name === "request_resubmission") {
    const s = d.submissions.find((x) => x.id === v.p_submission_id)!;
    s.status = "changes_requested";
    s.resubmit_until = v.p_until;
    return s;
  }
  if (name === "set_course_progress") {
    let c = d.course_progress.find(
      (x) => x.student_id === u.id && x.course_id === v.p_course_id,
    );
    if (c) c.status = v.p_status;
    else
      d.course_progress.push({
        student_id: u.id,
        course_id: v.p_course_id,
        status: v.p_status,
      });
    return c;
  }
  if (name === "mark_notification_read") {
    d.notifications
      .filter((n) => n.recipient_id === u.id && (!v.p_id || n.id === v.p_id))
      .forEach((n) => (n.read_at = now()));
    return true;
  }
  if (name === "save_profile") {
    const p = d.profiles.find((p) => p.id === u.id)!;
    p.display_name = v.p_display_name;
    p.preferred_language = v.p_language || "fr";
    return p;
  }
  if (name === "archive_content") {
    const key = (
      {
        course: "courses",
        exercise: "exercises",
        competition: "competitions",
        announcement: "announcements",
      } as Record<string, keyof Data>
    )[v.p_kind];
    const r = (d[key] as unknown as { id: string; status: string }[]).find(
      (x) => x.id === v.p_id,
    )!;
    r.status = "archived";
    return r;
  }
  if (name === "get_platform_settings")
    return {
      timezone: "Africa/Casablanca",
      max_files: 5,
      max_total_bytes: 31457280,
      join_minutes_before: 15,
    };
  if (name === "integration_status")
    return {
      connections: d.account_access
        .filter((a) => a.role === "teacher")
        .map((a) => ({ teacher_id: a.user_id, state: "disconnected" })),
      jobs: [],
    };
  if (name === "transfer_student") {
    const old = d.class_enrollments.find((e) => e.id === v.p_enrollment_id)!;
    const c = d.classes.find((c) => c.id === v.p_class_id)!;
    if (!c || c.id === old.class_id)
      throw Error("Choisissez une autre classe.");
    if (
      d.class_enrollments.filter(
        (e) => e.class_id === c.id && e.status === "active",
      ).length >= c.capacity
    )
      throw Error("CLASS_FULL");
    old.status = "ended";
    d.student_subject_access
      .filter((a) => a.enrollment_id === old.id)
      .forEach((a) => (a.status = "revoked"));
    const next = {
      id: uid(),
      student_id: old.student_id,
      class_id: c.id,
      academic_year_id: c.academic_year_id,
      status: "active",
      joined_at: now(),
    };
    d.class_enrollments.push(next);
    for (const sid of v.p_subject_ids)
      d.student_subject_access.push({
        id: uid(),
        enrollment_id: next.id,
        class_subject_id: sid,
        status: "active",
      });
    return next;
  }
  if (name === "transfer_course") {
    const c = d.courses.find((c) => c.id === v.p_course_id)!;
    c.teaching_space_id = v.p_teaching_space_id;
    c.row_version++;
    return c;
  }
  if (name === "competition_leaderboard") return [];
  if (name === "get_audit_events")
    return JSON.parse(sessionStorage.getItem("kf-demo-audit") || "[]").slice(
      v.p_offset || 0,
      (v.p_offset || 0) + (v.p_limit || 100),
    );
  throw Error("Cette action nécessite le backend Supabase configuré.");
}
