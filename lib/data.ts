import sample from "@/data/sample.json";

export function getExpedition() {
  return sample;
}

export const demoReferralPoints = sample.referrals.members.length * sample.referrals.pointsPerReferral;
export const referralClimbIndex = sample.referrals.unlockAtClimb - 1;

export const mascots = [
  { id: "pika", name: "Alpine Pika" },
  { id: "goat", name: "Mountain Goat" },
  { id: "raven", name: "Trail Raven" },
] as const;

export type MascotId = (typeof mascots)[number]["id"];
export const defaultMascot = mascots[0].id;
