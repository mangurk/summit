import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import type { MascotId } from "@/lib/data";

const paths = {
  today: <><rect x="4" y="4" width="16" height="16" rx="4" /><path d="m8 12 2.5 2.5L16 9" /></>,
  map: <path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2V6Zm6-2v14m6-12v14" />,
  rewards: <><rect x="3.5" y="8" width="17" height="4" rx="1" /><path d="M5.5 12v7h13v-7M12 8v11m0-11H8.5A2.5 2.5 0 1 1 11 5.5L12 8Zm0 0h3.5A2.5 2.5 0 1 0 13 5.5L12 8Z" /></>,
  referrals: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1m3-12v6m-3-3h6" /></>,
  profile: <><circle cx="12" cy="8" r="3.2" /><path d="M5.3 20v-1a5.4 5.4 0 0 1 5.4-5.4h2.6a5.4 5.4 0 0 1 5.4 5.4v1" /></>,
  mountain: <path d="m2.5 19 6.2-11 3.1 4.8 3.8-7 6 13.2H2.5Zm10.8-9 2.2 2.4 2.4-1.7" />,
  drink: <path d="M6 4h12l-1.5 6.7a4.7 4.7 0 0 1-9 0L6 4Zm1.1 4.5h9.8M12 15v5m-3.8 0h7.6" />,
  medication: <><path d="M7.3 17.2a4 4 0 0 1 0-5.7l5-5A4 4 0 1 1 18 12.2l-5 5a4 4 0 0 1-5.7 0Z" /><path d="m9.8 9 5.7 5.7" /></>,
  goal: <><circle cx="12" cy="12" r="8.3" /><circle cx="12" cy="12" r="3.7" /><path d="M12 4v2m8 6h-2m-6 8v-2m-8-6h2" /></>,
  east: <path d="M4 12h15m-6-6 6 6-6 6" />,
  left: <path d="m14.5 6-6 6 6 6" />,
  right: <path d="m9.5 6 6 6-6 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2.5" /><path d="M16 5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16" /></>,
  lock: <><rect x="6" y="10" width="12" height="10" rx="2" /><path d="M8.5 10V7.5a3.5 3.5 0 1 1 7 0V10m-3.5 4v2" /></>,
  coin: <path d="M12 2.7 21.3 12 12 21.3 2.7 12 12 2.7Zm0 5L16.3 12 12 16.3 7.7 12 12 7.7Z" />,
  ticket: <path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4V6Zm9 2v2m0 4v2" />,
  shield: <path d="M12 3 5 6v5c0 5 3.2 8.3 7 10 3.8-1.7 7-5 7-10V6l-7-3Zm-3 9 2 2 4-4" />,
  spark: <path d="M12 2.8c.7 5.5 3.7 8.5 9.2 9.2-5.5.7-8.5 3.7-9.2 9.2-.7-5.5-3.7-8.5-9.2-9.2 5.5-.7 8.5-3.7 9.2-9.2Z" />,
  flag: <path d="M5 21V4m0 1c4-4 8 4 14 0v10c-6 4-10-4-14 0" />,
  calendar: <><rect x="4" y="6" width="16" height="14" rx="3" /><path d="M8 3v5m8-5v5M4 11h16" /></>,
  install: <><path d="M12 3v12m-4.5-4.5L12 15l4.5-4.5M5 17v3h14v-3" /></>,
  reset: <path d="M4 11a8 8 0 1 1 2 6m-2-6V5m0 6h6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
} satisfies Record<string, ReactNode>;

export type Glyph = keyof typeof paths;

export function Icon({ name, size = 20 }: { name: Glyph; size?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export function StampSlots({ count, target }: { count: number; target: number }) {
  return (
    <div className="summit-stamps" data-ready={count === target}>
      <div className="stamp-row" aria-hidden="true">
        {Array.from({ length: target }, (_, index) => (
          <span className="stamp-slot" data-earned={index < count} key={index}>
            <span className="brand-mark" />
          </span>
        ))}
      </div>
      <span><b>{count}/{target}</b> summit stamps</span>
    </div>
  );
}

export function Badge({ level, size = 104, shine = false }: { level: number; size?: number; shine?: boolean }) {
  const path = `/summit/rank-${level}.webp`;
  return (
    <span className={`badge-art${shine ? " is-shining" : ""}`} style={{ width: size, height: size, "--badge-image": `url("${path}")` } as CSSProperties}>
      <Image src={path} width={size} height={size} alt="" unoptimized />
    </span>
  );
}

export function Mascot({ id, className }: { id: MascotId; className: string }) {
  return <Image className={className} data-mascot={id} src={`/summit/mascot-${id}.webp`} width={192} height={192} alt="" unoptimized />;
}

export function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  return (
    <div className="meter" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(value, max)}>
      <span style={{ width: `${Math.min(value / max, 1) * 100}%` }} />
    </div>
  );
}
