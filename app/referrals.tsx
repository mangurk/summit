import { useState } from "react";
import { demoReferralPoints, getExpedition, referralClimbIndex } from "@/lib/data";
import { Dialog } from "./check-in";
import { Badge, Icon, Meter } from "./summit-ui";

const { mountains, referrals } = getExpedition();
const { unlockAtClimb, code, members, pointsPerReferral } = referrals;
const summit = mountains[referralClimbIndex];
const pointsFormat = new Intl.NumberFormat("en-US");

function copyWithSelection(text: string) {
  const previousFocus = document.activeElement;
  const field = document.createElement("textarea");
  field.value = text;
  field.readOnly = true;
  field.setAttribute("aria-hidden", "true");
  field.style.cssText = "position:fixed;inset:0 auto auto 0;opacity:0;pointer-events:none;font-size:16px";
  document.body.append(field);

  try {
    field.focus({ preventScroll: true });
    field.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    field.remove();
    if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
  }
}

function ReferralCode() {
  const [copyStatus, setCopyStatus] = useState("");
  const copied = copyStatus === "Copied!";

  async function copyCode() {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(code);
        setCopyStatus("Copied!");
        return;
      } catch {
        // Try selection-based copying if the browser denied clipboard access.
      }
    }
    setCopyStatus(copyWithSelection(code) ? "Copied!" : "Couldn’t copy automatically. Select the code to copy it.");
  }

  return (
    <div className="referral-code">
      <div className="referral-code-row">
        <input type="text" readOnly value={code} aria-label="Your referral code" />
        <button className="button referral-copy-button" type="button" onClick={copyCode}>
          <Icon name={copied ? "check" : "copy"} size={16} />
          {copied ? "Copied!" : "Copy code"}
        </button>
      </div>
      <span className={copied ? "sr-only" : "referral-copy-status"} role="status">{copyStatus}</span>
    </div>
  );
}

export function ReferralWelcome({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="Referrals unlocked!" onClose={onClose} variant="reward">
      <div className="achievement-reveal" aria-hidden="true">
        <div className="reward-emblem"><Icon name="referrals" size={62} /></div>
      </div>
      <div className="reward-copy">
        <h3>Bring a friend along</h3>
        <p>You’ve made it to {summit.name}. Share your referral code and follow your friends’ progress from this tab.</p>
        <div className="reward-tags"><span><Icon name="coin" size={16} /> +{pointsPerReferral} demo points per friend who joins</span></div>
      </div>
      <button className="button button-primary" type="button" onClick={onClose}>See my referral code <Icon name="east" size={18} /></button>
    </Dialog>
  );
}

function DenaliProgress({ level, onSummit, onUnlock }: { level: number; onSummit: () => void; onUnlock: () => void }) {
  return (
    <section className="panel referral-panel" aria-labelledby="referral-path-title">
      <div className="panel-heading">
        <div><h2 id="referral-path-title">Your path to {summit.name}</h2><p>{level} of {referralClimbIndex} prior summits reached</p></div>
        <button className="demo-nudge referral-demo-unlock" type="button" onClick={onUnlock}>
          <Icon name="unlock" size={15} /> Unlock referrals (demo)
        </button>
      </div>
      <ol className="referral-milestones">
        {mountains.slice(0, unlockAtClimb).map((mountain, index) => (
          <li key={mountain.name} data-reached={index < level} data-target={index === referralClimbIndex}>
            <Badge level={index + 1} size={46} />
            <b>{mountain.name}</b>
            <span>{index < level ? "Reached" : index === referralClimbIndex ? "Unlocks referrals" : "Ahead"}</span>
          </li>
        ))}
      </ol>
      <button className="button referral-map-button" type="button" onClick={onSummit}>
        <Icon name="map" size={17} /> View {summit.name} on the map
      </button>
    </section>
  );
}

function ReferralList() {
  return (
    <section className="panel referral-panel" aria-labelledby="referral-list-title">
      <div className="panel-heading">
        <div><h2 id="referral-list-title">Your referrals</h2><p>{members.length} friends joined in this demo</p></div>
        <span className="referral-total"><Icon name="coin" size={15} /> {pointsFormat.format(demoReferralPoints)} pts earned</span>
      </div>
      <ul className="referral-list">
        {members.map((member) => (
          <li key={member.name} className="referral-member">
            <span className="referral-avatar" aria-hidden="true">{member.initials}</span>
            <div className="referral-member-progress">
              <b>{member.name}</b>
              <span>{member.summits}/{mountains.length} summits · {member.summits < mountains.length ? `Next up: ${mountains[member.summits].name}` : "Season complete"}</span>
              <Meter value={member.summits} max={mountains.length} label={`${member.name} summit progress`} />
            </div>
            <span className="referral-earned">+{pointsPerReferral} pts</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Referrals({ level, unlocked, onSummit, onUnlock }: {
  level: number; unlocked: boolean; onSummit: () => void; onUnlock: () => void;
}) {
  return (
    <>
      <header className="page-heading">
        <div><p className="page-date"><Icon name="referrals" size={15} /> Invite friends</p><h1>Referrals</h1></div>
      </header>
      <div className="referrals-grid">
        <section className="referral-hero" data-unlocked={unlocked} aria-labelledby="referral-hero-title">
          <div className="referral-hero-intro">
            <div>
              <h2 id="referral-hero-title">{unlocked ? "Your referral code" : `Unlocks at ${summit.name}`}</h2>
              <p>{unlocked ? "Share your code with a friend." : `Start the ${summit.name} climb to get your referral code.`}</p>
            </div>
            <div className="referral-crest" aria-hidden="true">
              <Badge level={unlockAtClimb} size={92} shine={unlocked} />
              {!unlocked && <span className="referral-lock"><Icon name="lock" size={15} /></span>}
            </div>
          </div>
          {unlocked && <ReferralCode />}
          <p className="referral-perk"><Icon name="coin" size={18} /><span><b>+{pointsPerReferral} pts</b> per friend who joins</span></p>
        </section>
        {unlocked ? <ReferralList /> : <DenaliProgress level={level} onSummit={onSummit} onUnlock={onUnlock} />}
      </div>
    </>
  );
}
