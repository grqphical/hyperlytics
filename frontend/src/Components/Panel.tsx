import { useId, type ReactNode } from "react";

interface PanelProps {
    children: ReactNode;
    /** Short uppercase heading rendered in the panel's header bar. */
    title: string;
    /** Rendered under the heading, right-aligned (counts, close buttons, ...). */
    actions?: ReactNode;
    className?: string;
}

/**
 * Shared surface for every HUD card so the overlay reads as one system:
 * same radius, border, translucency and heading treatment everywhere.
 */
export default function Panel({ children, title, actions, className = "" }: PanelProps) {
    const headingId = useId();

    return (
        <section
            aria-labelledby={headingId}
            className={`pointer-events-auto w-72 max-w-[calc(100vw-1.5rem)] select-auto rounded-lg border border-white/10 bg-slate-900/70 text-slate-100 shadow-lg shadow-black/40 backdrop-blur-md ${className}`}
        >
            <header className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-1.5">
                <h2
                    id={headingId}
                    className="text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                >
                    {title}
                </h2>
                {actions}
            </header>
            <div className="px-3 py-2.5">{children}</div>
        </section>
    );
}