import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import Point, { type PointState } from "./Components/Point";
import { PoincareBoundary } from "./Components/PoincareBoundary";
import Legend from "./Components/Legend";

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
    [-0.226, -0.488, 0.341]
]
const POINCARE_RADIUS = 3.0

export default function App() {
    const points = useRef<PointState[]>(
        examplePoints.map(([x, y, z]): PointState => ({
            position: [x * POINCARE_RADIUS, y * POINCARE_RADIUS, z * POINCARE_RADIUS],
            rotation: [0, 0, 0],
            scale: 1,
        }))
    );

    return (
        <div>
            <Canvas camera={{ position: [0, 0, 5] }} style={{ width: "100vw", height: "100vh" }}>
                <ambientLight intensity={0.5} />
                <color attach="background" args={['#05060f']} />
                <PoincareBoundary radius={POINCARE_RADIUS} />
                {points.current.map((point, index) => (
                    <Point
                        key={index}
                        state={{ current: point }}
                        scale={0.04}
                        isBaseball={true}
                    />
                ))}
            </Canvas>
            <Legend />
        </div>

    );
}