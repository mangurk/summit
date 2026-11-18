import { defaultMascot, demoReferralPoints, getExpedition, referralClimbIndex, type MascotId } from "./data";

const rules = getExpedition();
const storeKey = "summit:expedition:v1";
const changeEvent = "summit:change";

export type MedicationLog = { status: "taken" | "missed" | "none"; dose: string; unit: string };
export type GoalLog = { name: string; result: "done" | "tried" };
export type DayLog = { drinks?: number; medication?: MedicationLog; goal?: GoalLog };

export type Expedition = {
  today: string;
  mascot?: MascotId;
  logs: Record<string, DayLog>;
  protectedDays: string[];
  rewardedWeeks: string[];
  summitsReached: number;
  climbStartWeek: string;
  points: number;
  demoReferralsUnlocked?: true;
  referralPointsAwarded?: true;
  passes: number;
  vouchers: number;
};

type LegacyExpedition = Omit<Expedition, "summitsReached" | "climbStartWeek"> & { clearedMonths: string[] };

export function dateFrom(day: string) {
  return new Date(day + "T12:00:00");
}

export function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function addDays(day: string, amount: number) {
  const date = dateFrom(day);
  date.setDate(date.getDate() + amount);
  return dateKey(date);
}

export function mondayOf(day: string) {
  return addDays(day, -((dateFrom(day).getDay() + 6) % 7));
}

export function weekDays(monday: string) {
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function monthOf(day: string) {
  return day.slice(0, 7);
}

export function monthWeekStarts(day: string) {
  const first = monthOf(day) + "-01";
  const last = dateFrom(first);
  last.setMonth(last.getMonth() + 1, 0);
  const lastDay = dateKey(last);
  const weeks: string[] = [];
  for (let monday = mondayOf(first); monday <= lastDay; monday = addDays(monday, 7)) {
    weeks.push(monday);
  }
  return weeks;
}

export function logCount(log: DayLog = {}) {
  return Number(log.drinks !== undefined) + Number(Boolean(log.medication)) + Number(Boolean(log.goal));
}

export function isComplete(log?: DayLog) {
  return logCount(log) === 3;
}

export function weekDayState(state: Expedition, day: string) {
  if (isComplete(state.logs[day])) return "complete";
  if (state.protectedDays.includes(day)) return "protected";
  if (day === state.today) return "today";
  return day < state.today ? "missed" : "upcoming";
}

export function weekCount(state: Expedition, monday: string) {
  return weekDays(monday).filter((day) => day <= state.today && (isComplete(state.logs[day]) || state.protectedDays.includes(day))).length;
}

export function weekClosed(state: Expedition, monday: string) {
  const sunday = addDays(monday, 6);
  // A Sunday check-in can settle the week immediately because the last day is complete.
  return sunday < state.today || (sunday === state.today && isComplete(state.logs[sunday]));
}

export function summitStamps(state: Expedition) {
  if (state.summitsReached >= rules.mountains.length) return 0;
  const weeks = new Set([...Object.keys(state.logs), ...state.protectedDays].map(mondayOf));
  const qualified = [...weeks].filter((monday) =>
    monday >= state.climbStartWeek && weekClosed(state, monday) && weekCount(state, monday) >= rules.weeklyTarget);
  return Math.min(qualified.length, rules.summitStampTarget);
}

export function discountFor(level: number) {
  return ((level * rules.discountTenths) / 10).toFixed(1);
}

function exampleLog(): DayLog {
  return { drinks: 0, medication: { status: "none", dose: "", unit: "" }, goal: { name: "Take a short walk", result: "done" } };
}

const initialState: Expedition = {
  today: rules.previewDate,
  mascot: defaultMascot,
  logs: Object.fromEntries(rules.previewWeeks.flatMap(({ monday, loggedDays }) =>
    loggedDays.map((offset) => [addDays(monday, offset), exampleLog()]))),
  protectedDays: [],
  rewardedWeeks: rules.previewWeeks.filter(({ loggedDays }) => loggedDays.length >= rules.weeklyBonusTarget).map(({ monday }) => monday),
  summitsReached: 1,
  climbStartWeek: rules.previewWeeks[0].monday,
  points: rules.initialPoints,
  passes: 0,
  vouchers: 0,
};

const seed = JSON.stringify(initialState);
let memory: string | undefined;

export function getInitialSnapshot() {
  return seed;
}

export function getSnapshot() {
  try {
    return localStorage.getItem(storeKey) ?? memory ?? seed;
  } catch {
    return memory ?? seed;
  }
}

export function referralsUnlocked(state: Expedition) {
  return state.demoReferralsUnlocked === true || state.summitsReached >= referralClimbIndex;
}

function creditDemoReferrals(state: Expedition): Expedition {
  if (state.referralPointsAwarded || !referralsUnlocked(state)) return state;
  return { ...state, points: state.points + demoReferralPoints, referralPointsAwarded: true };
}

export function readExpedition(snapshot: string) {
  const saved = JSON.parse(snapshot) as Expedition | LegacyExpedition;
  if ("clearedMonths" in saved) {
    const { clearedMonths, ...state } = saved;
    return creditDemoReferrals({ ...state, summitsReached: clearedMonths.length, climbStartWeek: mondayOf(state.today) });
  }
  return creditDemoReferrals(saved);
}

export function subscribe(callback: () => void) {
  window.addEventListener(changeEvent, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(changeEvent, callback);
    window.removeEventListener("storage", callback);
  };
}

function update(change: (state: Expedition) => Expedition) {
  const state = creditDemoReferrals(change(readExpedition(getSnapshot())));
  memory = JSON.stringify(state);
  try {
    localStorage.setItem(storeKey, memory);
  } catch {
    // The expedition can still run in this tab when storage is unavailable.
  }
  window.dispatchEvent(new Event(changeEvent));
}

function creditWeeklyBonus(state: Expedition, monday: string) {
  if (state.rewardedWeeks.includes(monday) || !weekClosed(state, monday) || weekCount(state, monday) < rules.weeklyBonusTarget) return state;
  return {
    ...state,
    points: state.points + rules.weeklyPoints,
    rewardedWeeks: [...state.rewardedWeeks, monday],
  };
}

export function saveCheckIn(day: string, patch: DayLog) {
  let result = { bonus: false, completed: false };
  update((state) => {
    if (day !== state.today) return state;
    const logs = { ...state.logs, [day]: { ...state.logs[day], ...patch } };
    const next = { ...state, logs };
    const credited = creditWeeklyBonus(next, mondayOf(day));
    result = { bonus: credited !== next, completed: !isComplete(state.logs[day]) && isComplete(logs[day]) };
    return credited;
  });
  return result;
}

function startClimb(state: Expedition, summitsReached: number): Expedition {
  const monday = mondayOf(state.today);
  return {
    ...state,
    summitsReached,
    climbStartWeek: weekClosed(state, monday) ? addDays(monday, 7) : monday,
  };
}

export function claimSummit(expectedLevel: number) {
  let earned: number | null = null;
  update((state) => {
    if (state.summitsReached !== expectedLevel || summitStamps(state) < rules.summitStampTarget) return state;
    earned = expectedLevel;
    return startClimb(state, expectedLevel + 1);
  });
  return earned;
}

export function redeem(item: keyof typeof rules.items) {
  let bought = false;
  update((state) => {
    const price = rules.items[item].price;
    if (state.points < price) return state;
    bought = true;
    return {
      ...state,
      points: state.points - price,
      passes: state.passes + Number(item === "pass"),
      vouchers: state.vouchers + Number(item === "voucher"),
    };
  });
  return bought;
}

export function canPlacePass(state: Expedition, day: string) {
  return day < state.today && day >= addDays(mondayOf(state.today), -7)
    && !isComplete(state.logs[day]) && !state.protectedDays.includes(day);
}

export function placePass(day: string) {
  let reward = { applied: false, bonus: false };
  update((state) => {
    if (!state.passes || !canPlacePass(state, day)) return state;
    const next = { ...state, passes: state.passes - 1, protectedDays: [...state.protectedDays, day] };
    const credited = creditWeeklyBonus(next, mondayOf(day));
    reward = { applied: true, bonus: credited !== next };
    return credited;
  });
  return reward;
}

export function nextDemoDay() {
  update((state) => creditWeeklyBonus({ ...state, today: addDays(state.today, 1) }, mondayOf(state.today)));
}

export function unlockDemoReferrals() {
  update((state) => referralsUnlocked(state) ? state : startClimb(state, referralClimbIndex));
}

export function chooseMascot(mascot: MascotId) {
  update((state) => ({ ...state, mascot }));
}

export function resetDemo() {
  update((state) => ({ ...initialState, mascot: state.mascot ?? defaultMascot }));
}
