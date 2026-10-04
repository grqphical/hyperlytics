const SPORTS: { label: string; className: string }[] = [
    { label: "Hockey", className: "bg-[#ff3b4e]" },
    { label: "Basketball", className: "bg-[#2bff88]" },
];

export default function Legend() {
    return (
        // Native <details> keeps the key available but out of the way, and is
        // keyboard operable without any extra wiring.
        <details
            open
            className="pointer-events-auto group w-72 max-w-[calc(100vw-1.5rem)] select-auto rounded-lg border border-white/10 bg-slate-900/70 text-slate-100 shadow-lg shadow-black/40 backdrop-blur-md"
        >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
                Legend
                <span
                    aria-hidden="true"
                    className="transition-transform group-open:rotate-180"
                >
                    ▾
                </span>
            </summary>

            <div className="border-t border-white/10 px-3 py-2.5">
                <h3 className="text-xs font-semibold text-slate-200">Sport</h3>
                <ul className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1">
                    {SPORTS.map((sport) => (
                        <li key={sport.label} className="flex items-center gap-1.5 text-xs text-slate-300">
                            <span
                                aria-hidden="true"
                                className={`h-3 w-3 shrink-0 rounded-xs ring-1 ring-inset ring-white/20 ${sport.className}`}
                            />
                            {sport.label}
                        </li>
                    ))}
                </ul>

                <h3 className="mt-3 text-xs font-semibold text-slate-200">Point size</h3>
                <p className="mt-1 text-xs text-slate-300">
                    A larger point means more games were played that season.
                </p>
            </div>
        </details>
    );
}