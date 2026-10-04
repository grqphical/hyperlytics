import { useId } from "react";
import Panel from "./Panel";
import Kbd from "./Kbd";

interface Props {
    /** Re-centres the view on a clicked point. */
    recenterOnClick: boolean;
    onRecenterOnClickChange: (value: boolean) => void;
    onReset: () => void;
}

const SHORTCUTS: { keys: string[]; action: string }[] = [
    { keys: ["R"], action: "Reset view" },
    { keys: ["Esc"], action: "Clear selection" },
];

export default function ViewControls({ recenterOnClick, onRecenterOnClickChange, onReset }: Props) {
    const toggleId = useId();

    return (
        <Panel title="View controls">
            <button
                type="button"
                onClick={onReset}
                className="w-full rounded-md border border-white/20 bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 active:bg-slate-600"
            >
                Reset view
            </button>

            <div className="mt-2 flex gap-2">
                <input
                    id={toggleId}
                    type="checkbox"
                    checked={recenterOnClick}
                    onChange={(e) => onRecenterOnClickChange(e.target.checked)}
                    aria-describedby={`${toggleId}-help`}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer accent-sky-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                />
                <div className="min-w-0">
                    <label
                        htmlFor={toggleId}
                        className="cursor-pointer text-xs font-medium text-slate-100"
                    >
                        Auto re-center
                    </label>
                    <p id={`${toggleId}-help`} className="mt-0.5 text-[11px] leading-snug text-slate-400">
                        When on, clicking a point moves that player to the centre of the view.
                    </p>
                </div>
            </div>

            <h3 className="mt-3 text-xs font-semibold text-slate-200">Keyboard shortcuts</h3>
            <ul className="mt-1.5 space-y-1">
                {SHORTCUTS.map((shortcut) => (
                    <li key={shortcut.action} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-slate-300">{shortcut.action}</span>
                        <span className="flex gap-1">
                            {shortcut.keys.map((key) => (
                                <Kbd key={key}>{key}</Kbd>
                            ))}
                        </span>
                    </li>
                ))}
            </ul>
        </Panel>
    );
}