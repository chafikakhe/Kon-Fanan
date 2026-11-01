export type Role = "admin" | "teacher" | "student";
export type AccountStatus =
  "pending" | "active" | "rejected" | "suspended" | "archived";
export interface Profile {
  email?: string;
  id: string;
  display_name: string;
  preferred_language: string;
}
export interface Account {
  user_id: string;
  role: Role;
  status: AccountStatus;
}
export interface Year {
  id: string;
  label: string;
  starts_on: string;
  ends_on: string;
  is_current: boolean;
  status: string;
}
export interface Level {
  id: string;
  code: string;
  label: string;
  cycle: string;
  sort_order: number;
  is_active: boolean;
}
export interface Subject {
  id: string;
  code: string;
  label: string;
  is_active: boolean;
}
export interface SchoolClass {
  enrolled_count?: number;
  id: string;
  academic_year_id: string;
  level_id: string;
  name: string;
  capacity: number;
  status: string;
  row_version: number;
}
export interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  is_active: boolean;
}
export interface Space {
  id: string;
  class_subject_id: string;
  teacher_id: string;
  is_active: boolean;
}
export interface Admission {
  id: string;
  student_id: string;
  requested_class_id: string;
  status: string;
  created_at: string;
  public_message: string;
  decided_at?: string;
}
export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  academic_year_id: string;
  status: string;
  joined_at: string;
}
export interface SubjectAccess {
  id: string;
  enrollment_id: string;
  class_subject_id: string;
  status: string;
}
export interface Course {
  id: string;
  teaching_space_id: string;
  title: string;
  summary: string;
  chapter_label: string;
  body: string;
  content_language: string;
  video_provider: string | null;
  video_id: string | null;
  position: number;
  status: string;
  published_at: string | null;
  row_version: number;
}
export interface Exercise {
  id: string;
  course_id: string;
  title: string;
  instructions: string;
  due_at: string | null;
  allow_late: boolean;
  max_score: number;
  status: string;
  difficulty: string | null;
  position: number;
  row_version: number;
}
export interface Competition {
  id: string;
  teaching_space_id: string;
  kind: string;
  title: string;
  instructions: string;
  opens_at: string;
  closes_at: string;
  max_score: number;
  status: string;
  leaderboard_enabled: boolean;
  results_published_at: string | null;
  row_version: number;
}
export interface Submission {
  id: string;
  student_id: string;
  exercise_id: string | null;
  competition_id: string | null;
  status: string;
  latest_version_id: string | null;
  resubmit_until: string | null;
  row_version: number;
}
export interface SubmissionVersion {
  id: string;
  submission_id: string;
  version_number: number;
  student_comment: string;
  submitted_at: string | null;
  is_late: boolean;
  max_score_snapshot: number | null;
  statement_snapshot: string | null;
}
export interface Evaluation {
  id: string;
  submission_version_id: string;
  reviewer_id: string;
  feedback: string;
  score: number | null;
  max_score: number;
  status: string;
  published_at: string | null;
  row_version: number;
}
export interface Announcement {
  id: string;
  teaching_space_id: string;
  type: string;
  title: string;
  body: string;
  status: string;
  published_at: string | null;
  row_version: number;
}
export interface Meeting {
  id: string;
  announcement_id: string;
  course_id: string | null;
  starts_at: string;
  ends_at: string;
  timezone: string;
  status: string;
  sync_status: string;
  revision: number;
  row_version: number;
  last_error_code: string | null;
}
export interface Notification {
  id: string;
  recipient_id: string;
  type: string;
  target_type: string;
  target_id: string;
  created_at: string;
  read_at: string | null;
}
export interface Progress {
  student_id: string;
  course_id: string;
  status: string;
}
export interface FileRow {
  target_type?: string;
  target_id?: string;
  id: string;
  owner_id: string;
  bucket: string;
  object_path: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  status: string;
}
export interface SubmissionFile {
  id: string;
  submission_version_id: string;
  file_id: string;
  position: number;
}
export interface Resource {
  id: string;
  course_id: string;
  file_id: string;
  label: string;
  position: number;
}
export interface Audit {
  id: string;
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  created_at: string;
  details?: unknown;
}
export interface Data {
  profiles: Profile[];
  account_access: Account[];
  academic_years: Year[];
  levels: Level[];
  subjects: Subject[];
  classes: SchoolClass[];
  class_subjects: ClassSubject[];
  teaching_spaces: Space[];
  admission_requests: Admission[];
  class_enrollments: Enrollment[];
  student_subject_access: SubjectAccess[];
  courses: Course[];
  exercises: Exercise[];
  competitions: Competition[];
  submissions: Submission[];
  submission_versions: SubmissionVersion[];
  evaluations: Evaluation[];
  announcements: Announcement[];
  meetings: Meeting[];
  notifications: Notification[];
  course_progress: Progress[];
  files: FileRow[];
  submission_files: SubmissionFile[];
  course_resources: Resource[];
}
export const tables: (keyof Data)[] = [
  "profiles",
  "account_access",
  "academic_years",
  "levels",
  "subjects",
  "classes",
  "class_subjects",
  "teaching_spaces",
  "admission_requests",
  "class_enrollments",
  "student_subject_access",
  "courses",
  "exercises",
  "competitions",
  "submissions",
  "submission_versions",
  "evaluations",
  "announcements",
  "meetings",
  "notifications",
  "course_progress",
  "files",
  "submission_files",
  "course_resources",
];
export const emptyData = (): Data =>
  Object.fromEntries(tables.map((t) => [t, []])) as unknown as Data;
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: AccountStatus;
}
export type Params = Record<string, unknown>;
