import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import Point, { type PointState } from "./Point";
import {
    type Mat4, type Vec3, identity, mul, ballToHyperboloid,
    applyToBall, translateBall, focusStep, viewOffset,
} from "../hyperbolic";

/** Imperative handle for the surrounding UI (reset button, tooltips, ...). */
export interface HyperbolicViewApi {
    /** Animate the given node to the centre of the ball. */
    focusOn(index: number): void;
    /** Return to the league-average view. */
    reset(): void;
    /** Live hyperbolic distance between the current view and the league average. */
    offset: number;
}

interface Props {
    positions: Vec3[];        // base Poincare ball coordinates from the backend
    isHockey: boolean[];    // same length as positions
    nodeScale?: number;       // sphere size at the center of the view
    radius?: number;
    /** Populated with the imperative handle; see HyperbolicViewApi. */
    apiRef?: RefObject<HyperbolicViewApi | null>;
    /** Seconds for the click-to-focus animation. */
    focusDuration?: number;
}

const MAX_R = 0.95;          // clamp cursor hits so we never grab "infinity"
const DRAG_SLOP_PX = 6;      // movement below this still counts as a click, not a drag
const FOCUS_DURATION = 0.8;

export default function HyperbolicNodes({
    positions,
    isHockey,
    nodeScale = 0.05,
    radius = 1,
    apiRef,
    focusDuration = FOCUS_DURATION,
}: Props) {
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

    // Where the pointer went down, in client pixels. Compared against later
    // pointer positions so a drag never also registers as a click.
    const downPx = useRef<{ x: number; y: number } | null>(null);

    // --- Mouse -> point on the z=0 plane (in displayed ball coordinates) ---
    const raycaster = useMemo(() => new THREE.Raycaster(), []);
    const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
    const scratch = useMemo(() => new THREE.Vector3(), []);

    const cursorToBall = useCallback(
        (clientX: number, clientY: number): Vec3 | null => {
            const rect = gl.domElement.getBoundingClientRect();
            const ndc = new THREE.Vector2(
                ((clientX - rect.left) / rect.width) * 2 - 1,
                -((clientY - rect.top) / rect.height) * 2 + 1
            );
            raycaster.setFromCamera(ndc, camera);
            if (!raycaster.ray.intersectPlane(plane, scratch)) return null;
            scratch.divideScalar(radius); // world -> unit ball
            const len = scratch.length();
            if (len > MAX_R) scratch.multiplyScalar(MAX_R / len);
            return [scratch.x, scratch.y, scratch.z];
        },
        [camera, gl, plane, radius, raycaster, scratch]
    );

    const focusOn = useCallback(
        (index: number) => {
            const h = hyper[index];
            if (!h) return;
            const p = applyToBall(view.current, h, [0, 0, 0]);
            anim.current = { start: view.current, target: p, t: 0, dur: focusDuration };
        },
        [focusDuration, hyper]
    );

    const reset = useCallback(() => {
        view.current = identity();
        anim.current = null;
    }, []);

    // Publish the imperative handle. `offset` is mutated in place every frame,
    // so consumers can read it without triggering React re-renders.
    const api = useMemo<HyperbolicViewApi>(
        () => ({ focusOn, reset, offset: 0 }),
        [focusOn, reset]
    );
    useEffect(() => {
        if (apiRef) apiRef.current = api;
    }, [api, apiRef]);

    // --- Drag to pan ---
    useEffect(() => {
        const el = gl.domElement;
        let activeId: number | null = null;
        let last: Vec3 | null = null;

        // The canvas owns every gesture, so keep the browser out of the way.
        const prevTouchAction = el.style.touchAction;
        el.style.touchAction = "none";

        const release = (e: PointerEvent) => {
            if (activeId !== e.pointerId) return;
            activeId = null;
            last = null;
            if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
        };

        const down = (e: PointerEvent) => {
            // Ignore extra fingers / non-primary buttons so pinch-zoom still works.
            if (activeId !== null) return;
            if (!e.isPrimary) return;
            // Panning is a deliberate gesture: hold the right mouse button. Touch
            // and pen have no right button, so they keep dragging to pan.
            if (e.pointerType === "mouse" && e.button !== 2) return;

            activeId = e.pointerId;
            // Only a left/primary press can become a click, so a right-button pan
            // must not seed the click-vs-drag test.
            downPx.current = e.button === 0 ? { x: e.clientX, y: e.clientY } : null;
            last = cursorToBall(e.clientX, e.clientY);
            anim.current = null; // user input cancels any focus animation
            el.setPointerCapture(e.pointerId);
        };

        const move = (e: PointerEvent) => {
            if (activeId !== e.pointerId || !last) return;
            const cur = cursorToBall(e.clientX, e.clientY);
            if (!cur) return;
            // Move the grabbed point to the cursor; compose onto the view.
            // mul() rows dot h, so mul(T, view) applies T to the base position
            // first and the accumulated view afterwards, which is what keeps
            // the grabbed point pinned under the cursor.
            view.current = mul(translateBall(last, cur), view.current);
            last = cur;
        };

        const up = (e: PointerEvent) => {
            downPx.current = null;
            release(e);
        };

        const cancel = (e: PointerEvent) => {
            // A cancelled gesture must never be mistaken for a click.
            downPx.current = null;
            release(e);
        };

        el.addEventListener("pointerdown", down);
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerup", up);
        el.addEventListener("pointercancel", cancel);
        // Right-drag is panning, not a context-menu request.
        const onContextMenu = (e: Event) => e.preventDefault();
        el.addEventListener("contextmenu", onContextMenu);
        return () => {
            el.removeEventListener("pointerdown", down);
            el.removeEventListener("pointermove", move);
            el.removeEventListener("pointerup", up);
            el.removeEventListener("pointercancel", cancel);
            el.removeEventListener("contextmenu", onContextMenu);
            el.style.touchAction = prevTouchAction;
        };
    }, [cursorToBall, gl]);

    const onSelect = useCallback(
        (index: number, e: ThreeEvent<PointerEvent>) => {
            // Swallow the click if this pointer gesture was actually a drag.
            const d = downPx.current;
            if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > DRAG_SLOP_PX) return;
            e.stopPropagation();
            focusOn(index);
        },
        [focusOn]
    );

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

        api.offset = viewOffset(view.current);

        for (let i = 0; i < hyper.length; i++) {
            applyToBall(view.current, hyper[i], tmp);
            const s = tmp[0] * tmp[0] + tmp[1] * tmp[1] + tmp[2] * tmp[2];
            const st = states[i].current;
            // Mutate in place: allocating a tuple per node per frame churns GC.
            st.position[0] = tmp[0] * radius;
            st.position[1] = tmp[1] * radius;
            st.position[2] = tmp[2] * radius;
            st.scale = Math.max(0.05, 1 - s);
        }
    });

    return (
        <>
            {states.map((state, i) => (
                <Point
                    key={i}
                    state={state}
                    scale={nodeScale * radius}
                    isHockey={isHockey[i] ?? false}
                    onClick={(e) => onSelect(i, e)}
                />
            ))}
        </>
    );
}