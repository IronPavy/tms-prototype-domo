import { Fragment } from "react";
import { EmptyState } from "../molecules/EmptyState";
import { CompletedTaskRow, type CompletedTaskRowProps } from "../molecules/CompletedTaskRow";

export interface CompletedTask extends Omit<CompletedTaskRowProps, "onOpen"> { id: string }

export interface CompletedTaskListProps {
  items: CompletedTask[];
  onOpen?: (item: CompletedTask) => void;
}

/** Completed-task rows separated by the library Divider (wrap in ScrollArea for long lists). */
export function CompletedTaskList({ items, onOpen }: CompletedTaskListProps) {
  if (!items.length) {
    return <EmptyState icon="check_circle" title="Noch nichts erledigt" />;
  }
  return (
    <div className="flex flex-col">
      {items.map((s, i) => (
        <Fragment key={s.id}>
          {i > 0 && <hr className="m-0 mx-[var(--sp-space-2x)] border-0 border-t border-solid border-sp-border-line" />}
          <CompletedTaskRow {...s} onOpen={() => onOpen?.(s)} />
        </Fragment>
      ))}
    </div>
  );
}
