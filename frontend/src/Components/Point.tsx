// Components/Point.tsx
import { useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { hockeyLayer, basketballLayer } from "./PointLayers.tsx";

export interface PointState {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
}

interface PointProps {
    state: { current: PointState };
    scale?: number;
    isHockey?: boolean;
    onClick?: (e: ThreeEvent<PointerEvent>) => void;
}

export default function Point({ state, scale = 1, isHockey = false, onClick }: PointProps) {
    const core = useRef<THREE.Group>(null!);
    const halo = useRef<THREE.Group>(null!);

    const { CoreInstance, HaloInstance } = isHockey ? hockeyLayer : basketballLayer;

    useFrame(() => {
        const { position, rotation, scale: s } = state.current;
        for (const g of [core.current, halo.current]) {
            if (!g) continue;
            g.position.set(...position);
            g.rotation.set(...rotation);
            g.scale.setScalar(s * scale);
        }
    });

    return (
        <>
            <CoreInstance ref={core} onClick={onClick} />
            <HaloInstance ref={halo} />
        </>
    );
}