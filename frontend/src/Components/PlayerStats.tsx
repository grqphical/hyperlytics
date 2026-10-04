import type { Athlete } from "../models";

export type Stat = {
    label: string;
    value: number;
};

function formatInches(inches: number): string {
    const feet = Math.floor(inches / 12);
    const remainder = inches - feet * 12;

    return `${feet} ft ${remainder} in`;
}

function capitalize(value: string): string {
    return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}

function percentageBackground(percentage: number): string {
    if (percentage <= 20) return "bg-red-500";
    if (percentage <= 40) return "bg-red-900";
    if (percentage <= 60) return "bg-slate-500";
    if (percentage <= 80) return "bg-blue-900";
    return "bg-blue-500";
}

/**
 * A single attribute tile. `role="meter"` gives assistive tech the label and
 * value, and the bar repeats the number as length so the rating is not
 * communicated by colour alone.
 */
function StatMeter({ label, value }: Stat) {
    const clamped = Math.min(100, Math.max(0, value));

    return (
        <li>
            <div
                role="meter"
                aria-label={label}
                aria-valuenow={Math.round(clamped)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={`${Math.round(clamped)} out of 100`}
                className={`rounded-md p-2 text-white ${percentageBackground(clamped)}`}
            >
                <span className="block text-xl font-bold tabular-nums leading-none">
                    {Math.round(clamped)}%
                </span>
                <span
                    aria-hidden="true"
                    className="mt-2 block h-1 rounded-full bg-white/40"
                    style={{ width: `${clamped}%` }}
                />
            </div>
            <span className="mt-1 block text-center text-[11px] text-slate-300">{label}</span>
        </li>
    );
}

/** Sport, age, height and weight, as a two-column definition list. */
export function PlayerFacts({ player }: { player: Athlete }) {
    const facts: { term: string; detail: string }[] = [
        { term: "Sport", detail: capitalize(player.sport) },
        { term: "Age", detail: String(player.age) },
        { term: "Height", detail: formatInches(player.height_in) },
        { term: "Weight", detail: `${player.weight_lbs} lbs` },
    ];

    return (
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {facts.map((fact) => (
                <div key={fact.term} className="flex justify-between gap-2">
                    <dt className="text-slate-400">{fact.term}</dt>
                    <dd className="text-right font-medium text-slate-100">{fact.detail}</dd>
                </div>
            ))}
        </dl>
    );
}

/** The three rated attributes, as a row of meters. */
export function PlayerStatMeters({ player }: { player: Athlete }) {
    const stats: Stat[] = [
        { label: "Offense", value: player.offense_pct },
        { label: "Defense", value: player.defense_pct },
        { label: "Physicality", value: player.physical_pct },
    ];

    return (
        <>
            <h3 className="mt-3 text-xs font-semibold text-slate-200">Attributes</h3>
            <ul className="mt-1.5 grid grid-cols-3 gap-2">
                {stats.map((stat) => (
                    <StatMeter key={stat.label} label={stat.label} value={stat.value} />
                ))}
            </ul>
        </>
    );
}