import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Icon, Modal, TextField } from "@/design-system";
import { REVIEW_UI, makeAnchor, resolveAnchor, type Anchor } from "./anchor";
import { CommentThread } from "./CommentThread";
import { REVIEW_ENABLED, createStore, type CommentStore, type ReviewComment } from "./store";

const NAME_KEY = "review-name";
const readName = () => { try { return localStorage.getItem(NAME_KEY) ?? ""; } catch { return ""; } };
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

/** Stakeholder review layer: C = comment mode (click anywhere in the design to leave a comment), Shift+C = show / hide all.
    Only rendered when VITE_REVIEW=1. Comments are stored in Supabase (shared) or, without keys, in this browser. */
export function ReviewLayer({ page }: { page: string }) {
  return REVIEW_ENABLED ? <Layer page={page} /> : null;
}

function Layer({ page }: { page: string }) {
  const [store, setStore] = useState<CommentStore | null>(null);
  const [me, setMe] = useState("");
  const [all, setAll] = useState<ReviewComment[]>([]);
  const [error, setError] = useState("");
  const [mode, setMode] = useState(false);
  const [visible, setVisible] = useState(true);
  const [showResolved, setShowResolved] = useState(true);
  const [name, setName] = useState(readName);
  const [askName, setAskName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [draft, setDraft] = useState<Anchor | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const afterName = useRef<(() => void) | null>(null);

  // store + data
  useEffect(() => {
    let off = () => {};
    let alive = true;
    createStore().then(async (s) => {
      if (!alive) return;
      setStore(s);
      const load = () => s.list().then((c) => alive && (setAll(c), setError(""))).catch((e) => alive && setError(String(e?.message ?? e)));
      try { setMe(await s.userId()); } catch (e) { setError(String((e as Error).message ?? e)); }
      await load();
      off = s.subscribe(() => { void load(); });
    }).catch((e) => setError(String(e?.message ?? e)));
    return () => { alive = false; off(); };
  }, []);
  const reload = useCallback(() => store?.list().then(setAll).catch((e) => setError(String(e?.message ?? e))), [store]);

  // pins follow the design on scroll / resize / layout changes
  useEffect(() => {
    let raf = 0;
    const go = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); };
    window.addEventListener("resize", go);
    window.addEventListener("scroll", go, true);
    // our own pins move on every tick — only react to changes elsewhere
    const mo = new MutationObserver((recs) => { if (recs.some((r) => !(r.target instanceof Element ? r.target : r.target.parentElement)?.closest(REVIEW_UI))) go(); });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", go); window.removeEventListener("scroll", go, true); mo.disconnect(); };
  }, []);

  // changing the page closes whatever is open
  useEffect(() => { setDraft(null); setOpenId(null); }, [page]);

  const needName = (then: () => void) => {
    if (name) { then(); return; }
    afterName.current = then;
    setNameDraft("");
    setAskName(true);
  };
  const saveName = () => {
    const n = nameDraft.trim().slice(0, 60);
    if (!n) return;
    try { localStorage.setItem(NAME_KEY, n); } catch { /* storage blocked */ }
    setName(n);
    setAskName(false);
    const next = afterName.current; afterName.current = null;
    next?.();
  };
  const startMode = () => needName(() => { setMode(true); setVisible(true); });

  // shortcuts: C comment mode · Shift+C show/hide · Esc leave
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if (e.key === "Escape" && !typing) {
        if (draft) setDraft(null); else if (openId) setOpenId(null); else if (mode) setMode(false);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey || e.key.toLowerCase() !== "c") return;
      if (document.querySelector('[aria-modal="true"]')) return;
      e.preventDefault();
      if (e.shiftKey) setVisible((v) => !v);
      else if (mode) setMode(false);
      else startMode();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // comment mode: the first click anywhere in the design places a comment instead of using the app
  useEffect(() => {
    if (!mode) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t || t.closest(REVIEW_UI) || t.closest('[role="dialog"][aria-modal="true"]')) return;
      e.preventDefault();
      e.stopPropagation();
      setOpenId(null);
      setDraft(makeAnchor(t, e.clientX, e.clientY));
    };
    document.addEventListener("click", onClick, true);
    document.body.classList.add("review-mode");
    return () => { document.removeEventListener("click", onClick, true); document.body.classList.remove("review-mode"); };
  }, [mode]);

  const mine = useMemo(() => all.filter((c) => c.page === page), [all, page]);
  const roots = mine.filter((c) => !c.parent_id);
  const shown = visible ? roots.filter((c) => showResolved || !c.resolved) : [];
  const repliesOf = (id: string) => mine.filter((c) => c.parent_id === id);

  const act = (f: () => Promise<void> | undefined) => { Promise.resolve(f()).then(reload).catch((e) => setError(String(e?.message ?? e))); };
  const post = (body: string, parent: string | null, anchor: Anchor) =>
    act(() => store?.add({ page, anchor, body, author_name: name, parent_id: parent }));

  const draftPos = draft ? resolveAnchor(draft) : null;
  const open = openId ? roots.find((c) => c.id === openId) : undefined;
  const openPos = open ? resolveAnchor(open.anchor) : null;

  const tbBtn = (on: boolean) =>
    `inline-flex items-center h-8 p-[var(--sp-space-2x)] gap-[var(--sp-space-1x)] border-0 rounded-[var(--sp-radius-2x)] cursor-pointer sp-text-medium whitespace-nowrap outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)] ${on ? "bg-sp-selected text-sp-text-selected" : "bg-transparent text-sp-text"}`;

  return createPortal(
    <>
      <style>{`body.review-mode, body.review-mode * { cursor: crosshair !important; } body.review-mode [data-review-ui], body.review-mode [data-review-ui] * { cursor: auto !important; } body.review-mode [data-review-ui] button { cursor: pointer !important; }`}</style>

      {/* pins */}
      <div className="fixed inset-0 z-[90] pointer-events-none" data-review-ui>
        {shown.map((c, i) => {
          const p = resolveAnchor(c.anchor);
          if (!p) return null;
          const n = repliesOf(c.id).length;
          return (
            <button
              key={c.id}
              data-review-ui
              type="button"
              title={`${c.author_name}: ${c.body}`}
              aria-label={`Comment ${i + 1} by ${c.author_name}${c.resolved ? " (resolved)" : ""}`}
              onClick={() => { setDraft(null); setOpenId((cur) => (cur === c.id ? null : c.id)); }}
              style={{ left: p.x, top: p.y }}
              className={`pointer-events-auto absolute -translate-y-full flex items-center justify-center size-8 p-0 border-2 border-solid border-sp-surface-raised rounded-[var(--sp-radius-pill)] rounded-bl-none shadow-[var(--sp-shadow-m)] sp-text-small-medium cursor-pointer outline-none focus-visible:shadow-[var(--sp-focus-brand)] ${
                c.resolved ? "bg-sp-neutral-fill-light text-sp-neutral-on-light" : "bg-sp-brand-fill-normal text-sp-brand-on-normal"
              } ${openId === c.id ? "ring-2 ring-sp-brand-border-normal" : ""}`}
            >
              {c.resolved ? <Icon name="check" color="var(--sp-neutral-on-light)" /> : initials(c.author_name)}
              {n > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 rounded-[var(--sp-radius-pill)] bg-sp-surface-raised text-sp-text sp-text-extra-small leading-4 text-center border border-solid border-sp-border-line">{n}</span>}
            </button>
          );
        })}
        {draftPos && draft && (
          <>
            <span style={{ left: draftPos.x, top: draftPos.y }} className="absolute -translate-y-full size-8 rounded-[var(--sp-radius-pill)] rounded-bl-none bg-sp-brand-fill-normal border-2 border-solid border-sp-surface-raised shadow-[var(--sp-shadow-m)] flex items-center justify-center sp-text-small-medium text-sp-brand-on-normal">{initials(name)}</span>
            <CommentThread
              x={draftPos.x}
              y={draftPos.y}
              me={me}
              authorName={name}
              onPost={(b) => { post(b, null, draft); setDraft(null); }}
              onClose={() => setDraft(null)}
            />
          </>
        )}
        {open && openPos && (
          <CommentThread
            x={openPos.x}
            y={openPos.y}
            me={me}
            authorName={name}
            thread={{ root: open, replies: repliesOf(open.id) }}
            onPost={(b) => post(b, open.id, open.anchor)}
            onResolve={open.author_id === me ? (r) => act(() => store?.update(open.id, { resolved: r })) : undefined}
            onDelete={(id) => { act(() => store?.remove(id)); if (id === open.id) setOpenId(null); }}
            onClose={() => setOpenId(null)}
          />
        )}
      </div>

      {/* toolbar */}
      <div
        data-review-ui
        role="toolbar"
        aria-label="Review comments"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[96] flex items-center gap-[var(--sp-space-1x)] p-[var(--sp-space-1x)] bg-sp-surface-raised border border-solid border-sp-border-line rounded-[var(--sp-radius-pill)] shadow-[var(--sp-shadow-m)] max-w-[calc(100vw-16px)]"
      >
        <button type="button" aria-pressed={mode} onClick={() => (mode ? setMode(false) : startMode())} className={tbBtn(mode)} title="Comment mode (C)">
          <Icon name="message" />
          <span className="leading-none">{mode ? "Click to comment" : "Comment"}</span>
          <kbd className="px-1 rounded-[var(--sp-radius-1x)] bg-sp-neutral-fill-light sp-text-extra-small text-sp-text-label">C</kbd>
        </button>
        <button type="button" aria-pressed={visible} onClick={() => setVisible((v) => !v)} className={tbBtn(false)} title="Show / hide all comments (Shift+C)">
          <Icon name={visible ? "eye" : "eye_crossed"} />
          <span className="leading-none">{visible ? "Hide" : "Show"} comments</span>
          <span className="inline-flex items-center h-5 px-[var(--tms-space-6px)] rounded-[var(--sp-radius-2x)] bg-sp-neutral-fill-light sp-text-small-medium text-sp-text tabular-nums">{roots.length}</span>
        </button>
        <button type="button" aria-pressed={showResolved} onClick={() => setShowResolved((s) => !s)} className={tbBtn(false)} title="Show resolved comments">
          <Icon name="check_circle" />
          <span className="leading-none max-sm:hidden">Resolved {showResolved ? "shown" : "hidden"}</span>
        </button>
        <button type="button" onClick={() => { afterName.current = null; setNameDraft(name); setAskName(true); }} className={tbBtn(false)} title="Your name">
          <Icon name="user" />
          <span className="leading-none max-w-32 truncate max-sm:hidden">{name || "Add your name"}</span>
        </button>
      </div>
      {error && (
        <div data-review-ui role="alert" className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[96] max-w-[calc(100vw-16px)] px-[var(--sp-space-3x)] py-[var(--sp-space-2x)] bg-sp-surface-raised border border-solid border-sp-danger-border-light rounded-[var(--sp-radius-2x)] sp-text-small text-sp-danger-on-surface shadow-[var(--sp-shadow-m)]">
          Comments could not be saved or loaded: {error}
        </div>
      )}

      {askName && (
        <Modal
          title="Your name"
          width={400}
          minWidth={320}
          onClose={() => { setAskName(false); afterName.current = null; }}
          footer={
            <>
              <Button variant="tertiary" label="Cancel" onClick={() => { setAskName(false); afterName.current = null; }} />
              <Button variant="primary" label="Continue" disabled={!nameDraft.trim()} onClick={saveName} />
            </>
          }
        >
          <p className="m-0 sp-text-standard text-sp-text">Your name is shown next to every comment you leave.</p>
          <TextField aria-label="Your name" value={nameDraft} onChange={setNameDraft} placeholder="e.g. Maria Schmidt" maxLength={60} autoFocus onEnter={saveName} />
        </Modal>
      )}
    </>,
    document.body,
  );
}
