"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import { defaultMascot, getExpedition, mascots, referralClimbIndex, type MascotId } from "@/lib/data";
import {
  canPlacePass, chooseMascot, claimSummit, dateFrom, discountFor, dismissReferralWelcome, getInitialSnapshot, getSnapshot,
  isComplete, logCount, mondayOf, nextDemoDay, placePass, readExpedition, redeem,
  referralsUnlocked, resetDemo, saveCheckIn, subscribe, summitStamps, unlockDemoReferrals, weekClosed, weekCount,
  type DayLog, type Expedition,
} from "@/lib/progress";
import { DayEntries, Dialog, LogForm, ObjectiveBadge, objectiveSummary, objectives, type Objective } from "./check-in";
import { Badge, Icon, Mascot, StampSlots } from "./summit-ui";
import { MapBoard, PeakIcon } from "./trail-map";
import { RestDayPicker } from "./rest-day-picker";
import { MonthlyBreakdown, StampGuide, WeekBreakdown, WeekPanel } from "./progress-view";
import { Referrals, ReferralWelcome } from "./referrals";

const rules = getExpedition();
const { mountains, items, summitStampTarget } = rules;
const navigation = [
  ["today", "Today"], ["map", "Map"], ["rewards", "Rewards"], ["referrals", "Referrals"], ["profile", "Profile"],
] as const;
type Tab = (typeof navigation)[number][0];
type Toast = { message: string; title?: string };
type Sheet =
  | { type: "log"; field: Objective }
  | { type: "day"; date: string }
  | { type: "bonus" }
  | { type: "stamp-guide" }
  | { type: "stamps"; mountain: number }
  | { type: "pass" }
  | { type: "install" }
  | { type: "reset" };

const fullDate = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric" });
const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function positionNavPill(pill: HTMLSpanElement, button: HTMLButtonElement) {
  pill.style.width = `${button.offsetWidth}px`;
  pill.style.height = `${button.offsetHeight}px`;
  pill.style.transform = `translate(${button.offsetLeft}px, ${button.offsetTop}px)`;
}

function NavButtons({ active, referralUnread, onChange }: { active: Tab; referralUnread: boolean; onChange: (tab: Tab) => void }) {
  const navRef = useRef<HTMLElement>(null);
  const selectedRef = useRef<HTMLSpanElement>(null);
  const hoverRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const selected = selectedRef.current;
    const hover = hoverRef.current;
    if (!nav || !selected || !hover) return;

    const buttons = nav.querySelectorAll<HTMLButtonElement>("button");
    const activeButton = buttons[navigation.findIndex(([key]) => key === active)];
    const syncPills = () => {
      positionNavPill(selected, activeButton);
      const hoveredButton = nav.querySelector<HTMLButtonElement>("button:hover");
      if (hoveredButton && hover.hasAttribute("data-visible")) positionNavPill(hover, hoveredButton);
    };

    syncPills();
    if (!nav.hasAttribute("data-pills-ready")) {
      selected.getBoundingClientRect();
      nav.setAttribute("data-pills-ready", "");
    }
    const observer = new ResizeObserver(syncPills);
    observer.observe(nav);
    for (const button of buttons) observer.observe(button);
    return () => observer.disconnect();
  }, [active]);

  function showHover(button: HTMLButtonElement) {
    const hover = hoverRef.current;
    if (!hover) return;
    positionNavPill(hover, button);
    if (!hover.hasAttribute("data-visible")) {
      hover.getBoundingClientRect();
      hover.setAttribute("data-visible", "");
    }
  }

  function clearHover() {
    hoverRef.current?.removeAttribute("data-visible");
  }

  return (
    <nav className="app-nav" aria-label="Expedition" ref={navRef} onPointerLeave={clearHover} onPointerCancel={clearHover}>
      <span className="nav-pill nav-pill-hover" ref={hoverRef} aria-hidden="true" />
      <span className="nav-pill nav-pill-selected" ref={selectedRef} aria-hidden="true" />
      {navigation.map(([key, label]) => {
        const unread = key === "referrals" && referralUnread;
        return (
          <button type="button" key={key} aria-current={key === active ? "page" : undefined}
            aria-label={unread ? "Referrals, new unlock" : undefined} onClick={() => onChange(key)}
            onPointerEnter={(event) => { if (event.pointerType !== "touch") showHover(event.currentTarget); }}>
            <span><Icon name={key} size={21} />{unread && <span className="nav-unread-dot" aria-hidden="true" />}</span>{label}
          </button>
        );
      })}
    </nav>
  );
}

function Today({
  state, stamps, burstField, monthOpen, weekOffset, onToggleMonth, onOffset, onMap, onNextDay, onExplainStamps, onLog, onDay, onWeek,
}: {
  state: Expedition; stamps: number; burstField: Objective | null; monthOpen: boolean; weekOffset: number; onToggleMonth: () => void;
  onOffset: (offset: number) => void; onMap: () => void; onNextDay: () => void;
  onExplainStamps: () => void;
  onLog: (field: Objective) => void; onDay: (day: string) => void; onWeek: (monday: string) => void;
}) {
  const level = state.summitsReached;
  const seasonComplete = level === mountains.length;
  const mountIndex = Math.min(level, mountains.length - 1);
  const current = mountains[mountIndex];
  const ready = stamps === summitStampTarget;
  const logged = state.logs[state.today] ?? {};
  const complete = isComplete(logged);
  const monday = mondayOf(state.today);
  const qualifying = weekCount(state, monday);
  const daysToBonus = rules.weeklyBonusTarget - qualifying;
  let checkInMessage = "All done for today!";
  if (ready) checkInMessage = "Four stamps earned. Your summit is ready.";
  else if (!seasonComplete && qualifying >= rules.weeklyTarget) {
    checkInMessage = weekClosed(state, monday) ? "This week’s stamp is earned."
      : `Stamp secured for Sunday! ${daysToBonus} ${daysToBonus === 1 ? "day" : "days"} to the bonus.`;
  }

  return (
    <>
      <header className="page-heading">
        <div><p className="page-date"><Icon name="calendar" size={15} /> {fullDate.format(dateFrom(state.today))}</p><h1>Today</h1></div>
        <span className="page-heading-chip"><Icon name="flag" size={15} /> The Nine Summits</span>
      </header>
      <div className="today-grid">
        <div className="today-expedition">
          <section className="expedition-hero" aria-labelledby="hero-title">
            <div className="hero-content">
              <div className="hero-top">
                <span className="hero-kicker"><span className="brand-mark" aria-hidden="true" /> {seasonComplete ? "SEASON COMPLETE" : `SUMMIT ${String(mountIndex + 1).padStart(2, "0")} / 09`}</span>
                {!seasonComplete && <StampSlots count={stamps} target={summitStampTarget} onExplain={onExplainStamps} />}
              </div>
              <h2 id="hero-title">{current.name}</h2>
              <p>{ready ? "Your summit is ready" : seasonComplete ? "All nine summits reached" : "One stamp per qualifying week"}</p>
              <button className="hero-link" type="button" onClick={onMap}><Icon name="map" size={16} /> View route</button>
            </div>
            <div className="hero-sprite" aria-hidden="true"><Mascot id={state.mascot ?? defaultMascot} className="hero-mascot" /><i /></div>
          </section>

          <WeekPanel state={state} offset={weekOffset} onOffset={onOffset} onDay={onDay} />
        </div>

        <div className="today-check-ins">
          <section className="panel check-in-panel" data-complete={complete} aria-labelledby="check-in-title" id="check-in">
            <div className="panel-heading">
              <div><h2 id="check-in-title">Daily check-in</h2><p>{complete ? "Today’s check-in is complete" : "Log all three to earn a day on the trail."}</p></div>
              <div className="check-in-actions">
                {complete && (
                  <button className="demo-nudge check-in-next" type="button" onClick={onNextDay}
                    aria-label="Proceed to next day (demo)" title="Proceed to next day (demo)">
                    <Icon name="east" size={16} />
                  </button>
                )}
                <span className="log-count">{complete && <Icon name="check" size={14} />}{logCount(logged)} / 3</span>
              </div>
            </div>
            <div className="check-in-meter" aria-hidden="true">
              {objectives.map((objective) => <span key={objective.id} data-logged={logged[objective.id] !== undefined} />)}
            </div>
            <div className="objective-list">
              {objectives.map((objective) => {
                const summary = objectiveSummary(objective.id, logged);

                return (
                  <button key={objective.id} className="objective" data-color={objective.color} type="button" onClick={() => onLog(objective.id)} aria-label={`${summary ? "Edit" : "Log"} ${objective.title}`}>
                    <span className="objective-icon"><Icon name={objective.glyph} size={22} /></span>
                    <span className="objective-copy"><b>{objective.title}</b><span>{summary ?? objective.detail}</span></span>
                    <ObjectiveBadge filled={summary !== null} celebrate={summary !== null && burstField === objective.id} />
                  </button>
                );
              })}
            </div>
            <div className={`check-in-foot${complete ? " success" : ""}`}>
              <span className="check-in-status" role="status">
                <Icon name={complete ? "spark" : "shield"} size={17} /> {complete ? checkInMessage : "Any honest entry counts."}
              </span>
            </div>
          </section>
          <MonthlyBreakdown state={state} open={monthOpen} onToggle={onToggleMonth} onWeek={onWeek} />
        </div>
      </div>
    </>
  );
}

function ExpeditionMap({ state, stamps, selected, from, onSelect, onArrive }: {
  state: Expedition; stamps: number; selected: number; from: number | null;
  onSelect: (index: number) => void; onArrive: () => void;
}) {
  const level = state.summitsReached;
  const mountain = mountains[selected];
  const reached = selected < level;
  const current = selected === level;
  const finished = level === mountains.length;

  return (
    <>
      <header className="page-heading"><div><p className="page-date"><Icon name="flag" size={15} /> The Nine Summits</p><h1>Expedition map</h1></div><span className="page-heading-chip">{level} of {mountains.length} summits</span></header>
      <div className="map-grid">
        <MapBoard completed={level} selected={selected} from={from} mascot={state.mascot ?? defaultMascot} onSelect={onSelect} onArrive={onArrive} />
        <div className="map-details">
          <section className="panel summit-detail" data-state={reached ? "earned" : current ? "current" : "locked"} aria-label="Selected summit">
            <span className="summit-tag" data-open={reached || current}><Icon name={reached ? "check" : current ? "flag" : "lock"} size={14} /> {reached ? "Summit reached" : current ? "Next summit" : "Locked"}</span>
            <PeakIcon index={selected} className="summit-preview-peak" />
            <h2>{mountain.name}</h2><p>{mountain.region}</p>
            <div className="summit-reward"><b>{mountain.badge}</b><span>+{discountFor(1)}% recurring demo discount</span></div>
          </section>
          <div className="map-legend" aria-label="Map legend"><span><i /> Reached</span><span><i /> Next</span><span><i /> Locked</span></div>
          <section className="panel season-note">
            <div className="season-copy">
              <h2><span className="brand-mark" aria-hidden="true" />{finished ? "Mountain season complete" : "Mountain season"}</h2>
              <p>{finished ? "Rainforests are planned for the next season." : `Four weekly stamps earn a summit. Finish all nine for ${discountFor(mountains.length)}% off in the demo.`}</p>
            </div>
            {!finished && <StampSlots count={stamps} target={summitStampTarget} />}
          </section>
        </div>
      </div>
    </>
  );
}

function RewardsStore({ state, onRedeem, onPass }: {
  state: Expedition; onRedeem: (item: keyof typeof items) => void; onPass: () => void;
}) {
  return (
    <>
      <header className="page-heading"><div><p className="page-date"><Icon name="coin" size={15} /> Expedition shop</p><h1>Rewards</h1></div></header>
      <section className="wallet-hero" aria-label="Points balance">
        <div><span>YOUR BALANCE</span><strong>{state.points}<small> pts</small></strong><p>Earn {rules.weeklyPoints} points for {rules.weeklyBonusTarget} qualifying days in a week.</p></div>
        <div className="wallet-emblem"><Icon name="coin" size={76} /></div>
      </section>
      <div className="store-grid">
        <article className="store-card pass-card">
          <div className="store-card-graphic"><span className="pass-icon"><Icon name="shield" size={42} /></span></div>
          <div className="store-card-copy"><h2>{items.pass.name}</h2><p>Cover one missed day toward your weekly stamp and points bonus.</p>
            <button className="button button-primary" type="button" disabled={state.points < items.pass.price} onClick={() => onRedeem("pass")} aria-label={`Redeem Rest Day Pass for ${items.pass.price} points`}><Icon name="coin" size={17} /> {items.pass.price} pts <Icon name="east" size={17} /></button></div>
        </article>
        <article className="store-card voucher-card">
          <div className="store-card-graphic"><span className="voucher-ticket">20<small>%</small></span></div>
          <div className="store-card-copy"><h2>One-month discount</h2><p>Redeem a demo coupon for 20% off one month of the subscription.</p>
            <button className="button button-primary" type="button" disabled={state.points < items.voucher.price} onClick={() => onRedeem("voucher")} aria-label={`Redeem one-month discount for ${items.voucher.price} points`}><Icon name="coin" size={17} /> {items.voucher.price} pts <Icon name="east" size={17} /></button></div>
        </article>
      </div>
      <section className="panel inventory">
        <div className="panel-heading"><h2>Your inventory</h2></div>
        <div className="inventory-items">
          <button className="inventory-slot" type="button" onClick={onPass} aria-label={`Rest Day Passes, ${state.passes} available. Choose a day`}>
            <span className="inventory-art"><Icon name="shield" size={24} /></span>
            <span className="inventory-copy"><b>Rest Day Pass</b><span>Choose a day</span></span>
            <span className="inventory-quantity">{state.passes}</span>
          </button>
          <div className="inventory-slot inventory-slot-ticket">
            <span className="inventory-art"><Icon name="ticket" size={23} /></span>
            <span className="inventory-copy"><b>20% month coupon</b><span>{state.vouchers ? "Demo coupon ready" : "None redeemed"}</span></span>
            <span className="inventory-quantity">{state.vouchers}</span>
          </div>
        </div>
      </section>
    </>
  );
}

function Profile({ state, onDay, onReset, onInstall, onSummit, onMascot }: {
  state: Expedition; onDay: () => void; onReset: () => void; onInstall: () => void; onSummit: (index: number) => void; onMascot: (id: MascotId) => void;
}) {
  const level = state.summitsReached;
  const rank = mountains[level - 1];
  return (
    <>
      <header className="page-heading"><div><p className="page-date"><Icon name="spark" size={15} /> Expedition journal</p><h1>Profile</h1></div></header>
      <div className="profile-grid">
        <section className="profile-hero" style={{ "--rank-hue": level * 11 + "deg" } as CSSProperties}>
          <div className="profile-crest"><Badge level={level} size={184} shine /></div>
          <span className="rank-chip">LEVEL {String(level).padStart(2, "0")}</span>
          <h2>{rank.badge}</h2><p>{level} of {mountains.length} summits reached</p>
          <div className="profile-benefit"><Icon name="ticket" size={20} /> <b>{discountFor(level)}%</b> recurring demo discount</div>
        </section>
        <fieldset className="panel companion-settings">
          <legend className="sr-only">Trail companion</legend>
          <div className="panel-heading"><div><h2>Trail companion</h2><p>Choose who joins you on the route.</p></div></div>
          <div className="companion-choices">
            {mascots.map((mascot) => (
              <label className="companion-tile" key={mascot.id}>
                <input className="sr-only" type="radio" name="trail-companion" checked={(state.mascot ?? defaultMascot) === mascot.id} onChange={() => onMascot(mascot.id)} />
                <Mascot id={mascot.id} className="companion-preview" />
                <span className="companion-name">{mascot.name}</span>
                <span className="companion-selected" aria-hidden="true"><Icon name="check" size={12} /></span>
              </label>
            ))}
          </div>
        </fieldset>
        <section className="panel achievements">
          <div className="panel-heading"><div><h2>Badge collection</h2><p>A new crest for every summit.</p></div><span className="log-count">{level} / {mountains.length}</span></div>
          <div className="badge-grid">
            {mountains.map((mountain, index) => (
              <button className="badge-tile" data-earned={index < level} key={mountain.name} onClick={() => onSummit(index)} type="button" aria-label={`${mountain.badge}, ${index < level ? "earned" : "locked"}`}>
                <Badge level={index + 1} size={62} />
                <span>{mountain.name}</span>
                {index >= level && <Icon name="lock" size={12} />}
              </button>
            ))}
          </div>
        </section>
        <section className="panel demo-settings">
          <div className="panel-heading"><div><h2>Demo controls</h2><p>Advance the example calendar with your achievements intact.</p></div></div>
          <button className="settings-row" type="button" onClick={onDay}><Icon name="east" /><span>Preview next day</span><Icon name="right" size={17} /></button>
          <button className="settings-row" type="button" onClick={onInstall}><Icon name="install" /><span>Add to Home Screen</span><Icon name="right" size={17} /></button>
          <button className="settings-row" type="button" onClick={onReset}><Icon name="reset" /><span>Reset demo progress</span><Icon name="right" size={17} /></button>
        </section>
      </div>
    </>
  );
}

export default function Page() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getInitialSnapshot);
  const state = readExpedition(snapshot);
  const [tab, setTab] = useState<Tab>("today");
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOpen, setMonthOpen] = useState(false);
  const [reportWeek, setReportWeek] = useState<string | null>(null);
  const reportOrigin = useRef<{ monday: string; scroll: number } | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [badgeBurst, setBadgeBurst] = useState<{ day: string; field: Objective } | null>(null);
  const [selection, setSelection] = useState<number | null>(null);
  const [travelFrom, setTravelFrom] = useState<number | null>(null);
  const finishTravel = useCallback(() => setTravelFrom(null), [setTravelFrom]);
  const level = state.summitsReached;
  const current = Math.min(level, mountains.length - 1);
  const stamps = summitStamps(state);
  const summitReady = stamps === summitStampTarget;
  const bonusVisible = sheet?.type === "bonus";
  const burstField = badgeBurst?.day === state.today ? badgeBurst.field : null;
  const showSummitReveal = tab === "today" && !reportWeek && (!sheet || bonusVisible) && summitReady && !burstField;

  useEffect(() => {
    if (!toast?.title) return;
    const timeout = window.setTimeout(() => setToast(null), 6500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!badgeBurst) return;
    const timeout = window.setTimeout(() => setBadgeBurst(null), 620);
    return () => window.clearTimeout(timeout);
  }, [badgeBurst]);

  function navigate(next: Tab) {
    setTab(next);
    setReportWeek(null);
    setToast(null);
    setBadgeBurst(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function previewNextDay() {
    nextDemoDay();
    setWeekOffset(0);
    navigate("today");
  }

  function showWeek(monday: string) {
    reportOrigin.current = { monday, scroll: window.scrollY };
    setReportWeek(monday);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function returnToMonth() {
    const origin = reportOrigin.current;
    setReportWeek(null);
    if (!origin) return;
    window.requestAnimationFrame(() => {
      document.getElementById(`month-week-${origin.monday}`)?.focus({ preventScroll: true });
      window.scrollTo({ top: origin.scroll, behavior: "instant" });
    });
  }

  function map(index: number = current) {
    setSelection(index);
    navigate("map");
  }

  function demoUnlockReferrals() {
    unlockDemoReferrals();
    setSelection(null);
    setTravelFrom(null);
  }

  function showNewRoute() {
    if (!summitReady) return;
    map();
    setSheet({ type: "stamps", mountain: current });
  }

  function finishSummit(mountain: number) {
    const earned = claimSummit(mountain);
    close();
    if (earned === null) return;
    setWeekOffset(0);
    const next = mountains[earned + 1];
    setSelection(next ? earned + 1 : earned);
    if (next && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) setTravelFrom(earned);
    setToast({ message: next ? `${mountains[earned].name} claimed. ${next.name} is open.` : "Mountain season complete." });
  }

  function announceBonus(bonus: boolean) {
    setSheet(bonus ? { type: "bonus" } : null);
  }

  function saveLog(day: string, field: Objective, patch: DayLog) {
    const before = readExpedition(getSnapshot());
    if (before.today !== day) {
      close();
      return;
    }
    const { bonus, completed } = saveCheckIn(day, patch);
    if (before.logs[day]?.[field] === undefined && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setBadgeBurst({ day, field });
    }
    announceBonus(bonus);
    if (completed && !bonus) {
      const qualifying = weekCount(readExpedition(getSnapshot()), mondayOf(day));
      const days = qualifying === 1 ? "day" : "days";
      setToast({ title: "Day complete!", message: `${qualifying} qualifying ${days} this week` });
    }
  }

  function applyPass(day: string) {
    const reward = placePass(day);
    if (!reward.applied) return;
    if (!summitReady && summitStamps(readExpedition(getSnapshot())) === summitStampTarget) navigate("today");
    announceBonus(reward.bonus);
    if (!reward.bonus) setToast({ message: `Rest Day Pass applied to ${shortDate.format(dateFrom(day))}.` });
  }

  function buy(item: keyof typeof items) {
    if (redeem(item)) setToast({ message: item === "pass" ? "Rest Day Pass added to your inventory." : "20% demo coupon added to your inventory." });
  }

  const close = () => setSheet(null);

  return (
    <>
      <header className="app-header">
        <div className="app-bar">
          <button className="brand" type="button" onClick={() => navigate("today")} aria-label="Summit home"><span className="brand-tile" aria-hidden="true"><span className="brand-mark" /></span>SUMMIT</button>
          <NavButtons active={tab} referralUnread={Boolean(state.referralWelcomePending)} onChange={navigate} />
          <div className="header-actions">
            <button className="points-pill" type="button" onClick={() => navigate("rewards")} aria-label={`Rewards, ${state.points} points`}><Icon name="coin" size={17} /> <b>{state.points}</b><span>pts</span></button>
            <button className="crest-button" type="button" style={{ "--crest-shadow": mountains[level - 1].crestShadow } as CSSProperties} onClick={() => navigate("profile")} aria-label={`Profile, level ${level}`}><Badge level={level} size={42} shine /></button>
          </div>
        </div>
      </header>

      <main className="shell" id="main">
        {tab === "today" && (reportWeek
          ? <WeekBreakdown key={reportWeek} state={state} monday={reportWeek} onBack={returnToMonth} />
          : <Today state={state} stamps={stamps} burstField={burstField} monthOpen={monthOpen} weekOffset={weekOffset} onToggleMonth={() => setMonthOpen((open) => !open)} onOffset={setWeekOffset} onMap={() => map()} onNextDay={previewNextDay} onExplainStamps={() => setSheet({ type: "stamp-guide" })} onLog={(field) => setSheet({ type: "log", field })} onDay={(date) => setSheet({ type: "day", date })} onWeek={showWeek} />)}
        {tab === "map" && <ExpeditionMap state={state} stamps={stamps} selected={selection ?? current} from={travelFrom} onSelect={setSelection} onArrive={finishTravel} />}
        {tab === "rewards" && <RewardsStore state={state} onRedeem={buy} onPass={() => setSheet({ type: "pass" })} />}
        {tab === "referrals" && <Referrals level={level} unlocked={referralsUnlocked(state)} onSummit={() => map(referralClimbIndex)} onUnlock={demoUnlockReferrals} />}
        {tab === "profile" && <Profile state={state} onMascot={chooseMascot} onSummit={map} onDay={previewNextDay} onReset={() => setSheet({ type: "reset" })} onInstall={() => setSheet({ type: "install" })} />}
      </main>

      {toast && !showSummitReveal && !burstField && (
        <div className={`toast${toast.title ? " daily-toast" : ""}`} role="status">
          <span className="toast-mark"><Icon name="check" size={18} /></span>
          <div className="toast-message">{toast.title && <strong>{toast.title}</strong>}{toast.message}</div>
          <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="close" size={16} /></button>
        </div>
      )}

      {sheet?.type === "log" && (
        <Dialog key={sheet.field} title={`Log ${objectives.find((objective) => objective.id === sheet.field)?.title.toLowerCase()}`} onClose={close}>
          <LogForm field={sheet.field} log={state.logs[state.today] ?? {}} onSave={(patch) => saveLog(state.today, sheet.field, patch)} />
        </Dialog>
      )}

      {sheet?.type === "day" && (
        <Dialog title={fullDate.format(dateFrom(sheet.date))} onClose={close}>
          <DayEntries log={state.logs[sheet.date] ?? {}} />
          {state.protectedDays.includes(sheet.date) && <p className="sheet-note"><Icon name="shield" size={17} /> Protected for the weekly reward.</p>}
          {state.passes > 0 && canPlacePass(state, sheet.date) && (
            <button className="button button-primary" type="button" onClick={() => applyPass(sheet.date)}><Icon name="shield" size={18} /> Use Rest Day Pass</button>
          )}
        </Dialog>
      )}

      {sheet?.type === "pass" && (
        <Dialog title="Rest Day Pass" onClose={close}>
          <RestDayPicker state={state} onApply={applyPass} />
        </Dialog>
      )}

      {sheet?.type === "stamp-guide" && <StampGuide count={stamps} onClose={close} />}

      {tab === "referrals" && state.referralWelcomePending && <ReferralWelcome onClose={dismissReferralWelcome} />}

      {sheet?.type === "stamps" && (
        <Dialog title="Summit stamps earned" onClose={() => finishSummit(sheet.mountain)} variant="reward">
          <div className="stamp-sheet-visual"><StampSlots count={stamps} target={summitStampTarget} /></div>
          <div className="reward-copy">
            <h3>{mountains[sheet.mountain].name} is ready</h3>
            <p>{mountains[sheet.mountain + 1]
              ? `Claim your crest and open the trail to ${mountains[sheet.mountain + 1].name}.`
              : "Claim your final crest and complete the mountain season."}</p>
          </div>
          <button className="button button-primary" type="button" disabled={!summitReady || sheet.mountain !== level} onClick={() => finishSummit(sheet.mountain)}>
            Redeem {summitStampTarget} stamps <Icon name="east" size={18} />
          </button>
        </Dialog>
      )}

      {(showSummitReveal || (bonusVisible && !burstField)) && (
        <Dialog key={showSummitReveal ? "summit" : "bonus"} title={showSummitReveal ? "Summit reached!" : "Perfect week!"} onClose={showSummitReveal ? () => finishSummit(current) : close} variant="reward">
          <div className="achievement-reveal">
            <div className="reward-rays" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <i key={index} style={{ "--spark-angle": `${index * 36}deg`, "--spark-delay": `${(index % 3) * 75}ms` } as CSSProperties} />)}</div>
            {showSummitReveal ? <Badge level={current + 1} size={158} shine /> : <div className="reward-emblem"><Icon name="coin" size={74} /></div>}
          </div>
          <div className="reward-copy">
            <h3>{showSummitReveal ? mountains[current].badge : `+${rules.weeklyPoints} points`}</h3>
            <p>{showSummitReveal ? `${mountains[current].name} · Crest ready to claim` : "Seven qualifying days in one week."}</p>
            {showSummitReveal && (
              <div className="reward-tags">
                <span><Icon name="ticket" size={16} /> +{discountFor(1)}% recurring</span>
                {bonusVisible && <span><Icon name="coin" size={16} /> +{rules.weeklyPoints} pts earned</span>}
                {current + 1 === referralClimbIndex && <span><Icon name="referrals" size={16} /> Unlocks Referrals</span>}
              </div>
            )}
          </div>
          <button className="button button-primary" type="button" onClick={() => {
            if (showSummitReveal) showNewRoute();
            else {
              close();
              navigate("rewards");
            }
          }}>{showSummitReveal ? "See your new route" : "View rewards"} <Icon name="east" size={18} /></button>
        </Dialog>
      )}

      {sheet?.type === "install" && <Dialog title="Add to Home Screen" onClose={close}><p className="sheet-note">Open your browser’s share menu or app menu and choose Add to Home Screen or Install, if offered.</p></Dialog>}
      {sheet?.type === "reset" && (
        <Dialog title="Reset demo progress?" onClose={close}>
          <p className="sheet-note">This clears your local logs, points, and rewards and restores the example expedition.</p>
          <button className="button button-primary" type="button" onClick={() => { resetDemo(); close(); setSelection(null); setTravelFrom(null); setWeekOffset(0); navigate("today"); }}>Reset to example</button>
        </Dialog>
      )}
    </>
  );
}
