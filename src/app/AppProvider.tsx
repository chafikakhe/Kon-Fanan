import { useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  emptyData,
  tables,
  type Data,
  type User,
  type Role,
  type Params,
} from "../lib/types";
import {
  demoEnabled,
  supabase,
  putDemoFile,
  getDemoFile,
  deleteDemoFile,
} from "../lib/supabase";
import { seedDemo, demoUser, scopeDemo, demoMutate } from "../lib/demo";
import { errorMessage } from "../lib/utils";
import { Context } from "./context";
export function useApp() {
  const c = useContext(Context);
  if (!c) throw Error("AppProvider missing");
  return c;
}
function readDemo(): Data {
  try {
    const s = sessionStorage.getItem("kf-demo-v1");
    return s ? JSON.parse(s) : seedDemo();
  } catch {
    return seedDemo();
  }
}
export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(emptyData),
    [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [hasMore, setHasMore] = useState<Partial<Record<keyof Data, boolean>>>({});
  const [stats, setStats] = useState<Record<string, any>>({});
  const demo = demoEnabled;
  const source = useRef<Data>(demo ? readDemo() : emptyData());
  const userRef = useRef<User | null>(null);
  const generation = useRef(0);
  const busy = useRef(false);
  const reservations = useRef(
    new WeakMap<
      File,
      { id: string; bucket: string; object_path: string; uploaded: boolean }
    >(),
  );
  function notify(s: string) {
    setToast(s);
  }
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  function storeDemo(d: Data) {
    source.current = d;
    sessionStorage.setItem("kf-demo-v1", JSON.stringify(d));
    if (userRef.current) {
      const a = d.account_access.find((a) => a.user_id === userRef.current!.id),
        p = d.profiles.find((p) => p.id === userRef.current!.id);
      const u = {
        ...userRef.current,
        status: a?.status || userRef.current.status,
        name: p?.display_name || userRef.current.name,
      };
      userRef.current = u;
      setUser(u);
      setData(scopeDemo(d, u));
      setStats({
        students: d.account_access.filter(
          (a) => a.role === "student" && a.status === "active",
        ).length,
        teachers: d.account_access.filter(
          (a) => a.role === "teacher" && a.status === "active",
        ).length,
        classes: d.classes.filter((c) => c.status === "active").length,
        admissions: d.admission_requests.filter((a) => a.status === "pending")
          .length,
        courses: d.courses.filter((c) => c.status === "published").length,
        spaces: d.teaching_spaces.filter(
          (s) => s.teacher_id === u.id && s.is_active,
        ).length,
        copies: d.submissions.filter((s) => s.status === "submitted").length,
        class_enrollments: Object.fromEntries(
          d.classes.map((c) => [
            c.id,
            d.class_enrollments.filter(
              (e) => e.class_id === c.id && e.status === "active",
            ).length,
          ]),
        ),
      });
    }
  }
  async function load(session: Session | null) {
    const gen = ++generation.current;
    if (!supabase) return;
    if (!session) {
      userRef.current = null;
      setUser(null);
      setData(emptyData());
      setLoading(false);
      setError("");
      return;
    }
    if (userRef.current?.id !== session.user.id) {
      userRef.current = null;
      setUser(null);
      setData(emptyData());
      setStats({});
      reservations.current = new WeakMap();
      setLoading(true);
    }
    setError("");
    try {
      const [a, p] = await Promise.all([
        supabase
          .from("account_access")
          .select("user_id,role,status")
          .eq("user_id", session.user.id)
          .single(),
        supabase
          .from("profiles")
          .select("id,display_name,preferred_language")
          .eq("id", session.user.id)
          .single(),
      ]);
      if (a.error || p.error)
        throw Error("Impossible de charger votre compte. Réessayez.");
      const u: User = {
        id: session.user.id,
        email: session.user.email || "",
        name: p.data.display_name,
        role: a.data.role,
        status: a.data.status,
      };
      const entries = await Promise.all(
        tables.map(async (table) => {
          const query = supabase!
            .from(table)
            .select("*")
            .order(
              table === "account_access"
                ? "user_id"
                : table === "course_progress"
                  ? "course_id"
                  : "id",
              { ascending: true },
            )
            .range(0, 99);
          const r = await query;
          if (r.error)
            throw Error(
              "Impossible de charger votre espace. Vérifiez votre connexion puis réessayez.",
            );
          return [table, r.data || []] as const;
        }),
      );
      if (gen !== generation.current) return;
      const counts = await supabase.rpc("dashboard_counts");
      if (counts.error) throw Error("Impossible de charger les indicateurs.");
      if (gen !== generation.current) return;
      setStats(counts.data || {});
      const d = Object.fromEntries(entries) as unknown as Data;
      if (u.role === "admin") {
        const directory = await supabase.rpc("admin_directory", {
          p_limit: 100,
          p_offset: 0,
        });
        if (directory.error)
          throw Error("Impossible de charger l’annuaire administratif.");
        d.profiles = d.profiles.map((p) => ({
          ...p,
          email: directory.data.find(
            (r: { id: string; email: string }) => r.id === p.id,
          )?.email,
        }));
      }
      d.classes = d.classes.map((c) => ({
        ...c,
        enrolled_count: Number(counts.data?.class_enrollments?.[c.id] || 0),
      }));
      if (gen !== generation.current) return;
      userRef.current = u;
      setUser(u);
      setData(d);
      setHasMore(
        Object.fromEntries(entries.map(([k, v]) => [k, v.length === 100])),
      );
    } catch (e) {
      if (gen === generation.current) {
        setData(emptyData());
        setError(errorMessage(e));
      }
    } finally {
      if (gen === generation.current) setLoading(false);
    }
  }
  async function refresh() {
    if (demo) {
      if (userRef.current) storeDemo(source.current);
      return;
    }
    const s = await supabase?.auth.getSession();
    await load(s?.data.session || null);
  }
  useEffect(() => {
    if (demo) {
      const role = sessionStorage.getItem("kf-demo-role") as Role | null;
      if (role && ["admin", "teacher", "student"].includes(role)) {
        const u = demoUser(role, source.current);
        userRef.current = u;
        setUser(u);
        setData(scopeDemo(source.current, u));
      }
      setLoading(false);
      return;
    }
    if (!supabase) {
      setLoading(false);
      return;
    }
    void supabase.auth.getSession().then((r) => load(r.data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => void load(session));
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!user || demo) return;
    const f = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", f);
    const timer = setInterval(() => void refresh(), 60000);
    return () => {
      document.removeEventListener("visibilitychange", f);
      clearInterval(timer);
    };
  }, [user?.id]);
  async function mutate<T = any>(
    name: string,
    params: Params = {},
  ): Promise<T> {
    try {
      if (!userRef.current) throw Error("AUTH_REQUIRED");
      if (demo) {
        const copy = structuredClone(source.current),
          result = demoMutate(copy, userRef.current, name, params);
        if (
          !name.startsWith("get_") &&
          !name.startsWith("integration_") &&
          !name.startsWith("competition_leaderboard")
        ) {
          const audit = JSON.parse(
            sessionStorage.getItem("kf-demo-audit") || "[]",
          );
          audit.unshift({
            id: crypto.randomUUID(),
            actor_id: userRef.current.id,
            action: name,
            resource_type: name.split("_").slice(-1)[0],
            resource_id:
              params.p_id || params.p_request_id || params.p_user_id || "",
            created_at: new Date().toISOString(),
            changes: {},
          });
          sessionStorage.setItem("kf-demo-audit", JSON.stringify(audit));
        }
        if (name === "delete_draft_file")
          await deleteDemoFile(String(params.p_file_id));
        storeDemo(copy);
        return result as T;
      }
      const r = await supabase!.rpc(name, params);
      if (r.error) {
        const message = errorMessage(r.error.message);
        throw Error(
          message === r.error.message
            ? "L’action n’a pas abouti. Vérifiez les informations puis réessayez."
            : message,
        );
      }
      if (!name.startsWith("get_")) await refresh();
      return r.data as T;
    } catch (e) {
      throw Error(errorMessage(e));
    }
  }
  async function invoke<T = any>(name: string, body: Params = {}): Promise<T> {
    if (demo) {
      if (name === "google-status") return { state: "disconnected" } as T;
      throw Error(
        "Cette action nécessite la configuration de Supabase et de l’intégration. Aucun service externe n’est appelé en démonstration.",
      );
    }
    if (!supabase) throw Error("CONFIGURATION_REQUIRED");
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error) {
      let message = error.message;
      try {
        const payload = await error.context.json();
        message = payload.error?.message || message;
      } catch {}
      throw Error(errorMessage(message));
    }
    if (data?.error) throw Error(data.error.message);
    return data.data as T;
  }
  function loginDemo(role: Role) {
    if (!demo) return;
    const u = demoUser(role, source.current);
    userRef.current = u;
    setUser(u);
    setData(scopeDemo(source.current, u));
    sessionStorage.setItem("kf-demo-role", role);
  }
  async function logout() {
    ++generation.current;
    userRef.current = null;
    setUser(null);
    setData(emptyData());
    setHasMore({});
    reservations.current = new WeakMap();
    setError("");
    sessionStorage.removeItem("kf-demo-role");
    if (!demo) await supabase?.auth.signOut();
  }
  async function upload(
    file: File,
    targetType: string,
    targetId: string,
    onProgress: (n: number) => void,
  ) {
    if (demo) {
      const id = crypto.randomUUID();
      await putDemoFile(id, file);
      const copy = structuredClone(source.current);
      copy.files.push({
        id,
        owner_id: userRef.current!.id,
        bucket:
          targetType === "submission_version"
            ? "student-submissions"
            : "course-materials",
        object_path: id,
        target_type: targetType,
        target_id: targetId,
        original_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        status: "ready",
      });
      if (targetType === "submission_version")
        copy.submission_files.push({
          id: crypto.randomUUID(),
          submission_version_id: targetId,
          file_id: id,
          position: copy.submission_files.filter(
            (f) => f.submission_version_id === targetId,
          ).length,
        });
      if (targetType === "course")
        copy.course_resources.push({
          id: crypto.randomUUID(),
          course_id: targetId,
          file_id: id,
          label: file.name,
          position: 0,
        });
      storeDemo(copy);
      onProgress(100);
      return id;
    }
    let reservation = reservations.current.get(file);
    if (!reservation) {
      const prepared = await invoke<{
        id: string;
        bucket: string;
        object_path: string;
      }>("files-prepare", {
        targetType,
        targetId,
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });
      reservation = { ...prepared, uploaded: false };
      reservations.current.set(file, reservation);
    }
    const session = await supabase!.auth.getSession();
    if (!reservation.uploaded)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(
          "POST",
          `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/${reservation.bucket}/${reservation.object_path}`,
        );
        xhr.setRequestHeader(
          "Authorization",
          `Bearer ${session.data.session!.access_token}`,
        );
        xhr.setRequestHeader(
          "apikey",
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        );
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable)
            onProgress(Math.round((e.loaded / e.total) * 95));
        };
        xhr.onload = () =>
          (xhr.status >= 200 && xhr.status < 300) || xhr.status === 409
            ? resolve()
            : reject(Error("Le fichier n’a pas pu être téléversé. Réessayez."));
        xhr.onerror = () =>
          reject(Error("Connexion interrompue. Réessayez ce fichier."));
        xhr.send(file);
      });
    reservation.uploaded = true;
    await invoke("files-finalize", { fileId: reservation.id });
    reservations.current.delete(file);
    onProgress(100);
    await refresh();
    return reservation.id;
  }
  async function discardUpload(file: File) {
    const reservation = reservations.current.get(file);
    if (!reservation) return;
    if (!demo) await invoke("files-delete", { fileId: reservation.id });
    reservations.current.delete(file);
    await refresh();
  }
  async function fileURL(id: string) {
    if (demo) {
      const file = await getDemoFile(id);
      if (!file)
        throw Error(
          "Le document de démonstration n’a pas été ajouté dans ce navigateur.",
        );
      return URL.createObjectURL(file);
    }
    return (await invoke<{ url: string }>("files-read-url", { fileId: id }))
      .url;
  }
  async function updateProfile(name: string, language: string) {
    await mutate("save_profile", {
      p_display_name: name,
      p_language: language,
    });
  }
  async function loadMore(table: keyof Data) {
    if (demo || busy.current || !hasMore[table]) return;
    busy.current = true;
    const gen = generation.current;
    try {
      const offset = data[table].length;
      const r = await supabase!
        .from(table)
        .select("*")
        .order(
          table === "account_access"
            ? "user_id"
            : table === "course_progress"
              ? "course_id"
              : "id",
        )
        .range(offset, offset + 99);
      if (r.error) {
        const message = errorMessage(r.error.message);
        throw Error(
          message === r.error.message
            ? "L’action n’a pas abouti. Vérifiez les informations puis réessayez."
            : message,
        );
      }
      let incoming = r.data;
      if (table === "profiles" && userRef.current?.role === "admin") {
        const directory = await supabase!.rpc("admin_directory", {
          p_limit: 100,
          p_offset: offset,
        });
        if (directory.error) throw Error("Impossible de charger l’annuaire.");
        incoming = incoming.map((p) => ({
          ...p,
          email: directory.data.find(
            (r: { id: string; email: string }) => r.id === p.id,
          )?.email,
        }));
      }
      if (table === "classes")
        incoming = incoming.map((c) => ({
          ...c,
          enrolled_count: Number(stats.class_enrollments?.[c.id] || 0),
        }));
      if (gen !== generation.current) return;
      setData((d) => ({ ...d, [table]: [...d[table], ...incoming] }));
      setHasMore((h) => ({ ...h, [table]: r.data.length === 100 }));
    } finally {
      busy.current = false;
    }
  }
  return (
    <Context.Provider
      value={{
        data,
        user,
        demo,
        loading,
        error,
        toast,
        refresh,
        mutate,
        invoke,
        notify,
        loginDemo,
        logout,
        upload,
        discardUpload,
        fileURL,
        updateProfile,
        hasMore,
        loadMore,
        stats,
      }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </Context.Provider>
  );
}
