import Panel from "./Panel";
import { PlayerFacts, PlayerStatMeters } from "./PlayerStats";
import type { Athlete } from "../models";

interface Props {
    /** The active player, or null when nothing is selected. */
    player: Athlete | null;
    /** When true, clicking a point flies it to the centre of the view. */
    recenterOnClick: boolean;
    onRecenterOnClickChange: (value: boolean) => void;
}

export default function PlayerPanel({ player, recenterOnClick, onRecenterOnClickChange }: Props) {
    if (player === null) {
        return (
            <Panel title="Active player">
                <p className="text-xs leading-relaxed text-slate-300">
                    Nothing selected yet. Pick a point in the ball to see that player&rsquo;s profile.
                </p>
            </Panel>
        );
    }

    return (
        <Panel
            title="Active player"
        >
            {/* The recenter lock lives with the active player rather than in the
                view controls, so the control that owns the selection also owns
                how clicking behaves. */}
            <button
                type="button"
                aria-pressed={recenterOnClick}
                onClick={() => onRecenterOnClickChange(!recenterOnClick)}
                title={
                    recenterOnClick
                        ? "Clicking a point re-centres the view on it"
                        : "Clicking a point leaves the view where it is"
                }
                className={`w-full rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${recenterOnClick
                        ? "border-sky-400/60 bg-sky-400/20 text-sky-100 hover:bg-sky-400/30"
                        : "border-white/20 bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
            >
                {recenterOnClick ? "Unlocked" : "Locked"}
                <span className="ml-1.5 font-normal opacity-80">
                    {recenterOnClick ? "auto re-centering on" : "auto re-centering off"}
                </span>
            </button>

            <h3 className="mt-3 text-base font-semibold leading-tight text-white">{player.name}</h3>

            <PlayerFacts player={player} />
            <PlayerStatMeters player={player} />
        </Panel>
    );
}