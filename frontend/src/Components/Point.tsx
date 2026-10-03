// Components/Point.tsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface PointState {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
}

interface PointProps {
    state: { current: PointState };
}

export default function Point({ state }: PointProps) {
    const ref = useRef<THREE.Mesh>(null!);

    useFrame(() => {
        const { position, rotation, scale } = state.current;
        ref.current.position.set(...position);
        ref.current.rotation.set(...rotation);
        ref.current.scale.setScalar(scale);
    });

    return (
        <mesh ref={ref}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color="orange" />
        </mesh>
    );
}