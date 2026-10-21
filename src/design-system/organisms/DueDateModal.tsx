import { useState } from "react";
import { Button } from "../atoms/Button";
import { Checkbox } from "../atoms/Checkbox";
import { Icon } from "../atoms/Icon";
import { Radio } from "../atoms/Radio";
import { TextField } from "../atoms/TextField";
import { DateField } from "../molecules/DateField";
import { FormField } from "../molecules/FormField";
import { IconHint } from "../molecules/IconHint";
import { Modal } from "../molecules/Modal";
import { SelectField } from "../molecules/SelectField";
import { CalendarRange } from "./CalendarRange";
import { DAY_LABELS, REPEATS, dueErrors, fromInputDate, longDate, toInputDate, type DueSettings, type Repeat, type TimeMode } from "../utils/due";

export interface DueDateModalProps {
  value: DueSettings;
  /** Save — returns the edited settings */
  onSave: (value: DueSettings) => void;
  /** Cancel, Esc, back arrow — back to the task without applying */
  onCancel: () => void;
  today?: Date;
}

const divider = <hr className="m-0 border-0 border-t border-solid border-sp-border-line" />;

/** One Mon … Sun row of checkboxes with an "All" box in front, thin dividers between the days. */
function DayRow({ flags, onChange, prefix }: { flags: boolean[]; onChange: (f: boolean[]) => void; prefix?: string }) {
  const all = flags.every(Boolean);
  return (
    <div role="group" aria-label={prefix ?? "Days"} className="flex flex-wrap items-center justify-between gap-y-[var(--sp-space-1x)]">
      {prefix && <span className="w-20 shrink-0 sp-text-medium text-sp-text">{prefix}</span>}
      <Checkbox label="All" checked={all} partial={!all && flags.some(Boolean)} onChange={(on) => onChange(Array(7).fill(on))} />
      {DAY_LABELS.map((d, i) => (
        <span key={d} className="flex items-center">
          <span aria-hidden className="h-6 w-px mr-[var(--sp-space-2x)] bg-sp-border-line" />
          <Checkbox label={d} checked={flags[i]} onChange={(on) => onChange(flags.map((f, j) => (j === i ? on : f)))} />
        </span>
      ))}
    </div>
  );
}

/** "Set date and time" dialog (opened from the New task dialog; the arrow returns to it) in Sophi's Pet 3, English labels.
    Task series: No repetition = "Quick planning" (Date* + Calendar, Task due radios) · Daily (day checkboxes) · Weekly
    (week rows, "Add week") · Monthly · Yearly (Start / End "no end"); below the divider the time: one time · from – to · all day.
    Save is disabled while something is invalid; inline errors explain what. */
export function DueDateModal({ value, onSave, onCancel, today = new Date() }: DueDateModalProps) {
  const [d, setD] = useState<DueSettings>(value);
  const set = <K extends keyof DueSettings>(k: K, v: DueSettings[K]) => setD((s) => ({ ...s, [k]: v }));
  const err = dueErrors(d);
  const valid = !Object.keys(err).length;
  const once = d.repeat === "none";

  const setRepeat = (r: Repeat) => setD((s) => ({ ...s, repeat: r }));
  const setMode = (m: TimeMode) => set("timeMode", m);

  const timeOptions = (
    <div role="radiogroup" aria-label="Task due" className="flex flex-col gap-[var(--sp-space-3x)]">
      <div className="flex items-center gap-[var(--sp-space-2x)]">
        <Radio label="At a time" showLabel={false} checked={d.timeMode === "time"} onChange={() => setMode("time")} />
        <TextField aria-label="Time" type="time" value={d.time} onChange={(t) => set("time", t)} disabled={d.timeMode !== "time"} className="flex-1 min-w-[var(--tms-time-min-width)] max-w-[var(--tms-time-max-width)]" />
      </div>
      <div className="flex items-center gap-[var(--sp-space-2x)]">
        <Radio label="Time range" showLabel={false} checked={d.timeMode === "range"} onChange={() => setMode("range")} />
        <TextField aria-label="From" type="time" value={d.from} onChange={(t) => set("from", t)} disabled={d.timeMode !== "range"} className="flex-1 min-w-0 max-w-56" />
        <span aria-hidden className="text-sp-brand-on-surface">—</span>
        <TextField aria-label="To" type="time" value={d.to} onChange={(t) => set("to", t)} disabled={d.timeMode !== "range"} className="flex-1 min-w-0 max-w-56" />
      </div>
      <Radio label="All day" checked={d.timeMode === "allday"} onChange={() => setMode("allday")} />
      {err.time && <span role="alert" className="flex items-center gap-[var(--sp-space-1x)] sp-text-small text-sp-danger-on-surface"><Icon name="warning" color="var(--sp-danger-on-surface)" />{err.time}</span>}
    </div>
  );

  return (
    <Modal
      title="Set date and time"
      width={680}
      onBack={onCancel}
      onClose={onCancel}
      subtitle={once ? <><Icon name="clock" color="var(--sp-icon)" />Quick planning</> : undefined}
      footer={
        <>
          <Button variant="primary" label="Save" disabled={!valid} onClick={() => onSave(d)} />
          <Button variant="secondary" label="Cancel" onClick={onCancel} />
        </>
      }
    >
      <FormField label="Task series" htmlFor="due-repeat">
        <SelectField id="due-repeat" options={REPEATS} value={d.repeat} onChange={setRepeat} />
      </FormField>

      {once ? (
        <div className="grid grid-cols-1 sm:grid-cols-[280px_minmax(0,1fr)] gap-x-[var(--sp-space-6x)] gap-y-[var(--sp-space-4x)]">
          <FormField label="Date" required error={err.start}>
            <div className="flex items-center h-8 px-[var(--sp-space-2x)] bg-sp-form-control-background-color border border-solid border-sp-form-control-border-color rounded-[var(--sp-radius-2x)] sp-text-standard text-sp-text">
              {longDate(d.start)}
            </div>
            <CalendarRange single value={{ start: fromInputDate(d.start), end: fromInputDate(d.start) }} today={today} onChange={(r) => set("start", toInputDate(r.start))} />
          </FormField>
          <div className="flex flex-col gap-[var(--sp-space-3x)]">
            <span className="sp-text-standard text-sp-text-label">Task due:</span>
            {timeOptions}
          </div>
        </div>
      ) : (
        <>
          {d.repeat === "daily" && (
            <div className="flex flex-col gap-[var(--sp-space-1x)]">
              <DayRow flags={d.days} onChange={(f) => set("days", f)} />
              {err.days && <span role="alert" className="sp-text-small text-sp-danger-on-surface">{err.days}</span>}
            </div>
          )}
          {d.repeat === "weekly" && (
            <div className="flex flex-col gap-[var(--sp-space-2x)]">
              <span className="flex items-center gap-[var(--sp-space-2x)]">
                <IconHint label="The pattern repeats week by week. Add a week to alternate between different weeks."><Icon name="info_circle" size={20} color="var(--sp-brand-on-surface)" /></IconHint>
              </span>
              {d.weeks.map((w, i) => (
                <div key={i} className="flex items-center gap-[var(--sp-space-2x)]">
                  <div className="flex-1 min-w-0">
                    <DayRow prefix={`Week ${i + 1}.`} flags={w} onChange={(f) => set("weeks", d.weeks.map((x, j) => (j === i ? f : x)))} />
                  </div>
                  {d.weeks.length > 1 && (
                    <button type="button" aria-label={`Remove week ${i + 1}`} onClick={() => set("weeks", d.weeks.filter((_, j) => j !== i))} className="flex items-center justify-center size-8 p-0 border-0 bg-transparent rounded-[var(--sp-radius-2x)] cursor-pointer sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]">
                      <Icon name="delete" color="var(--sp-icon)" />
                    </button>
                  )}
                </div>
              ))}
              <div><Button variant="tertiary" icon="plus" label="Add week" onClick={() => set("weeks", [...d.weeks, Array(7).fill(true)])} /></div>
              {err.weeks && <span role="alert" className="sp-text-small text-sp-danger-on-surface">{err.weeks}</span>}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[var(--sp-space-6x)] gap-y-[var(--sp-space-3x)]">
            <div className="flex items-center gap-[var(--sp-space-3x)]">
              <label htmlFor="due-start" className="w-12 sp-text-medium text-sp-text">Start</label>
              <div className="w-48"><DateField id="due-start" value={d.start} onChange={(s) => set("start", s)} today={today} invalid={!!err.start} /></div>
            </div>
            <div className="flex flex-col gap-[var(--sp-space-1x)]">
              <div className="flex items-center gap-[var(--sp-space-3x)]">
                <label htmlFor="due-end" className="w-12 sp-text-medium text-sp-text">End</label>
                <div className="w-48"><DateField id="due-end" value={d.end} onChange={(s) => set("end", s)} placeholder="no end" clearable today={today} invalid={!!err.end} /></div>
              </div>
              {err.end && <span role="alert" className="sp-text-small text-sp-danger-on-surface">{err.end}</span>}
            </div>
          </div>

          {divider}
          {timeOptions}
        </>
      )}
    </Modal>
  );
}
