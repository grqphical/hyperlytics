import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

function Cube() {
    const ref = useRef({ rotation: { x: 0, y: 0 } });
    useFrame(() => {
        ref.current.rotation.x += 0.01;
        ref.current.rotation.y += 0.01;
    });

    return (
        <mesh ref={ref}>
            <boxGeometry />
            <meshStandardMaterial color="#44aa88" />
        </mesh>
    );
}

export default function App() {
    return (
        <Canvas camera={{ position: [0, 0, 3] }} style={{ width: "100vw", height: "100vh" }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[2, 2, 5]} />
            <Cube />
        </Canvas>
    );
}