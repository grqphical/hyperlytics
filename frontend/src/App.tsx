// App.tsx
import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Point, { type PointState } from "./Components/Point";

export default function App() {
    const state1 = useRef<PointState>({
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: 0.3,
    });

    return (
        <Canvas camera={{ position: [0, 0, 5] }} style={{ width: "100vw", height: "100vh" }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[2, 2, 5]} />
            <Point state={state1} />
            <OrbitControls />
        </Canvas>
    );
}