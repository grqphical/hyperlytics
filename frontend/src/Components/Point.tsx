// Components/Point.tsx
import { useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import {
    hockeyLayer,
    basketballLayer,
    activeOutlineLayer,
    compareOutlineLayer,
    OUTLINE_SPREAD,
    type SelectionRole,
} from "./PointLayers.tsx";

export interface PointState {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
}

interface PointProps {
    state: { current: PointState };
    scale?: number;
    isHockey?: boolean;
    /** Which selection slot this node fills, or undefined when unselected. */
    selection?: SelectionRole;
    onClick?: (e: ThreeEvent<PointerEvent>) => void;
}

export default function Point({
    state,
    scale = 1,
    isHockey = false,
    selection,
    onClick,
}: PointProps) {
    const core = useRef<THREE.Group>(null!);
    const halo = useRef<THREE.Group>(null!);
    const outline = useRef<THREE.Group>(null!);

    const { CoreInstance, HaloInstance } = isHockey ? hockeyLayer : basketballLayer;
    const OutlineInstance =
        selection === "compare" ? compareOutlineLayer.Instance : activeOutlineLayer.Instance;

    useFrame(() => {
        const { position, rotation, scale: s } = state.current;
        for (const g of [core.current, halo.current]) {
            if (!g) continue;
            g.position.set(...position);
            g.rotation.set(...rotation);
            g.scale.setScalar(s * scale);
        }

        const o = outline.current;
        if (o) {
            o.position.set(...position);
            o.rotation.set(...rotation);
            // Wider than the node so it reads as an outline; kept proportional so
            // it tracks the node as the view moves.
            o.scale.setScalar(s * scale * OUTLINE_SPREAD);
        }
    });

    return (
        <>
            <CoreInstance ref={core} onClick={onClick} />
            <HaloInstance ref={halo} />
            {selection && <OutlineInstance ref={outline} />}
        </>
    );
}