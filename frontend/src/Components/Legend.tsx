export default function Legend() {
    return (
        <div className="z-50 text-white max-w-90 p-4 bg-slate-800 rounded-md">
            <h3 className="text-lg font-bold">Non-Euclidean Sports Analysis</h3>
            <p className="text-xs">A comparison of NBA and NHL players across three categories: offense, defense, and physicality</p>
            <h4 className="font-bold text-lg">Legend</h4>
            <div className="mt-1 flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-xs bg-[#ff3b4e]" aria-hidden="true" />
                <span className="text-xs">Hockey</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-xs bg-[#2bff88]" aria-hidden="true" />
                <span className="text-xs">Basketball</span>
            </div>
            <p className="text-xs mt-3">A bigger point means that more games have been played that season.</p>
        </div>
    )
}