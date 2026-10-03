import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { PoincareBoundary } from "./Components/PoincareBoundary";
import Legend from "./Components/Legend";
import HyperbolicNodes, { type HyperbolicViewApi } from "./Components/HyperbolicNodes";
import BoundaryAxes from "./Components/BoundaryAxes";
import type { Vec3 } from "./hyperbolic";

const examplePoints = [
    [0.627, 0.119, 0.448],
    [-0.153, 0.735, 0.092],
    [0.08, -0.119, 0.04],
    [0.419, 0.384, -0.14],
    [-0.547, -0.456, -0.274],
    [0.0, 0.0, 0.0],
    [0.763, -0.327, 0.163],
    [-0.243, 0.274, 0.669],
    [0.196, -0.554, -0.359],
    [0.5, 0.526, 0.473],
    [-0.111, -0.223, 0.372],
    [0.338, -0.068, -0.54],
    [0.212, 0.305, -0.118],
    [-0.402, 0.158, 0.231],
    [0.091, -0.267, 0.145],
    [-0.634, -0.211, 0.302],
    [0.355, 0.612, 0.204],
    [-0.178, -0.095, -0.412],
    [0.521, -0.438, -0.267],
    [-0.289, 0.447, -0.356],
    [0.047, 0.118, 0.083],
    [0.704, 0.215, -0.331],
    [-0.512, -0.583, 0.119],
    [0.163, -0.341, 0.527],
    [-0.071, 0.589, 0.446],
    [0.402, 0.039, 0.298],
    [-0.337, -0.162, -0.205],
    [0.268, 0.471, 0.592],
    [-0.455, 0.324, -0.498],
    [0.119, -0.082, -0.176],
    [0.581, -0.119, 0.402],
    [-0.226, -0.488, 0.341],
] as Vec3[];

const flags = examplePoints.map(() => true);

const POINCARE_RADIUS = 3.0;
const CAMERA_FOV = 50;
/**
 * The axes reach ~1.6x radius including their labels, so the camera has to sit
 * far enough back that all of it fits inside the vertical field of view:
 * distance >= extent / sin(fov / 2).
 */
const CAMERA_DISTANCE = (POINCARE_RADIUS * 1.65) / Math.sin((CAMERA_FOV / 2) * (Math.PI / 180));
const CAMERA_POSITION: Vec3 = [CAMERA_DISTANCE, CAMERA_DISTANCE, CAMERA_DISTANCE]
    .map((v) => v / Math.sqrt(3)) as Vec3;

export default function App() {
    const view = useRef<HyperbolicViewApi>(null);

    return (
        <div className="relative h-screen w-screen touch-none overflow-hidden select-none">
            <Canvas
                camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
                onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
            >
                <ambientLight intensity={0.5} />
                <color attach="background" args={["#05060f"]} />

                <PoincareBoundary radius={POINCARE_RADIUS} />
                <HyperbolicNodes
                    positions={examplePoints}
                    isBaseball={flags}
                    radius={POINCARE_RADIUS}
                    apiRef={view}
                />
                <BoundaryAxes radius={POINCARE_RADIUS} view={view} />

                <EffectComposer>
                    <Bloom luminanceThreshold={0.2} mipmapBlur />
                </EffectComposer>
            </Canvas>

            <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
                <button
                    type="button"
                    onClick={() => view.current?.reset()}
                    className="rounded-md border border-white/20 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-slate-700 active:bg-slate-600"
                >
                    Reset view
                </button>
                <p className="max-w-52 text-right text-[11px] leading-snug text-slate-400">
                    Drag to pan &middot; click a player to re-center
                </p>
            </div>

            <Legend />
        </div>
    );
}