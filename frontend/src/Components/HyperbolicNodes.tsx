import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import Point, { type PointState } from "./Point";
import {
    type Mat4, type Vec3, identity, mul, ballToHyperboloid,
    applyToBall, translateBall, focusStep,
} from "../hyperbolic";

interface Props {
    positions: Vec3[];        // base Poincaré ball coordinates from the backend
    isBaseball: boolean[];    // same length as positions
    nodeScale?: number;       // sphere size at the center of the view
    radius?: number;
}

const MAX_R = 0.95; // clamp cursor hits so we never grab "infinity"

export default function HyperbolicNodes({ positions, isBaseball, nodeScale = 0.05, radius = 1 }: Props) {
    const { gl, camera } = useThree();

    const view = useRef<Mat4>(identity());
    const hyper = useMemo(() => positions.map(ballToHyperboloid), [positions]);
    const states = useMemo(
        () =>
            positions.map(() => ({
                current: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 } as PointState,
            })),
        [positions]
    );

    const anim = useRef<{ start: Mat4; target: Vec3; t: number; dur: number } | null>(null);

    // --- Mouse -> point on the z=0 plane (in displayed ball coordinates) ---
    const raycaster = useMemo(() => new THREE.Raycaster(), []);
    const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);

    function cursorToBall(e: PointerEvent): Vec3 | null {
        const rect = gl.domElement.getBoundingClientRect();
        const ndc = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        raycaster.setFromCamera(ndc, camera);
        const hit = new THREE.Vector3();
        if (!raycaster.ray.intersectPlane(plane, hit)) return null;
        hit.divideScalar(radius); // world -> unit ball
        const len = hit.length();
        if (len > MAX_R) hit.multiplyScalar(MAX_R / len);
        return [hit.x, hit.y, hit.z];
    }

    // --- Drag to pan ---
    useEffect(() => {
        const el = gl.domElement;
        let last: Vec3 | null = null;

        const down = (e: PointerEvent) => {
            last = cursorToBall(e);
            anim.current = null; // user input cancels any focus animation
            el.setPointerCapture(e.pointerId);
        };
        const move = (e: PointerEvent) => {
            if (!last) return;
            const cur = cursorToBall(e);
            if (!cur) return;
            // Move the grabbed point to the cursor; compose onto the view
            view.current = mul(translateBall(last, cur), view.current);
            last = cur;
        };
        const up = (e: PointerEvent) => {
            last = null;
            el.releasePointerCapture(e.pointerId);
        };

        el.addEventListener("pointerdown", down);
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerup", up);
        return () => {
            el.removeEventListener("pointerdown", down);
            el.removeEventListener("pointermove", move);
            el.removeEventListener("pointerup", up);
        };
    }, [gl, camera, radius]);

    // --- Click-to-focus: call this from a Point's onClick, or a list UI ---
    const focusOn = (index: number) => {
        const p = applyToBall(view.current, hyper[index], [0, 0, 0]);
        anim.current = { start: view.current, target: p, t: 0, dur: 0.8 };
    };
    const reset = () => {
        view.current = identity();
        anim.current = null;
    };
    // expose however you like (context, ref, zustand); omitted for brevity
    void focusOn; void reset;

    // --- Per-frame update ---
    const tmp = useMemo<Vec3>(() => [0, 0, 0], []);
    useFrame((_, dt) => {
        const a = anim.current;
        if (a) {
            a.t = Math.min(1, a.t + dt / a.dur);
            const eased = a.t * a.t * (3 - 2 * a.t); // smoothstep
            view.current = mul(focusStep(a.target, eased), a.start);
            if (a.t >= 1) anim.current = null;
        }

        for (let i = 0; i < hyper.length; i++) {
            applyToBall(view.current, hyper[i], tmp);
            const s = tmp[0] * tmp[0] + tmp[1] * tmp[1] + tmp[2] * tmp[2];
            const st = states[i].current;
            st.position = [tmp[0] * radius, tmp[1] * radius, tmp[2] * radius];
            st.scale = Math.max(0.05, 1 - s);
        }
    });

    return (
        <>
            {states.map((state, i) => (
                <Point key={i} state={state} scale={nodeScale * radius} isBaseball={isBaseball[i]} />
            ))}
        </>
    );
}