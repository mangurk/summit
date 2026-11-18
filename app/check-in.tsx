import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { DayLog, GoalLog, MedicationLog } from "@/lib/progress";
import { Icon, type Glyph } from "./summit-ui";

export const objectives = [
  { id: "drinks", title: "Alcohol", detail: "Record today’s drinks", glyph: "drink", color: "peach" },
  { id: "medication", title: "Medication", detail: "Log your dose or status", glyph: "medication", color: "violet" },
  { id: "goal", title: "Personal goal", detail: "Check in on one small goal", glyph: "goal", color: "mint" },
] as const satisfies { id: keyof DayLog; title: string; detail: string; glyph: Glyph; color: string }[];

export type Objective = (typeof objectives)[number]["id"];
const medicationLabels = { taken: "Taken", missed: "Missed", none: "Not scheduled" };

export function ObjectiveBadge({ filled, celebrate }: { filled: boolean; celebrate: boolean }) {
  return (
    <span className="objective-badge" data-filled={filled} data-celebrate={celebrate} aria-hidden="true">
      <span className="objective-badge-fill" />
      {celebrate && (
        <span className="objective-sparks">
          {Array.from({ length: 8 }, (_, index) => (
            <i key={index} style={{ "--spark-angle": `${index * 45 + 12}deg` } as CSSProperties} />
          ))}
        </span>
      )}
    </span>
  );
}

export function objectiveSummary(field: Objective, log: DayLog) {
  switch (field) {
    case "drinks":
      return log.drinks === undefined
        ? null
        : log.drinks === 0 ? "0 drinks logged" : `${log.drinks} ${log.drinks === 1 ? "drink" : "drinks"} logged`;
    case "medication":
      if (!log.medication) return null;
      return [medicationLabels[log.medication.status], log.medication.dose && `${log.medication.dose} ${log.medication.unit}`].filter(Boolean).join(" · ");
    case "goal":
      if (!log.goal) return null;
      return [log.goal.name, log.goal.result === "done" ? "Done" : "Worked on it"].filter(Boolean).join(" · ");
  }
}

export function DayEntries({ log }: { log: DayLog }) {
  return (
    <div className="day-details">
      {objectives.map((objective) => (
        <div key={objective.id}><Icon name={objective.glyph} size={17} /><b>{objective.title}</b><span>{objectiveSummary(objective.id, log) ?? "Not logged"}</span></div>
      ))}
    </div>
  );
}

export function Dialog({
  title, onClose, children, variant,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  variant?: "reward" | "centered";
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={`sheet${variant ? ` ${variant}-sheet` : ""}`}
      aria-labelledby="sheet-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="sheet-inner">
        <div className="sheet-heading">
          <h2 id="sheet-title">{title}</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export function LogForm({ field, log, onSave }: { field: Objective; log: DayLog; onSave: (patch: DayLog) => void }) {
  const [drinks, setDrinks] = useState(String(log.drinks ?? 0));
  const [status, setStatus] = useState<MedicationLog["status"] | null>(log.medication?.status ?? null);
  const [dose, setDose] = useState(log.medication?.dose ?? "");
  const [unit, setUnit] = useState(log.medication?.unit || "mg");
  const [goal, setGoal] = useState(log.goal?.name ?? "");
  const [result, setResult] = useState<GoalLog["result"] | null>(log.goal?.result ?? null);
  const drinkNumber = Number(drinks);
  const validDrinks = drinks !== "" && Number.isFinite(drinkNumber) && drinkNumber >= 0;
  const valid = field === "drinks" ? validDrinks : field === "medication" ? status !== null : result !== null;

  function submit() {
    if (!valid) return;
    if (field === "drinks") onSave({ drinks: drinkNumber });
    if (field === "medication" && status) onSave({ medication: { status, dose: status === "taken" ? dose.trim() : "", unit: status === "taken" && dose ? unit.trim() : "" } });
    if (field === "goal" && result) onSave({ goal: { name: goal.trim(), result } });
  }

  return (
    <form className="log-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
      {field === "drinks" && (
        <>
          <p>How many drinks did you have today?</p>
          <div className="quantity">
            <button className="icon-button" type="button" disabled={!validDrinks || drinkNumber === 0} aria-label="Remove one drink" onClick={() => setDrinks(String(Math.max(0, drinkNumber - 1)))}><Icon name="minus" /></button>
            <input type="number" min="0" step="any" inputMode="decimal" value={drinks} onChange={(event) => setDrinks(event.target.value)} aria-label="Number of drinks" required />
            <button className="icon-button" type="button" aria-label="Add one drink" onClick={() => setDrinks(String((validDrinks ? drinkNumber : 0) + 1))}><Icon name="plus" /></button>
          </div>
          <span className="field-hint">Every honest log counts toward today’s check-in.</span>
        </>
      )}
      {field === "medication" && (
        <>
          <p>What was your medication status today?</p>
          <div className="choices" role="group" aria-label="Medication status">
            {(Object.keys(medicationLabels) as MedicationLog["status"][]).map((value) => (
              <button type="button" key={value} aria-pressed={status === value} onClick={() => setStatus(value)}>{medicationLabels[value]}</button>
            ))}
          </div>
          {status === "taken" && (
            <div className="dose-fields">
              <label>
                <span>Amount taken <small className="field-hint">(optional)</small></span>
                <input type="text" inputMode="decimal" maxLength={12} value={dose} onChange={(event) => setDose(event.target.value)} placeholder="Amount" />
              </label>
              <label>Unit<input type="text" maxLength={14} value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="e.g. mg" /></label>
            </div>
          )}
        </>
      )}
      {field === "goal" && (
        <>
          <label>
            <span>What did you work on today? <small className="field-hint">(optional)</small></span>
            <input type="text" maxLength={72} value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="e.g. Take a short walk" />
          </label>
          <div className="choices" role="group" aria-label="Goal result">
            <button type="button" aria-pressed={result === "done"} onClick={() => setResult("done")}>Done</button>
            <button type="button" aria-pressed={result === "tried"} onClick={() => setResult("tried")}>Worked on it</button>
          </div>
        </>
      )}
      <button className="button button-primary" type="submit" disabled={!valid}>Save log<Icon name="check" size={17} /></button>
    </form>
  );
}
