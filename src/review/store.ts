import type { Anchor } from "./anchor";

export interface ReviewComment {
  id: string;
  page: string;
  anchor: Anchor;
  body: string;
  author_name: string;
  author_id: string;
  parent_id: string | null;
  resolved: boolean;
  created_at: string;
}

export type NewComment = Pick<ReviewComment, "page" | "anchor" | "body" | "author_name" | "parent_id">;

/** Where comments live. Supabase when VITE_SUPABASE_* are set (shared with everyone who opens the link),
    otherwise this browser's localStorage (local development / demo — nobody else sees them). */
export interface CommentStore {
  shared: boolean;
  userId: () => Promise<string>;
  list: () => Promise<ReviewComment[]>;
  add: (c: NewComment) => Promise<void>;
  update: (id: string, patch: Partial<Pick<ReviewComment, "resolved" | "body">>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  /** called when anything changed (another reviewer, another tab) */
  subscribe: (onChange: () => void) => () => void;
}

const KEY = "review-comments";
const UID = "review-user";

function localStore(): CommentStore {
  const read = (): ReviewComment[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } };
  const write = (c: ReviewComment[]) => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* storage blocked */ } };
  const uid = () => {
    let id = "";
    try { id = localStorage.getItem(UID) ?? ""; if (!id) { id = crypto.randomUUID(); localStorage.setItem(UID, id); } } catch { id = "local"; }
    return id;
  };
  return {
    shared: false,
    userId: async () => uid(),
    list: async () => read(),
    add: async (c) => write([...read(), { ...c, id: crypto.randomUUID(), author_id: uid(), resolved: false, created_at: new Date().toISOString() }]),
    update: async (id, patch) => write(read().map((c) => (c.id === id ? { ...c, ...patch } : c))),
    remove: async (id) => write(read().filter((c) => c.id !== id && c.parent_id !== id)),
    subscribe: (cb) => {
      const on = (e: StorageEvent) => { if (e.key === KEY) cb(); };
      window.addEventListener("storage", on);
      return () => window.removeEventListener("storage", on);
    },
  };
}

async function supabaseStore(url: string, key: string): Promise<CommentStore> {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(url, key);
  let uid: Promise<string> | null = null;
  /** every browser signs in anonymously once — gives it an id without a login screen */
  const userId = () => (uid ??= (async () => {
    const cur = (await sb.auth.getSession()).data.session;
    if (cur) return cur.user.id;
    const { data, error } = await sb.auth.signInAnonymously();
    if (error || !data.user) throw error ?? new Error("anonymous sign-in failed");
    return data.user.id;
  })());
  return {
    shared: true,
    userId,
    list: async () => {
      await userId();
      const { data, error } = await sb.from("comments").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []) as ReviewComment[];
    },
    add: async (c) => { await userId(); const { error } = await sb.from("comments").insert(c); if (error) throw error; },
    update: async (id, patch) => { const { error } = await sb.from("comments").update(patch).eq("id", id); if (error) throw error; },
    remove: async (id) => { const { error } = await sb.from("comments").delete().eq("id", id); if (error) throw error; },
    subscribe: (cb) => {
      const ch = sb.channel("comments").on("postgres_changes", { event: "*", schema: "public", table: "comments" }, cb).subscribe();
      return () => { void sb.removeChannel(ch); };
    },
  };
}

export const REVIEW_ENABLED = import.meta.env.VITE_REVIEW === "1";

export function createStore(): Promise<CommentStore> {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  return url && key ? supabaseStore(url, key) : Promise.resolve(localStore());
}
