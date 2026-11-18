import { useEffect, useRef, useState } from "react";
import { getExpedition } from "@/lib/data";
import {
  addDays, dateFrom, isComplete, logCount, mondayOf, monthOf, monthWeekStarts, weekClosed, weekCount, weekDays, weekDayState,
  type Expedition,
} from "@/lib/progress";
import { DayEntries, objectives } from "./check-in";
import { Icon } from "./summit-ui";

const { weeklyTarget, weeklyPoints, weeklyBonusTarget } = getExpedition();
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const longDate = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric" });
const monthTitle = new Intl.DateTimeFormat("en-US", { month: "long" });

function weekRange(monday: string) {
  const sunday = addDays(monday, 6);
  const end = monthOf(sunday) === monthOf(monday) ? dateFrom(sunday).getDate() : shortDate.format(dateFrom(sunday));
  return `${shortDate.format(dateFrom(monday))}–${end}`;
}

function weekStatus(state: Expedition, monday: string, count: number) {
  if (weekClosed(state, monday) && count >= weeklyTarget) return "Qualified";
  if (monday > state.today) return "Upcoming";
  return monday === mondayOf(state.today) ? "In progress" : "Ended";
}

function WeekBody({ state, monday, onDay }: { state: Expedition; monday: string; onDay: (date: string) => void }) {
  const count = weekCount(state, monday);
  const earned = state.rewardedWeeks.includes(monday);
  const qualified = weekClosed(state, monday) && count >= weeklyTarget;

  return (
    <>
      <div className="day-strip">
        {weekDays(monday).map((day, index) => {
          const status = weekDayState(state, day);
          const mark = status === "complete" ? "check" : status === "protected" ? "shield" : undefined;

          return (
            <button className="week-day" type="button" key={day} data-state={status} data-today={day === state.today} disabled={status === "upcoming"}
              aria-label={`${longDate.format(dateFrom(day))}, ${status}`} onClick={() => onDay(day)}>
              <span>{weekdays[index]}</span>
              <b>{mark ? <Icon name={mark} size={17} /> : dateFrom(day).getDate()}</b>
            </button>
          );
        })}
      </div>
      <div className="week-summary">
        <span className="week-qualifying" data-earned={qualified}>
          <Icon name={qualified ? "check" : "flag"} size={14} /> <b>{Math.min(count, weeklyTarget)}/{weeklyTarget}</b> qualifying days
        </span>
        <span className={earned ? "week-reward is-earned" : "week-reward"}>
          <Icon name={earned ? "check" : "coin"} size={15} /> {earned ? `${weeklyPoints} pts earned` : `+${weeklyPoints} pts at ${weeklyBonusTarget} days`}
        </span>
      </div>
    </>
  );
}

function MonthBody({ state, onWeek }: { state: Expedition; onWeek: (date: string) => void }) {
  const weeks = monthWeekStarts(state.today).map((monday) => ({ monday, count: weekCount(state, monday) }));
  const qualified = weeks.filter(({ monday, count }) => weekStatus(state, monday, count) === "Qualified").length;

  return (
    <div className="month-overview">
      <p className="month-week-count"><Icon name="flag" size={14} /> {qualified} of {weeks.length} weeks qualified</p>
      <div className="month-weeks">
        {weeks.map(({ monday, count }) => {
          const status = weekStatus(state, monday, count);
          const range = weekRange(monday);

          return (
            <button className="month-week" data-status={status} type="button" id={`month-week-${monday}`} key={monday} onClick={() => onWeek(monday)}
              aria-label={`${range}, ${count} qualifying days, ${status}. View breakdown`}>
              <span className="month-week-dates"><b>{range}</b><span>{status}</span></span>
              <span className="month-mini-week" aria-hidden="true">
                {weekDays(monday).map((day) => <i key={day} data-state={weekDayState(state, day)} />)}
              </span>
              <b className="month-week-tally">{Math.min(count, weeklyTarget)}/{weeklyTarget}</b>
              <Icon name="right" size={16} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function WeekPanel({ state, offset, onOffset, onDay }: {
  state: Expedition;
  offset: number;
  onOffset: (offset: number) => void;
  onDay: (date: string) => void;
}) {
  const monday = addDays(mondayOf(state.today), offset * 7);

  return (
    <section className="panel week-panel" aria-labelledby="week-title">
      <div className="panel-heading">
        <div>
          <h2 id="week-title">{offset === 0 ? "This week" : "Last week"}</h2>
          <p>{weekRange(monday)}</p>
        </div>
        <div className="week-controls" role="group" aria-label="Browse weeks">
          <button className="icon-button" type="button" aria-label="Previous week" onClick={() => onOffset(-1)} disabled={offset === -1}><Icon name="left" size={16} /></button>
          <button className="icon-button" type="button" aria-label="Current week" onClick={() => onOffset(0)} disabled={offset === 0}><Icon name="right" size={16} /></button>
        </div>
      </div>
      <WeekBody state={state} monday={monday} onDay={onDay} />
    </section>
  );
}

export function MonthlyBreakdown({ state, open, onToggle, onWeek }: {
  state: Expedition;
  open: boolean;
  onToggle: () => void;
  onWeek: (monday: string) => void;
}) {
  return (
    <section className="panel monthly-panel" aria-labelledby="monthly-title">
      <h2 id="monthly-title">
        <button className="monthly-trigger" type="button" aria-expanded={open} aria-controls="monthly-body" onClick={onToggle}>
          <span className="monthly-trigger-title"><Icon name="calendar" size={19} /> Monthly breakdown</span>
          <span className="monthly-trigger-month" aria-hidden="true">{monthTitle.format(dateFrom(state.today))}</span>
          <span className="monthly-trigger-arrow"><Icon name="right" size={16} /></span>
        </button>
      </h2>
      <div id="monthly-body" hidden={!open}>
        {open && <MonthBody state={state} onWeek={onWeek} />}
      </div>
    </section>
  );
}

const dayStatus = {
  complete: "All logs complete",
  protected: "Covered by Rest Day Pass",
  today: "In progress",
  missed: "Check-in incomplete",
  upcoming: "Upcoming",
};

export function WeekBreakdown({ state, monday, onBack }: { state: Expedition; monday: string; onBack: () => void }) {
  const days = weekDays(monday);
  const [selected, setSelected] = useState(() => days.includes(state.today)
    ? state.today
    : [...days].reverse().find((day) => state.logs[day] || state.protectedDays.includes(day)) ?? monday);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  const qualifying = weekCount(state, monday);
  const recorded = days.filter((day) => day <= state.today && isComplete(state.logs[day])).length;
  const covered = days.filter((day) => day <= state.today && state.protectedDays.includes(day) && !isComplete(state.logs[day])).length;
  const earned = state.rewardedWeeks.includes(monday);
  const selectedStatus = weekDayState(state, selected);

  return (
    <>
      <button className="progress-back" type="button" onClick={onBack}><Icon name="left" size={16} /> Monthly breakdown</button>
      <header className="page-heading report-heading">
        <div>
          <p className="page-date"><Icon name="calendar" size={15} /> {weekRange(monday)}</p>
          <h1 ref={heading} tabIndex={-1}>Week breakdown</h1>
        </div>
        <span className="page-heading-chip">{weekStatus(state, monday, qualifying)}</span>
      </header>
      <div className="week-report">
        <section className="panel week-chart-panel" aria-labelledby="report-chart-title">
          <div className="panel-heading">
            <div><h2 id="report-chart-title">Daily logs</h2><p>Choose a day to see its entries.</p></div>
            {earned && <span className="week-reward is-earned"><Icon name="check" size={14} /> +{weeklyPoints} pts</span>}
          </div>
          <div className="log-chart">
            <div className="chart-scale" aria-hidden="true"><span>3</span><span>2</span><span>1</span><span>0</span></div>
            <div className="chart-days" role="group" aria-label="Daily log chart">
              {days.map((day, index) => {
                const log = state.logs[day];
                const count = logCount(log);
                const status = weekDayState(state, day);

                return (
                  <button className="chart-day" key={day} type="button" aria-pressed={selected === day}
                    aria-label={`${longDate.format(dateFrom(day))}, ${count} of ${objectives.length} logs, ${dayStatus[status]}`}
                    onClick={() => setSelected(day)}>
                    <span className="chart-stack" aria-hidden="true">
                      {objectives.map(({ id, color }) => log?.[id] !== undefined && <span className="chart-segment" data-color={color} key={id} />)}
                      {count === 0 && <span className="chart-empty" data-protected={status === "protected"}>{status === "protected" && <Icon name="shield" size={13} />}</span>}
                    </span>
                    <span className="chart-day-label">{weekdays[index]}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="chart-legend">
            {objectives.map(({ id, title, color }) => <span key={id}><i data-color={color} /> {title}</span>)}
          </div>
        </section>

        <div className="report-side">
          <section className="panel report-totals" aria-labelledby="report-totals-title">
            <div className="panel-heading"><h2 id="report-totals-title">Week progress</h2></div>
            <div className="report-numbers">
              <div><b>{Math.min(qualifying, weeklyTarget)}/{weeklyTarget}</b><span>Qualifying days</span></div>
              <div><b>{recorded}/7</b><span>Full check-ins</span></div>
            </div>
            {covered > 0 && <p className="report-pass"><Icon name="shield" size={15} /> {covered} {covered === 1 ? "day" : "days"} covered by a pass</p>}
          </section>

          <section className="panel report-entries" aria-labelledby="report-date-title" aria-live="polite">
            <div className="panel-heading">
              <div><h2 id="report-date-title">{longDate.format(dateFrom(selected))}</h2><p>{dayStatus[selectedStatus]}</p></div>
              <span className="log-count">{logCount(state.logs[selected])} / {objectives.length}</span>
            </div>
            <DayEntries log={state.logs[selected] ?? {}} />
          </section>
        </div>
      </div>
    </>
  );
}
