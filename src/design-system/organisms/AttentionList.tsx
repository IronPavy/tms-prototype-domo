import { Fragment } from "react";
import { Link } from "../atoms/Link";
import { EmptyState } from "../molecules/EmptyState";
import { AttentionRow, type AttentionRowProps } from "../molecules/AttentionRow";

export interface AttentionItem extends Omit<AttentionRowProps, "onAction" | "onOpen"> {
  id: string;
}

export interface AttentionListProps {
  items: AttentionItem[];
  /** optional cap — rows shown before a "+ N more in Tasks" link; omit to show all (scroll instead) */
  limit?: number;
  onMore?: () => void;
  onAction?: (item: AttentionItem) => void;
  onOpen?: (item: AttentionItem) => void;
  /** text when nothing needs attention */
  emptyText?: string;
}

/** Rows separated by the library "Divider" (1px basics/lines-and-borders) and an empty state.
    Shows every item (wrap in ScrollArea); with `limit` it adds a "+ N more in Tasks" library Link. */
export function AttentionList({ items, limit, onMore, onAction, onOpen, emptyText = "Nothing needs your attention." }: AttentionListProps) {
  if (!items.length) return <EmptyState icon="check" title="All caught up" text={emptyText} />;

  const shown = items.slice(0, limit);
  const rest = items.length - shown.length;

  return (
    <div className="flex flex-col">
      {shown.map((item, i) => (
        <Fragment key={item.id}>
          {i > 0 && <hr className="m-0 mx-[var(--sp-space-2x)] border-0 border-t border-solid border-sp-border-line" />}
          <AttentionRow {...item} onAction={() => onAction?.(item)} onOpen={() => onOpen?.(item)} />
        </Fragment>
      ))}
      {rest > 0 && (
        <div className="pt-[var(--sp-space-3x)] px-[var(--sp-space-2x)]">
          <Link onClick={onMore} role="button" tabIndex={0}>+ {rest} more in Tasks</Link>
        </div>
      )}
    </div>
  );
}
