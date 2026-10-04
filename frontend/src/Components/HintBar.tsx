import Kbd from "./Kbd";

const GESTURES: { input: string; action: string }[] = [
    { input: "Click", action: "select player" },
    { input: "Left-drag", action: "orbit" },
    { input: "Right-drag", action: "pan" },
    { input: "Scroll", action: "zoom" },
];

/**
 * Persistent, always-visible gesture reference. Mouse-only wording used to
 * live in a low-contrast corner paragraph that keyboard and touch users never
 * saw; this version names every input.
 */
export default function HintBar() {
    return (
        <div className="pointer-events-auto max-w-[calc(100vw-1.5rem)] rounded-md border border-white/10 bg-slate-900/70 px-2.5 py-1.5 text-[11px] text-slate-300 shadow-lg shadow-black/40 backdrop-blur-md">
            <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                {GESTURES.map((gesture) => (
                    <li key={gesture.input} className="flex items-center gap-1 whitespace-nowrap">
                        <span className="font-medium text-slate-100">{gesture.input}</span>
                        <span aria-hidden="true">to</span>
                        <span>{gesture.action}</span>
                    </li>
                ))}
                <li className="flex items-center gap-1 whitespace-nowrap">
                    <Kbd>R</Kbd>
                    <span>to reset</span>
                </li>
            </ul>
        </div>
    );
}