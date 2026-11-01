import { createContext } from "react";
import type { Data, User, Role, Params } from "../lib/types";
export interface AppContext {
  data: Data;
  user: User | null;
  demo: boolean;
  loading: boolean;
  error: string;
  toast: string;
  refresh: () => Promise<void>;
  mutate: <T = any>(rpc: string, params?: Params) => Promise<T>;
  invoke: <T = any>(name: string, body?: Params) => Promise<T>;
  notify: (s: string) => void;
  loginDemo: (role: Role) => void;
  logout: () => Promise<void>;
  upload: (
    file: File,
    targetType: string,
    targetId: string,
    onProgress: (n: number) => void,
  ) => Promise<string>;
  discardUpload: (file: File) => Promise<void>;
  fileURL: (id: string) => Promise<string>;
  updateProfile: (name: string, language: string) => Promise<void>;
  stats: Record<string, any>;
  hasMore: Partial<Record<keyof Data, boolean>>;
  loadMore: (table: keyof Data) => Promise<void>;
}
export const Context = createContext<AppContext | null>(null);
