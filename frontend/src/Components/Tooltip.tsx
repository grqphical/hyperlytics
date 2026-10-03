import { useRef } from "react"

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

export default function Tooltip() {
    const playerDataRef = useRef<PlayerData>(null!);

    if (playerDataRef.current === null) {
        return (
            <div className="z-50 text-white max-w-90 p-4 bg-slate-800 rounded-md">
                <h1>No node selected</h1>
            </div>
        )
    }

    return (
        <div className="z-50 text-white max-w-90 p-4 bg-slate-800 rounded-md">
            <h1 className="text-lg font-bold">{playerDataRef.current.name}</h1>
            <p className="text-sm">{playerDataRef.current.sport} &#x2022; Age: {playerDataRef.current.age} &#x2022; {formatInches(playerDataRef.current.height_in)} &#x2022; {playerDataRef.current.weight_lbs} lbs</p>
            <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="flex flex-col items-center">
                    <div className={`p-2 ${percentageBackground(playerDataRef.current.offense_pct)} text-white aspect-square flex items-center justify-center`}>
                        <span className="text-2xl font-bold">{playerDataRef.current.offense_pct}%</span>
                    </div>
                    <p>Offense</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className={`p-2 ${percentageBackground(playerDataRef.current.defense_pct)} text-white aspect-square flex items-center justify-center`}>
                        <span className="text-2xl font-bold">{playerDataRef.current.defense_pct}%</span>
                    </div>
                    <p>Defense</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className={`p-2 ${percentageBackground(playerDataRef.current.physical_pct)} text-white aspect-square flex items-center justify-center`}>
                        <span className="text-2xl font-bold">{playerDataRef.current.physical_pct}%</span>
                    </div>
                    <p>Physicality</p>
                </div>

            </div>
        </div>
    )
}