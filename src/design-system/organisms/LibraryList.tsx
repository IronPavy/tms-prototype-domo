import { Fragment } from "react";
import { EmptyTasks } from "../molecules/EmptyTasks";
import { LibraryRow } from "../molecules/LibraryRow";
import type { TaskRowData } from "../molecules/TaskRow";
import type { TaskAction } from "../molecules/TaskRowMenu";

export interface LibraryListProps {
  tasks: TaskRowData[];
  onOpen?: (task: TaskRowData) => void;
  onAction?: (action: TaskAction, task: TaskRowData) => void;
  /** shown when `tasks` is empty (host adds a reset button) */
  empty?: React.ReactNode;
}

/** Bibliothek: every task template ever created, one SP3 "Card" Filled (surface/raised, radius 3x) with 76px rows separated by a light line.
    Scrolls horizontally below ~960px. */
export function LibraryList({ tasks, onOpen, onAction, empty }: LibraryListProps) {
  if (!tasks.length) return <div className="flex justify-center py-[var(--sp-space-6x)]">{empty ?? <EmptyTasks />}</div>;
  return (
    <div className="overflow-x-auto bg-sp-surface-raised rounded-[var(--sp-radius-3x)]">
      <div className="min-w-[960px]">
        {tasks.map((t, i) => (
          <Fragment key={t.id}>
            {i > 0 && <hr className="m-0 mx-[var(--sp-space-4x)] border-0 border-t border-solid border-sp-neutral-fill-light" />}
            <LibraryRow task={t} onOpen={() => onOpen?.(t)} onAction={onAction && ((a) => onAction(a, t))} />
          </Fragment>
        ))}
      </div>
    </div>
  );
}
