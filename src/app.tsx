import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./app/AppProvider";
import { Guard, Layout } from "./app/Layout";
import { Loading } from "./components/ui";
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const named = <T extends Record<string, unknown>>(
  loader: () => Promise<T>,
  name: keyof T,
) =>
  lazy(() =>
    loader().then((m) => ({ default: m[name] as React.ComponentType })),
  );
const auth = () => import("./pages/Auth"),
  learning = () => import("./pages/Learning"),
  work = () => import("./pages/Work"),
  community = () => import("./pages/Community"),
  personal = () => import("./pages/Personal"),
  admin = () => import("./pages/Admin");
const AuthCallback = named(auth, "AuthCallback"),
  AccountState = named(auth, "AccountState");
const StudentDashboard = named(learning, "StudentDashboard"),
  TeacherDashboard = named(learning, "TeacherDashboard"),
  Subjects = named(learning, "Subjects"),
  Courses = named(learning, "Courses"),
  Groups = named(learning, "Groups"),
  CourseReader = named(learning, "CourseReader"),
  CourseEditor = named(learning, "CourseEditor"),
  ExerciseEditor = named(learning, "ExerciseEditor"),
  Unavailable = named(learning, "Unavailable");
const WorkList = named(work, "WorkList"),
  SubmissionDetail = named(work, "SubmissionDetail"),
  ExerciseSubmission = named(work, "ExerciseSubmission");
const Competitions = named(community, "Competitions"),
  CompetitionEditor = named(community, "CompetitionEditor"),
  CompetitionDetail = named(community, "CompetitionDetail"),
  Announcements = named(community, "Announcements"),
  AnnouncementEditor = named(community, "AnnouncementEditor"),
  Sessions = named(community, "Sessions"),
  SessionEditor = named(community, "SessionEditor"),
  SessionDetail = named(community, "SessionDetail"),
  GoogleIntegration = named(community, "GoogleIntegration");
const Notifications = named(personal, "Notifications"),
  Profile = named(personal, "Profile"),
  Legal = named(personal, "Legal");
const AdminDashboard = named(admin, "AdminDashboard"),
  Admissions = named(admin, "Admissions"),
  AdmissionDetail = named(admin, "AdmissionDetail"),
  Classes = named(admin, "Classes"),
  ClassEditor = named(admin, "ClassEditor"),
  ClassDetail = named(admin, "ClassDetail"),
  Students = named(admin, "Students"),
  StudentDetail = named(admin, "StudentDetail"),
  Teachers = named(admin, "Teachers"),
  TeacherDetail = named(admin, "TeacherDetail"),
  References = named(admin, "References"),
  ContentManagement = named(admin, "ContentManagement"),
  Integrations = named(admin, "Integrations"),
  AuditLog = named(admin, "AuditLog");
export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="full-state">
              <Loading />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Landing />} />
            {[
              "connexion",
              "inscription",
              "mot-de-passe-oublie",
              "nouveau-mot-de-passe",
            ].map((p) => (
              <Route key={p} path={`/${p}`} element={<Auth />} />
            ))}
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/admission" element={<AccountState />} />
            <Route path="/compte-suspendu" element={<Suspended />} />
            <Route path="/confidentialite" element={<Legal />} />
            <Route path="/conditions" element={<Legal />} />
            <Route element={<Guard />}>
              <Route element={<Layout />}>
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profil" element={<Profile />} />
                <Route path="/403" element={<Unavailable />} />
                <Route element={<Guard role="student" />}>
                  <Route path="/etudiant" element={<StudentDashboard />} />
                  <Route path="/etudiant/matieres" element={<Subjects />} />
                  <Route path="/etudiant/matieres/:id" element={<Courses />} />
                  <Route
                    path="/etudiant/cours/:id"
                    element={<CourseReader />}
                  />
                  <Route
                    path="/etudiant/exercices/:id"
                    element={<ExerciseSubmission />}
                  />
                  <Route path="/etudiant/mes-travaux" element={<WorkList />} />
                  <Route
                    path="/etudiant/mes-travaux/:id"
                    element={<SubmissionDetail />}
                  />
                  <Route
                    path="/etudiant/competitions"
                    element={<Competitions />}
                  />
                  <Route
                    path="/etudiant/competitions/:id"
                    element={<CompetitionDetail />}
                  />
                  <Route
                    path="/etudiant/competitions/:id/resultats"
                    element={<CompetitionDetail />}
                  />
                  <Route
                    path="/etudiant/annonces"
                    element={<Announcements />}
                  />
                  <Route path="/etudiant/seances" element={<Sessions />} />
                  <Route
                    path="/etudiant/seances/:id"
                    element={<SessionDetail />}
                  />
                </Route>
                <Route element={<Guard role="teacher" />}>
                  <Route path="/prof" element={<TeacherDashboard />} />
                  <Route path="/prof/groupes" element={<Groups />} />
                  <Route path="/prof/groupes/:id" element={<Groups />} />
                  <Route path="/prof/cours" element={<Courses />} />
                  <Route
                    path="/prof/cours/nouveau"
                    element={<CourseEditor />}
                  />
                  <Route path="/prof/cours/:id" element={<CourseEditor />} />
                  <Route
                    path="/prof/cours/:courseId/exercices/:exerciseId"
                    element={<ExerciseEditor />}
                  />
                  <Route path="/prof/copies" element={<WorkList />} />
                  <Route
                    path="/prof/copies/:id"
                    element={<SubmissionDetail />}
                  />
                  <Route path="/prof/competitions" element={<Competitions />} />
                  <Route
                    path="/prof/competitions/nouvelle"
                    element={<CompetitionEditor />}
                  />
                  <Route
                    path="/prof/competitions/:id"
                    element={<CompetitionDetail />}
                  />
                  <Route
                    path="/prof/competitions/:id/modifier"
                    element={<CompetitionEditor />}
                  />
                  <Route
                    path="/prof/competitions/:id/participations"
                    element={<CompetitionDetail />}
                  />
                  <Route path="/prof/annonces" element={<Announcements />} />
                  <Route
                    path="/prof/annonces/nouvelle"
                    element={<AnnouncementEditor />}
                  />
                  <Route
                    path="/prof/annonces/:id/modifier"
                    element={<AnnouncementEditor />}
                  />
                  <Route path="/prof/seances" element={<Sessions />} />
                  <Route
                    path="/prof/seances/nouvelle"
                    element={<SessionEditor />}
                  />
                  <Route path="/prof/seances/:id" element={<SessionDetail />} />
                  <Route
                    path="/prof/seances/:id/modifier"
                    element={<SessionEditor />}
                  />
                  <Route
                    path="/prof/integrations/google"
                    element={<GoogleIntegration />}
                  />
                </Route>
                <Route element={<Guard role="admin" />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/admissions" element={<Admissions />} />
                  <Route
                    path="/admin/admissions/:id"
                    element={<AdmissionDetail />}
                  />
                  <Route path="/admin/classes" element={<Classes />} />
                  <Route
                    path="/admin/classes/nouvelle"
                    element={<ClassEditor />}
                  />
                  <Route path="/admin/classes/:id" element={<ClassDetail />} />
                  <Route
                    path="/admin/classes/:id/modifier"
                    element={<ClassEditor />}
                  />
                  <Route path="/admin/etudiants" element={<Students />} />
                  <Route
                    path="/admin/etudiants/:id"
                    element={<StudentDetail />}
                  />
                  <Route path="/admin/professeurs" element={<Teachers />} />
                  <Route
                    path="/admin/professeurs/:id"
                    element={<TeacherDetail />}
                  />
                  <Route path="/admin/referentiels" element={<References />} />
                  <Route
                    path="/admin/contenus"
                    element={<ContentManagement />}
                  />
                  <Route
                    path="/admin/integrations"
                    element={<Integrations />}
                  />
                  <Route path="/admin/audit" element={<AuditLog />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
            <Route path="*" element={<PublicNotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  );
}
const Suspended = lazy(() =>
  import("./pages/Auth").then((m) => ({
    default: () => <m.AccountState suspended />,
  })),
);
const NotFound = lazy(() =>
  import("./pages/Learning").then((m) => ({
    default: () => <m.Unavailable notFound />,
  })),
);
function PublicNotFound() {
  return (
    <div className="full-state">
      <NotFound />
    </div>
  );
}
