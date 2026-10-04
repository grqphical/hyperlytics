import Panel from "./Panel";
import Kbd from "./Kbd";

interface Props {
    onReset: () => void;
}

const SHORTCUTS: { keys: string[]; action: string }[] = [
    { keys: ["R"], action: "Reset view" },
    { keys: ["Esc"], action: "Clear selection" },
];

export default function ViewControls({ onReset }: Props) {
    return (
        <Panel title="View controls">
            <button
                type="button"
                onClick={onReset}
                className="w-full rounded-md border border-white/20 bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 active:bg-slate-600"
            >
                Reset view
            </button>

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