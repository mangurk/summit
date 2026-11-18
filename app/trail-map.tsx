import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import { getExpedition, type MascotId } from "@/lib/data";
import { Badge, Icon, Mascot } from "./summit-ui";

const { mountains } = getExpedition();
const bends = [
  "23 90 34 74", "52 76 65 92", "91 81 82 69", "83 47 67 52",
  "43 47 36 65", "10 53 28 42", "24 28 32 19", "62 27 68 14",
];

function trail(from: number, to: number) {
  const start = mountains[from];
  const segments = mountains.slice(from + 1, to + 1).map(({ x, y }, index) => (
    `C ${bends[from + index]} ${x} ${y}`
  ));
  return [`M ${start.x} ${start.y}`, ...segments].join(" ");
}

export function PeakIcon({ index, className }: { index: number; className: string }) {
  return <Image className={className} src={`/summit/peak-${index + 1}.webp`} width={112} height={96} alt="" unoptimized />;
}

export function MapBoard({
  completed, selected, from, mascot, onSelect, onArrive,
}: {
  completed: number;
  selected: number;
  from: number | null;
  mascot: MascotId;
  onSelect: (index: number) => void;
  onArrive: () => void;
}) {
  const current = Math.min(completed, mountains.length - 1);
  const destination = mountains[current];
  const origin = from === null ? destination : mountains[from];
  const facing = origin.x > destination.x ? " faces-left" : "";
  const motionPath = useRef<SVGPathElement>(null);
  const traveler = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const path = motionPath.current;
    const sprite = traveler.current;
    if (!path || !sprite || from === null || from >= current) return;

    const distance = path.getTotalLength();
    const frames = Array.from({ length: 33 }, (_, index) => {
      const { x, y } = path.getPointAtLength(distance * index / 32);
      return { left: `${x}%`, top: `${y}%` };
    });
    const move = sprite.animate(frames, { duration: 1500, easing: "ease-in-out" });
    move.onfinish = onArrive;
    return () => move.cancel();
  }, [current, from, onArrive]);

  const route = trail(0, mountains.length - 1);
  const reached = trail(0, current);
  return (
    <div className="map-board" aria-label="Mountain expedition route">
      <div className="map-title"><Icon name="flag" size={15} /> {completed === mountains.length ? "Season complete" : `Next · ${destination.name}`}</div>
      <svg className="map-trail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d={route} className="trail-edge" />
        <path d={route} className="trail-bed" />
        <path d={route} className="trail-steps" />
        <path d={reached} className="trail-reached-bed" />
        <path d={reached} className="trail-explored" />
        {from !== null && <path d={trail(from, current)} ref={motionPath} fill="none" stroke="none" />}
      </svg>
      {mountains.map((mountain, index) => {
        const status = index < completed ? "earned" : index === current ? "current" : "locked";
        return (
          <button
            key={mountain.name}
            className="map-node"
            data-state={status}
            style={{ left: `${mountain.x}%`, top: `${mountain.y}%` }}
            aria-label={`${index + 1}. ${mountain.name}, ${status}`}
            aria-pressed={selected === index}
            onClick={() => onSelect(index)}
            type="button"
          >
            <PeakIcon index={index} className="peak-art" />
            <span className="peak-marker" aria-hidden="true">
              {status === "earned" ? <Badge level={index + 1} size={31} /> : <Icon name={status === "locked" ? "lock" : "flag"} size={11} />}
            </span>
            {(status === "current" || selected === index) && <span className="peak-label">{mountain.name}</span>}
          </button>
        );
      })}
      <span
        ref={traveler}
        aria-hidden="true"
        className={`traveler${from === null ? "" : " is-traveling"}${facing}`}
        style={{ "--to-x": `${destination.x}%`, "--to-y": `${destination.y}%` } as CSSProperties}
      ><Mascot id={mascot} className="map-mascot" /></span>
      <div className="map-compass" aria-hidden="true">N<Icon name="spark" size={21} /></div>
    </div>
  );
}
