import { useState } from "react";
import { Avatar, Button, Icon, TextField } from "@/design-system";
import type { ReviewComment } from "./store";

const MAX = 2000;

export const ago = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
};

interface Props {
  /** viewport position of the pin the panel hangs next to */
  x: number;
  y: number;
  /** existing thread: first comment + replies; undefined = a new comment */
  thread?: { root: ReviewComment; replies: ReviewComment[] };
  me: string;
  authorName: string;
  onPost: (body: string) => void;
  onResolve?: (resolved: boolean) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const WIDTH = 320;

/** Comment panel next to a pin: author + time, text, replies, reply box, Resolve / Delete (own comments only). */
export function CommentThread({ x, y, thread, me, authorName, onPost, onResolve, onDelete, onClose }: Props) {
  const [text, setText] = useState("");
  const left = x + 20 + WIDTH > window.innerWidth - 8 ? Math.max(8, x - 20 - WIDTH) : x + 20;
  const top = Math.min(Math.max(8, y - 36), Math.max(8, window.innerHeight - 280));
  const post = () => { const t = text.trim(); if (t) { onPost(t); setText(""); } };

  const item = (c: ReviewComment) => (
    <div key={c.id} className="flex gap-[var(--sp-space-2x)]">
      <Avatar name={c.author_name} size={24} />
      <div className="flex flex-col gap-[var(--sp-space-1x)] min-w-0 flex-1">
        <span className="flex items-baseline gap-[var(--sp-space-2x)] min-w-0">
          <span className="sp-text-medium text-sp-text truncate">{c.author_name}</span>
          <span className="sp-text-small text-sp-text-label whitespace-nowrap">{ago(c.created_at)}</span>
          {c.author_id === me && onDelete && (
            <button
              type="button"
              aria-label="Delete comment"
              onClick={() => onDelete(c.id)}
              className="ml-auto flex items-center justify-center size-6 p-0 border-0 bg-transparent rounded-[var(--sp-radius-2x)] cursor-pointer sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)] [--del:var(--sp-icon)] hover:[--del:var(--sp-danger-on-surface)]"
            >
              <Icon name="delete" color="var(--del)" />
            </button>
          )}
        </span>
        <span className="sp-text-standard text-sp-text whitespace-pre-wrap break-words">{c.body}</span>
      </div>
    </div>
  );

  return (
    <div
      data-review-ui
      role="dialog"
      aria-label={thread ? "Comment thread" : "New comment"}
      style={{ left, top, width: WIDTH }}
      className="fixed z-[95] flex flex-col gap-[var(--sp-space-3x)] max-h-[calc(100vh-16px)] overflow-y-auto p-[var(--sp-space-3x)] bg-sp-surface-raised border border-solid border-sp-border-line rounded-[var(--sp-radius-3x)] shadow-[var(--sp-shadow-m)] pointer-events-auto"
      onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } }}
    >
      {thread && (
        <>
          <div className="flex items-center gap-[var(--sp-space-1x)]">
            <span className="sp-text-small text-sp-text-label">{thread.replies.length ? `${thread.replies.length + 1} comments` : "Comment"}{thread.root.resolved ? " · Resolved" : ""}</span>
            <span className="ml-auto flex items-center gap-[var(--sp-space-1x)]">
              {onResolve && <Button variant="tertiary" icon="check" label={thread.root.resolved ? "Reopen" : "Resolve"} onClick={() => onResolve(!thread.root.resolved)} />}
              <button type="button" aria-label="Close" onClick={onClose} className="flex items-center justify-center size-8 p-0 border-0 bg-transparent rounded-[var(--sp-radius-2x)] cursor-pointer sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]">
                <Icon name="close" color="var(--sp-icon)" />
              </button>
            </span>
          </div>
          {[thread.root, ...thread.replies].map(item)}
        </>
      )}
      {!thread && <span className="sp-text-medium text-sp-text">New comment as {authorName}</span>}
      <TextField
        multiline
        rows={2}
        autoFocus
        value={text}
        maxLength={MAX}
        onChange={setText}
        placeholder={thread ? "Reply…" : "Write a comment…"}
        aria-label={thread ? "Reply" : "Comment"}
        onEnter={post}
      />
      <div className="flex items-center justify-end gap-[var(--sp-space-2x)]">
        {!thread && <Button variant="tertiary" label="Cancel" onClick={onClose} />}
        <Button variant="primary" icon="send" label={thread ? "Reply" : "Comment"} disabled={!text.trim()} onClick={post} />
      </div>
    </div>
  );
}
