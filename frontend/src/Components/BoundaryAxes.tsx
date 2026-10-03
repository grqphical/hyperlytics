// Components/BoundaryAxes.tsx
import { useMemo, useRef, type ReactNode, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Line, Text, type BillboardProps } from "@react-three/drei";
import * as THREE from "three";

type Vec3 = [number, number, number];

interface AxisDef {
    key: string;
    dir: Vec3;
    color: string;
    title: string;
    description: string;
    highLabel: string;
    lowLabel: string;
}

const DEFAULT_AXES: AxisDef[] = [
    {
        key: "x",
        dir: [1, 0, 0],
        color: "#9fb0ff",
        title: "OFFENSE",
        description: "vs. sport average",
        highLabel: "Elite",
        lowLabel: "Weak",
    },
    {
        key: "y",
        dir: [0, 1, 0],
        color: "#ffd166",
        title: "DEFENSE",
        description: "vs. sport average",
        highLabel: "Elite",
        lowLabel: "Weak",
    },
    {
        key: "z",
        dir: [0, 0, 1],
        color: "#c792ff",
        title: "PHYSICAL",
        description: "anomaly vs. peer group",
        highLabel: "Above avg",
        lowLabel: "Below avg",
    },
];

/** Anything that can report how far the view has drifted from the league average. */
export interface ViewOffsetSource {
    readonly offset: number;
}

/** Hyperbolic distance over which the axes fade out, once the view is re-centered. */
const FADE_START = 0.6;
const FADE_END = 2.5;
const MIN_OPACITY = 0.12;

export interface BoundaryAxesProps {
    /** Must match the PoincareBoundary radius */
    radius?: number;
    /** Gap between the boundary and where each axis starts (fraction of radius) */
    gap?: number;
    /** How far past the boundary each axis extends (fraction of radius) */
    length?: number;
    /** Font size as a fraction of radius */
    fontSize?: number;
    opacity?: number;
    axes?: AxisDef[];
    /** When supplied, the axes fade as the view moves off the league average. */
    view?: RefObject<ViewOffsetSource | null> | null;
}

/** Materials that carry extra opacity channels (troika's Text does). */
type FadingMaterial = THREE.Material & {
    fillOpacity?: number;
    outlineOpacity?: number;
};

/**
 * Billboard that holds a constant *screen* size. Without this, labels on the
 * axis pointing at the camera render much larger than the ones facing away.
 * Children are authored at the depth of the ball's centre, which is the
 * reference distance used here.
 */
function ConstantSizeBillboard({
    children,
    ...props
}: { children: ReactNode } & Omit<BillboardProps, "children">) {
    const group = useRef<THREE.Group>(null);
    const world = useMemo(() => new THREE.Vector3(), []);

    useFrame(({ camera }) => {
        const g = group.current;
        if (!g) return;
        const reference = camera.position.length();
        if (reference < 1e-6) return;
        const distance = g.getWorldPosition(world).distanceTo(camera.position);
        g.scale.setScalar(distance / reference);
    });

    return (
        <Billboard ref={group} {...props}>
            {children}
        </Billboard>
    );
}

function AxisArm({
    dir,
    color,
    start,
    end,
    arrow,
    scale,
    opacity,
}: {
    dir: THREE.Vector3;
    color: string;
    start: number;
    end: number;
    arrow: boolean;
    /** Everything that is not a bare position scales with the ball radius. */
    scale: number;
    opacity: number;
}) {
    const points = useMemo<[Vec3, Vec3]>(
        () => [
            dir.clone().multiplyScalar(start).toArray() as Vec3,
            dir.clone().multiplyScalar(end).toArray() as Vec3,
        ],
        [dir, start, end]
    );

    const arrowPose = useMemo(() => {
        if (!arrow) return null;
        const coneHeight = 0.08 * scale;
        return {
            position: dir.clone().multiplyScalar(end - coneHeight / 2),
            quaternion: new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                dir
            ),
            args: [0.025 * scale, coneHeight, 16] as [number, number, number],
        };
    }, [arrow, dir, end, scale]);

    return (
        <>
            <Line
                points={points}
                color={color}
                lineWidth={1.5}
                transparent
                opacity={opacity}
                depthWrite={false}
                toneMapped={false}
            />
            {arrowPose && (
                <mesh
                    position={arrowPose.position}
                    quaternion={arrowPose.quaternion}
                >
                    <coneGeometry args={arrowPose.args} />
                    <meshBasicMaterial color={color} toneMapped={false} />
                </mesh>
            )}
        </>
    );
}

export default function BoundaryAxes({
    radius = 1,
    gap = 0.04,
    length = 0.4,
    fontSize = 0.07,
    opacity = 0.7,
    axes = DEFAULT_AXES,
    view,
}: BoundaryAxesProps) {
    const root = useRef<THREE.Group>(null);
    // Each material's authored opacity, captured on first sight so the fade
    // scales relative dimming (e.g. the weaker negative arms) instead of
    // flattening everything to one value.
    const baseOpacity = useRef(new WeakMap<THREE.Material, number>());
    const lastFade = useRef(-1);

    const start = radius * (1 + gap);
    const end = radius * (1 + length);
    const fs = fontSize * radius;
    const labelOffset = fs * 1.6;

    // Derive every vector once; the props are stable, so this must not
    // allocate new Vector3s on each render.
    const built = useMemo(
        () =>
            axes.map((axis) => {
                const dir = new THREE.Vector3(...axis.dir).normalize();
                return {
                    axis,
                    dir,
                    negDir: dir.clone().negate(),
                    posLabel: dir.clone().multiplyScalar(end + labelOffset),
                    negLabel: dir.clone().multiplyScalar(-(end + labelOffset * 0.8)),
                };
            }),
        [axes, end, labelOffset]
    );

    useFrame(() => {
        const g = root.current;
        if (!g) return;

        const offset = view?.current?.offset ?? 0;
        const t = Math.min(
            1,
            Math.max(0, (offset - FADE_START) / (FADE_END - FADE_START))
        );
        const fade = 1 - t * (1 - MIN_OPACITY);
        if (Math.abs(fade - lastFade.current) < 0.004) return;
        lastFade.current = fade;

        const base = baseOpacity.current;
        g.traverse((obj) => {
            const material = (obj as THREE.Mesh).material;
            if (!material) return;
            for (const m of (Array.isArray(material) ? material : [material]) as FadingMaterial[]) {
                let authored = base.get(m);
                if (authored === undefined) {
                    authored = m.opacity;
                    base.set(m, authored);
                }
                m.transparent = true;
                m.opacity = authored * fade;
                if (m.fillOpacity !== undefined) m.fillOpacity = authored * fade;
                if (m.outlineOpacity !== undefined) m.outlineOpacity = authored * fade;
            }
        });
    });

    return (
        <group ref={root}>
            {built.map(({ axis, dir, negDir, posLabel, negLabel }) => (
                <group key={axis.key}>
                    {/* Positive arm with arrowhead */}
                    <AxisArm
                        dir={dir}
                        color={axis.color}
                        start={start}
                        end={end}
                        arrow
                        scale={radius}
                        opacity={opacity}
                    />
                    {/* Negative arm */}
                    <AxisArm
                        dir={negDir}
                        color={axis.color}
                        start={start}
                        end={end}
                        arrow={false}
                        scale={radius}
                        opacity={opacity * 0.6}
                    />

                    {/* Positive end: title, description, and high label */}
                    <ConstantSizeBillboard position={posLabel.toArray() as Vec3}>
                        <Text
                            fontSize={fs}
                            color={axis.color}
                            anchorX="center"
                            anchorY="bottom"
                            outlineWidth={fs * 0.06}
                            outlineColor="#05060f"
                            letterSpacing={0.08}
                        >
                            {axis.title}
                        </Text>
                        <Text
                            position={[0, -fs * 0.15, 0]}
                            fontSize={fs * 0.6}
                            color="#c9cfe8"
                            anchorX="center"
                            anchorY="top"
                            outlineWidth={fs * 0.04}
                            outlineColor="#05060f"
                        >
                            {`${axis.description}\n+ ${axis.highLabel}`}
                        </Text>
                    </ConstantSizeBillboard>

                    {/* Negative end: short label only */}
                    <ConstantSizeBillboard position={negLabel.toArray() as Vec3}>
                        <Text
                            fontSize={fs * 0.6}
                            color={axis.color}
                            anchorX="center"
                            anchorY="middle"
                            fillOpacity={0.75}
                            outlineWidth={fs * 0.04}
                            outlineColor="#05060f"
                        >
                            {`− ${axis.lowLabel}`}
                        </Text>
                    </ConstantSizeBillboard>
                </group>
            ))}
        </group>
    );
}