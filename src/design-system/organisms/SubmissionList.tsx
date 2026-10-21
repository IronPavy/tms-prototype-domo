import { Fragment } from "react";
import { EmptyState } from "../molecules/EmptyState";
import { SubmissionRow, type SubmissionRowProps } from "../molecules/SubmissionRow";

export interface Submission extends Omit<SubmissionRowProps, "onOpen"> { id: string }

export interface SubmissionListProps {
  items: Submission[];
  onOpen?: (item: Submission) => void;
}

/** Submission rows separated by the library Divider (wrap in ScrollArea for long lists). */
export function SubmissionList({ items, onOpen }: SubmissionListProps) {
  if (!items.length) {
    return <EmptyState icon="form" title="No submissions yet" />;
  }
  return (
    <div className="flex flex-col">
      {items.map((s, i) => (
        <Fragment key={s.id}>
          {i > 0 && <hr className="m-0 mx-[var(--sp-space-2x)] border-0 border-t border-solid border-sp-border-line" />}
          <SubmissionRow {...s} onOpen={() => onOpen?.(s)} />
        </Fragment>
      ))}
    </div>
  );
}
