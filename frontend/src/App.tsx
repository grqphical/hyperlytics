import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import Point, { type PointState } from "./Components/Point";
import { PoincareBoundary } from "./Components/PoincareBoundary";

export default function App() {
    const state1 = useRef<PointState>({
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: 1,
    });

    return (
        <Canvas camera={{ position: [0, 0, 5] }} style={{ width: "100vw", height: "100vh" }}>
            <ambientLight intensity={0.5} />
            <color attach="background" args={['#05060f']} />
            <PoincareBoundary />
            <Point state={state1} scale={0.04} isBaseball={true} />
        </Canvas>
    );
}