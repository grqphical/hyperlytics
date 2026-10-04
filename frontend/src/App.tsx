import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { PoincareBoundary } from "./Components/PoincareBoundary";
import Legend from "./Components/Legend";
import HyperbolicNodes, { type HyperbolicViewApi } from "./Components/HyperbolicNodes";
import BoundaryAxes from "./Components/BoundaryAxes";
import type { Vec3 } from "./hyperbolic";
import { MOUSE } from "three";
import { OrbitControls } from "@react-three/drei";
import Tooltip, { type PlayerData } from "./Components/Tooltip";
import type { Athlete } from "./models";


const POINCARE_RADIUS = 3.0;
const CAMERA_FOV = 50;
/**
 * The axes reach ~1.6x radius including their labels, so the camera has to sit
 * far enough back that all of it fits inside the vertical field of view:
 * distance >= extent / sin(fov / 2).
 */
const CAMERA_DISTANCE = (POINCARE_RADIUS * 1.5) / Math.sin((CAMERA_FOV / 2) * (Math.PI / 180));
const CAMERA_POSITION: Vec3 = [CAMERA_DISTANCE, CAMERA_DISTANCE + 3, CAMERA_DISTANCE]
    .map((v) => v / Math.sqrt(3)) as Vec3;

export default function App() {
    const [players, setPlayers] = useState<Athlete[] | null>(null);

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                const [basketballResponse, hockeyResponse] = await Promise.all([
                    fetch("/api/players?sport=basketball"),
                    fetch("/api/players?sport=hockey"),
                ]);

                const [basketballData, hockeyData] = await Promise.all([
                    basketballResponse.json(),
                    hockeyResponse.json(),
                ]);

                setPlayers((currentPlayers) => [
                    ...(currentPlayers ?? []),
                    ...basketballData,
                    ...hockeyData,
                ]);
            } catch (error) {
                console.error(error);
            }
        };

        void fetchPlayers();
    }, []);

    const view = useRef<HyperbolicViewApi>(null);
    const [player, setPlayer] = useState<PlayerData | null>(null);
    const [recenterOnClick, setRecenterOnClick] = useState(true);

    const onSelect = useCallback((index: number) => {
        setPlayer(players?.[index] ?? null);
    }, [players]);

    const reset = useCallback(() => {
        view.current?.reset();
        setPlayer(null);
    }, []);

    return (
        <div className="relative h-screen w-screen touch-none overflow-hidden select-none">
            <Canvas
                camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
                onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
            >
                <ambientLight intensity={0.5} />
                <color attach="background" args={["#05060f"]} />
                {/* RIGHT defaults to PAN; leave it unmapped so right-drag only pans the hyperbolic nodes. */}
                <OrbitControls
                    mouseButtons={{
                        LEFT: MOUSE.ROTATE,
                        MIDDLE: MOUSE.DOLLY,
                        RIGHT: undefined,
                    }}
                    minDistance={2} maxDistance={15}
                />

                <PoincareBoundary radius={POINCARE_RADIUS} />
                <HyperbolicNodes
                    players={players}
                    radius={POINCARE_RADIUS}
                    apiRef={view}
                    onSelect={onSelect}
                    recenterOnClick={recenterOnClick}
                />
                <BoundaryAxes radius={POINCARE_RADIUS} view={view} />

                <EffectComposer>
                    <Bloom luminanceThreshold={0.2} mipmapBlur />
                </EffectComposer>
            </Canvas>

            <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
                <button
                    type="button"
                    onClick={reset}
                    className="rounded-md border border-white/20 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-slate-700 active:bg-slate-600"
                >
                    Reset view
                </button>
                <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-white/20 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                    <input
                        type="checkbox"
                        checked={recenterOnClick}
                        onChange={(e) => setRecenterOnClick(e.target.checked)}
                        className="h-3 w-3 cursor-pointer accent-sky-400"
                    />
                    Auto re-center
                </label>
                <p className="max-w-52 text-right text-[11px] leading-snug text-slate-400">
                    Hold right-click to pan &middot; click a player to re-center
                </p>
            </div>
            <div className="absolute top-2 left-2 flex flex-col gap-2">
                <Legend />
                <Tooltip player={player} />
            </div>

        </div>
    );
}