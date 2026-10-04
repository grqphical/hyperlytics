import Panel from "./Panel";
import { PlayerFacts, PlayerStatMeters } from "./PlayerStats";
import type { Athlete } from "../models";

interface Props {
    /** The second player, or null when no comparison has been picked yet. */
    player: Athlete | null;
    /** Puts this player in the active slot and the active one here. */
    onSwap: () => void;
    onClear: () => void;
}

const ACTION_CLASSES =
    "rounded-md border border-white/20 bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 active:bg-slate-600";

export default function ComparePanel({ player, onSwap, onClear }: Props) {
    if (player === null) {
        return (
            <Panel title="Comparison player">
                <p className="text-xs leading-relaxed text-slate-300">
                    After locking the first selected player, click another point to line up a second player beneath the active one. The
                    active player stays put, so you can compare two profiles side by side.
                </p>
            </Panel>
        );
    }

    return (
        <Panel
            title="Comparison player"
            actions={<span className="text-[11px] text-slate-400">{player.sport}</span>}
        >
            <h3 className="text-base font-semibold leading-tight text-white">{player.name}</h3>

            <PlayerFacts player={player} />
            <PlayerStatMeters player={player} />

            <div className="mt-3 flex gap-2">
                <button type="button" onClick={onSwap} className={`flex-1 ${ACTION_CLASSES}`}>
                    Make active
                </button>
                <button type="button" onClick={onClear} className={`flex-1 ${ACTION_CLASSES}`}>
                    Clear
                </button>
            </div>
        </Panel>
    );
}