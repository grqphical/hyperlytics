import { useCallback, useRef, useState } from "react";
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

export interface PlayerPoint extends PlayerData {
    position: Vec3
}

export const examplePlayers: PlayerPoint[] = [
    { position: [0.627, 0.119, 0.448], name: "Marcus Webb", sport: "Basketball", age: 26, weight_lbs: 215, height_in: 79, dominant_hand: "right", offense_pct: 81, defense_pct: 56, physical_pct: 72 },
    { position: [-0.153, 0.735, 0.092], name: "Tomas Novak", sport: "Hockey", age: 29, weight_lbs: 205, height_in: 75, dominant_hand: "left", offense_pct: 42, defense_pct: 87, physical_pct: 55 },
    { position: [0.08, -0.119, 0.04], name: "Liam O'Connor", sport: "Hockey", age: 24, weight_lbs: 172, height_in: 70, dominant_hand: "right", offense_pct: 54, defense_pct: 44, physical_pct: 52 },
    { position: [0.419, 0.384, -0.14], name: "Aiden Park", sport: "Basketball", age: 27, weight_lbs: 190, height_in: 73, dominant_hand: "right", offense_pct: 71, defense_pct: 69, physical_pct: 43 },
    { position: [-0.547, -0.456, -0.274], name: "Jordan Ellis", sport: "Basketball", age: 31, weight_lbs: 168, height_in: 71, dominant_hand: "left", offense_pct: 23, defense_pct: 27, physical_pct: 36 },
    { position: [0.0, 0.0, 0.0], name: "John Average", sport: "Basketball", age: 25, weight_lbs: 195, height_in: 75, dominant_hand: "right", offense_pct: 50, defense_pct: 50, physical_pct: 50 },
    { position: [0.763, -0.327, 0.163], name: "Dante Brooks", sport: "Basketball", age: 23, weight_lbs: 198, height_in: 72, dominant_hand: "right", offense_pct: 88, defense_pct: 34, physical_pct: 58 },
    { position: [-0.243, 0.274, 0.669], name: "Viktor Petrov", sport: "Hockey", age: 30, weight_lbs: 224, height_in: 77, dominant_hand: "left", offense_pct: 38, defense_pct: 64, physical_pct: 83 },
    { position: [0.196, -0.554, -0.359], name: "Kenji Tanaka", sport: "Hockey", age: 28, weight_lbs: 180, height_in: 70, dominant_hand: "right", offense_pct: 60, defense_pct: 22, physical_pct: 32 },
    { position: [0.5, 0.526, 0.473], name: "Isaiah Carter", sport: "Hockey", age: 25, weight_lbs: 245, height_in: 76, dominant_hand: "right", offense_pct: 75, defense_pct: 76, physical_pct: 74 },
    { position: [-0.111, -0.223, 0.372], name: "Mateo Silva", sport: "Basketball", age: 22, weight_lbs: 178, height_in: 71, dominant_hand: "right", offense_pct: 44, defense_pct: 39, physical_pct: 69 },
    { position: [0.338, -0.068, -0.54], name: "Ben Hartley", sport: "Hockey", age: 33, weight_lbs: 175, height_in: 73, dominant_hand: "right", offense_pct: 67, defense_pct: 47, physical_pct: 23 },
    { position: [0.212, 0.305, -0.118], name: "Noah Fischer", sport: "Basketball", age: 27, weight_lbs: 188, height_in: 77, dominant_hand: "right", offense_pct: 61, defense_pct: 65, physical_pct: 44 },
    { position: [-0.402, 0.158, 0.231], name: "Oscar Lindqvist", sport: "Hockey", age: 32, weight_lbs: 210, height_in: 74, dominant_hand: "left", offense_pct: 30, defense_pct: 58, physical_pct: 62 },
    { position: [0.091, -0.267, 0.145], name: "Caleb Murphy", sport: "Hockey", age: 26, weight_lbs: 202, height_in: 74, dominant_hand: "left", offense_pct: 55, defense_pct: 37, physical_pct: 57 },
    { position: [-0.634, -0.211, 0.302], name: "Rafael Gomez", sport: "Basketball", age: 34, weight_lbs: 183, height_in: 69, dominant_hand: "right", offense_pct: 18, defense_pct: 39, physical_pct: 65 },
    { position: [0.355, 0.612, 0.204], name: "Elijah Grant", sport: "Basketball", age: 28, weight_lbs: 228, height_in: 81, dominant_hand: "right", offense_pct: 68, defense_pct: 81, physical_pct: 60 },
    { position: [-0.178, -0.095, -0.412], name: "Hugo Laurent", sport: "Hockey", age: 29, weight_lbs: 165, height_in: 70, dominant_hand: "left", offense_pct: 41, defense_pct: 45, physical_pct: 29 },
    { position: [0.521, -0.438, -0.267], name: "Dylan Reyes", sport: "Basketball", age: 24, weight_lbs: 185, height_in: 72, dominant_hand: "right", offense_pct: 76, defense_pct: 28, physical_pct: 37 },
    { position: [-0.289, 0.447, -0.356], name: "Andrei Volkov", sport: "Basketball", age: 30, weight_lbs: 192, height_in: 78, dominant_hand: "left", offense_pct: 36, defense_pct: 72, physical_pct: 32 },
    { position: [0.047, 0.118, 0.083], name: "Jamie Foster", sport: "Hockey", age: 25, weight_lbs: 170, height_in: 69, dominant_hand: "right", offense_pct: 52, defense_pct: 56, physical_pct: 54 },
    { position: [0.704, 0.215, -0.331], name: "Xavier Mitchell", sport: "Basketball", age: 23, weight_lbs: 190, height_in: 76, dominant_hand: "right", offense_pct: 85, defense_pct: 61, physical_pct: 33 },
    { position: [-0.512, -0.583, 0.119], name: "Gustav Berg", sport: "Hockey", age: 35, weight_lbs: 215, height_in: 76, dominant_hand: "left", offense_pct: 24, defense_pct: 21, physical_pct: 56 },
    { position: [0.163, -0.341, 0.527], name: "Terrence Boyd", sport: "Hockey", age: 27, weight_lbs: 260, height_in: 75, dominant_hand: "right", offense_pct: 58, defense_pct: 33, physical_pct: 76 },
    { position: [-0.071, 0.589, 0.446], name: "Pablo Herrera", sport: "Basketball", age: 28, weight_lbs: 180, height_in: 72, dominant_hand: "left", offense_pct: 46, defense_pct: 79, physical_pct: 72 },
    { position: [0.402, 0.039, 0.298], name: "Wyatt Collins", sport: "Hockey", age: 26, weight_lbs: 232, height_in: 74, dominant_hand: "right", offense_pct: 70, defense_pct: 52, physical_pct: 65 },
    { position: [-0.337, -0.162, -0.205], name: "Felix Baumann", sport: "Basketball", age: 30, weight_lbs: 172, height_in: 72, dominant_hand: "right", offense_pct: 33, defense_pct: 42, physical_pct: 40 },
    { position: [0.268, 0.471, 0.592], name: "Darius Johnson", sport: "Basketball", age: 29, weight_lbs: 240, height_in: 82, dominant_hand: "right", offense_pct: 63, defense_pct: 74, physical_pct: 80 },
    { position: [-0.455, 0.324, -0.498], name: "Mikhail Orlov", sport: "Basketball", age: 33, weight_lbs: 185, height_in: 77, dominant_hand: "left", offense_pct: 27, defense_pct: 66, physical_pct: 25 },
    { position: [0.119, -0.082, -0.176], name: "Ryan Takahashi", sport: "Hockey", age: 25, weight_lbs: 178, height_in: 71, dominant_hand: "right", offense_pct: 56, defense_pct: 46, physical_pct: 41 },
    { position: [0.581, -0.119, 0.402], name: "Calvin Reed", sport: "Basketball", age: 24, weight_lbs: 215, height_in: 73, dominant_hand: "right", offense_pct: 79, defense_pct: 44, physical_pct: 70 },
    { position: [-0.226, -0.488, 0.341], name: "Stefan Kovac", sport: "Hockey", age: 31, weight_lbs: 218, height_in: 75, dominant_hand: "left", offense_pct: 39, defense_pct: 26, physical_pct: 67 },
]


const examplePositions: Vec3[] = examplePlayers.map((p) => p.position);

const isHockeyFlags: boolean[] = examplePlayers.map((p) => p.sport === "Hockey");

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
    const view = useRef<HyperbolicViewApi>(null);
    const [player, setPlayer] = useState<PlayerData | null>(null);

    const onSelect = useCallback((index: number) => {
        setPlayer(examplePlayers[index] ?? null);
    }, []);

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
                />

                <PoincareBoundary radius={POINCARE_RADIUS} />
                <HyperbolicNodes
                    positions={examplePositions}
                    isHockey={isHockeyFlags}
                    radius={POINCARE_RADIUS}
                    apiRef={view}
                    onSelect={onSelect}
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