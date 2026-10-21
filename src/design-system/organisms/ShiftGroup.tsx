import { Fragment, useId, useState } from "react";
import { Icon } from "../atoms/Icon";
import { ProgressBar } from "../atoms/ProgressBar";
import { ShiftTaskRow, type ShiftTaskRowProps } from "../molecules/ShiftTaskRow";

export interface ShiftTask extends Omit<ShiftTaskRowProps, "onOpen"> { id: string }

export interface ShiftGroupProps {
  /** "Morning shift · Kitchen" */
  title: string;
  tasks: ShiftTask[];
  defaultOpen?: boolean;
  onOpenTask?: (task: ShiftTask) => void;
}

/** One shift (or "Individual") with its tasks of the day.
    Box: 1px basics/lines-and-borders · radius double. Header (basics/app-background, hover basics/hover)
    = chevron · title (Roboto Standard Medium) · library Progress Bar (success accent when complete) · "done/total";
    click the header to collapse / expand. Rows separated by the library Divider. */
export function ShiftGroup({ title, tasks, defaultOpen = true, onOpenTask }: ShiftGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const done = tasks.filter((t) => t.state === "done").length;
  const late = tasks.some((t) => t.state === "late");
  const complete = tasks.length > 0 && done === tasks.length;

  return (
    <section className="shrink-0 overflow-hidden border border-solid border-sp-border-line rounded-[var(--sp-radius-3x)] bg-sp-surface-raised">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-[var(--sp-space-3x)] w-full h-9 px-[var(--sp-space-3x)] border-0 text-left cursor-pointer bg-sp-surface-default sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]"
      >
        <span className={`flex transition-transform duration-150 ${open ? "" : "-rotate-90"}`}>
          <Icon name="expanded" color="var(--sp-icon)" />
        </span>
        <span className="sp-text-medium text-sp-text flex-1 min-w-0 truncate">{title}</span>
        <ProgressBar value={done} max={tasks.length} tone={complete ? "success" : undefined} className="w-[clamp(48px,20%,96px)] shrink-0" />
        <span className={`sp-text-small-medium tabular-nums w-8 text-right shrink-0 ${late ? "text-sp-warning-on-surface" : "text-sp-text-label"}`}>
          {done}/{tasks.length}
        </span>
      </button>

      {open && (
        <div id={id} className="border-0 border-t border-solid border-sp-border-line">
          {tasks.map((t, i) => (
            <Fragment key={t.id}>
              {i > 0 && <hr className="m-0 border-0 border-t border-solid border-sp-border-line" />}
              <ShiftTaskRow {...t} onOpen={() => onOpenTask?.(t)} />
            </Fragment>
          ))}
        </div>
      )}
    </section>
  );
}
