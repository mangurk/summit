import { useState } from "react";
import { getExpedition } from "@/lib/data";
import {
  addDays, canPlacePass, dateFrom, mondayOf, weekCount, weekDays, weekDayState, type Expedition,
} from "@/lib/progress";
import { Icon } from "./summit-ui";

const rules = getExpedition();
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const shortDate = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
const fullDate = new Intl.DateTimeFormat("en", { weekday: "long", month: "short", day: "numeric" });

export function RestDayPicker({ state, onApply }: { state: Expedition; onApply: (day: string) => void }) {
  const current = mondayOf(state.today);
  const [offset, setOffset] = useState(() => weekDays(current).some((day) => canPlacePass(state, day)) ? 0 : -1);
  const [selection, setSelection] = useState<string | null>(null);
  const monday = addDays(current, offset * 7);
  const days = weekDays(monday);
  const count = weekCount(state, monday);
  const hasEligibleDay = days.some((day) => canPlacePass(state, day));
  const hasPass = state.passes > 0;
  const canApply = selection !== null && hasPass && canPlacePass(state, selection);

  function changeWeek(next: number) {
    setOffset(next);
    setSelection(null);
  }

  return (
    <div className="pass-picker">
      <div className="pass-picker-intro">
        <span className="inventory-art"><Icon name="shield" size={24} /></span>
        <p>Cover one missed day toward the weekly goal.</p>
        <b>{state.passes} available</b>
      </div>
      <div className="pass-calendar">
        <div className="panel-heading">
          <div><h3>{offset === 0 ? "This week" : "Last week"}</h3><p>{shortDate.format(dateFrom(monday))}–{shortDate.format(dateFrom(days[6]))}</p></div>
          <div className="week-controls">
            <button className="icon-button" type="button" aria-label="Previous week" disabled={offset === -1} onClick={() => changeWeek(-1)}><Icon name="left" size={16} /></button>
            <button className="icon-button" type="button" aria-label="Current week" disabled={offset === 0} onClick={() => changeWeek(0)}><Icon name="right" size={16} /></button>
          </div>
        </div>
        <div className="day-strip" role="group" aria-label="Choose a day to cover">
          {days.map((day, index) => {
            const status = weekDayState(state, day);
            const eligible = canPlacePass(state, day);
            return (
              <button
                className="week-day picker-day" key={day} type="button" data-state={status} data-eligible={eligible}
                aria-label={`${fullDate.format(dateFrom(day))}, ${eligible ? "available" : status}`}
                aria-pressed={selection === day} disabled={!eligible || !hasPass} onClick={() => setSelection(day)}
              >
                <span>{weekdays[index]}</span>
                <b>{status === "complete" ? <Icon name="check" size={16} /> : status === "protected" ? <Icon name="shield" size={15} /> : dateFrom(day).getDate()}</b>
              </button>
            );
          })}
        </div>
        <div className="pass-calendar-footer"><b>{Math.min(count, rules.weeklyTarget)}/{rules.weeklyTarget} qualifying days</b><span>{state.rewardedWeeks.includes(monday) ? "Weekly bonus earned" : `+${rules.weeklyPoints} pts at ${rules.weeklyBonusTarget} days`}</span></div>
      </div>
      {!hasPass && <p className="sheet-note">Redeem a Rest Day Pass in the shop first.</p>}
      {hasPass && !hasEligibleDay && <p className="sheet-note">This week has no missed days to cover.</p>}
      <button
        className="button button-primary" type="button" disabled={!canApply}
        onClick={() => { if (selection !== null && canApply) onApply(selection); }}
      >
        <Icon name="shield" size={17} /> {canApply ? `Use pass on ${shortDate.format(dateFrom(selection))}` : "Apply Rest Day Pass"}
      </button>
    </div>
  );
}
