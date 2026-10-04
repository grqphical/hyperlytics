export interface PlayerData {
    name: string
    sport: string
    age: number
    weight_lbs: number
    height_in: number
    dominant_hand: string
    offense_pct: number
    defense_pct: number
    physical_pct: number
    /** Share of a full season's games played, as a 0-1 float. */
    games_played_pct: number
}

interface Props {
    /** The selected player, or null when nothing is selected. */
    player: PlayerData | null;
}

function formatInches(inches: number): string {
    const feet = Math.floor(inches / 12);
    const remainder = inches - (feet * 12)

    return `${feet} ft, ${remainder} in.`
}

function percentageBackground(percentage: number): string {
    if (percentage <= 20) return "bg-red-500"
    if (percentage <= 40) return "bg-red-900"
    if (percentage <= 60) return "bg-slate-500"
    if (percentage <= 80) return "bg-blue-900"
    return "bg-blue-500"
}

export default function Tooltip({ player }: Props) {
    if (player === null) {
        return (
            <div className="z-50 text-white max-w-90 p-4 bg-slate-800 rounded-md">
                <h1>No node selected</h1>
            </div>
        )
    }

    return (
        <div className="z-50 text-white max-w-90 p-4 bg-slate-800 rounded-md">
            <h1 className="text-lg font-bold">{player.name}</h1>
            <p className="text-sm">{player.sport} &#x2022; Age: {player.age} &#x2022; {formatInches(player.height_in)} &#x2022; {player.weight_lbs} lbs</p>
            <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="flex flex-col items-center">
                    <div className={`p-2 ${percentageBackground(player.offense_pct)} text-white aspect-square flex items-center justify-center`}>
                        <span className="text-2xl font-bold">{player.offense_pct}%</span>
                    </div>
                    <p>Offense</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className={`p-2 ${percentageBackground(player.defense_pct)} text-white aspect-square flex items-center justify-center`}>
                        <span className="text-2xl font-bold">{player.defense_pct}%</span>
                    </div>
                    <p>Defense</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className={`p-2 ${percentageBackground(player.physical_pct)} text-white aspect-square flex items-center justify-center`}>
                        <span className="text-2xl font-bold">{player.physical_pct}%</span>
                    </div>
                    <p>Physicality</p>
                </div>

            </div>
        </div>
    )
}