import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL,
  key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configured = Boolean(url && key);
export const demoEnabled =
  !configured &&
  (import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO === "true");
export const supabase = configured
  ? createClient(url, key, {
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
export const appURL = import.meta.env.VITE_APP_URL || window.location.origin;
export function demoFileStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open("kon-fanan-demo-files", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("files");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function putDemoFile(id: string, file: File) {
  const db = await demoFileStore();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction("files", "readwrite");
    t.objectStore("files").put(file, id);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
  db.close();
}
export async function getDemoFile(id: string): Promise<File | undefined> {
  const db = await demoFileStore();
  const file = await new Promise<File | undefined>((resolve, reject) => {
    const r = db.transaction("files").objectStore("files").get(id);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  db.close();
  return file;
}
export async function deleteDemoFile(id: string) {
  const db = await demoFileStore();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
