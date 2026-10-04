import type { ReactNode } from "react";

/** Keyboard key chip. Purely presentational; the text is the accessible name. */
export default function Kbd({ children }: { children: ReactNode }) {
    return (
        <kbd className="rounded border border-white/20 bg-white/10 px-1 py-0.5 font-mono text-[10px] font-medium leading-none text-slate-100">
            {children}
        </kbd>
    );
}