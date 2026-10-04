import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { PoincareBoundary } from "./Components/PoincareBoundary";
import Legend from "./Components/Legend";
import HyperbolicNodes, { type HyperbolicViewApi } from "./Components/HyperbolicNodes";
import BoundaryAxes from "./Components/BoundaryAxes";
import type { Vec3 } from "./hyperbolic";
import { MOUSE } from "three";
import { OrbitControls } from "@react-three/drei";
import PlayerPanel from "./Components/PlayerPanel";
import ComparePanel from "./Components/ComparePanel";
import ViewControls from "./Components/ViewControls";
import HintBar from "./Components/HintBar";
import Panel from "./Components/Panel";
import type { Athlete } from "./models";


const POINCARE_RADIUS = 3.0;
const CAMERA_FOV = 50;
/**
 * The axes reach ~1.6x radius including their labels, so the camera has to sit
 * far enough back that all of it fits inside the vertical field of view:
 * distance >= extent / sin(fov / 2).
 */
const CAMERA_DISTANCE = (POINCARE_RADIUS * 1.5) / Math.sin((CAMERA_FOV / 2) * (Math.PI / 180));
const CAMERA_POSITION: Vec3 = [CAMERA_DISTANCE, CAMERA_DISTANCE + 3, CAMERA_DISTANCE]
    .map((v) => v / Math.sqrt(3)) as Vec3;

const VISUAL_DESCRIPTION =
    "Interactive 3D plot of NBA and NHL players inside a Poincare ball. Every point is one " +
    "player, colour-coded by sport and sized by games played. Select a point to read that " +
    "player's offense, defense and physicality ratings.";

export default function App() {
    const [players, setPlayers] = useState<Athlete[] | null>(null);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                const [basketballResponse, hockeyResponse] = await Promise.all([
                    fetch("/api/players?sport=basketball"),
                    fetch("/api/players?sport=hockey"),
                ]);

                const [basketballData, hockeyData] = await Promise.all([
                    basketballResponse.json(),
                    hockeyResponse.json(),
                ]);

                setPlayers((currentPlayers) => [
                    ...(currentPlayers ?? []),
                    ...basketballData,
                    ...hockeyData,
                ]);
            } catch (error) {
                console.error(error);
                setLoadError(true);
            }
        };

        void fetchPlayers();
    }, []);

    const view = useRef<HyperbolicViewApi>(null);
    /**
     * Two independent slots, stored as indices into `players` so the two picks
     * can never collide on an id. In Locked mode the first player picked becomes
     * the active one and stays there, and every later click refills the
     * comparison slot instead, so the active profile is never yanked out from
     * under the user. Unlocked mode has no fixed anchor to compare against, so
     * it only ever holds the active player.
     */
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [compareIndex, setCompareIndex] = useState<number | null>(null);
    const [recenterOnClick, setRecenterOnClick] = useState(true);
    /** Mirrors the selection into a live region, since the canvas itself is not announced. */
    const [announcement, setAnnouncement] = useState("");

    const player = activeIndex === null ? null : players?.[activeIndex] ?? null;
    const compare = compareIndex === null ? null : players?.[compareIndex] ?? null;

    const clearSelection = useCallback(() => {
        setActiveIndex(null);
        setCompareIndex(null);
        setAnnouncement("Players deselected.");
    }, []);

    const onSelect = useCallback(
        (index: number) => {
            const selected = players?.[index] ?? null;
            if (selected === null) {
                clearSelection();
                return;
            }

            // In Unlocked (re-centering) mode the view is driven by the click, so
            // there is no fixed player to compare against: each click simply
            // replaces the active player and drops the comparison.
            if (recenterOnClick) {
                setActiveIndex(index);
                setCompareIndex(null);
                setAnnouncement(`${selected.name} selected as the active player.`);
                return;
            }

            // Clicking the active player again is a no-op: the active player is
            // the anchor the comparison is read against.
            if (index === activeIndex) {
                setAnnouncement(`${selected.name} is already the active player.`);
                return;
            }

            if (activeIndex === null) {
                setActiveIndex(index);
                setAnnouncement(`${selected.name} selected as the active player.`);
                return;
            }

            setCompareIndex(index);
            setAnnouncement(
                compareIndex === null
                    ? `${selected.name} selected as the comparison player.`
                    : `${selected.name} replaced as the comparison player.`
            );
        },
        [activeIndex, clearSelection, compareIndex, players, recenterOnClick]
    );

    /** Exchanges the two slots, so either player can become the active one. */
    const swapSelection = useCallback(() => {
        if (activeIndex === null || compareIndex === null) return;
        setActiveIndex(compareIndex);
        setCompareIndex(activeIndex);
        setAnnouncement(`${compare?.name} is now the active player.`);
    }, [activeIndex, compare, compareIndex]);

    const clearCompare = useCallback(() => {
        setCompareIndex(null);
        setAnnouncement("Comparison player cleared.");
    }, []);

    /**
     * Flipping the recenter lock invalidates the comparison: with the view
     * pinned on the active player, a second profile read against it is no
     * longer what the user is looking at, so the comparison starts clean.
     */
    const onRecenterOnClickChange = useCallback((value: boolean) => {
        setRecenterOnClick(value);
        setCompareIndex(null);
    }, []);

    const reset = useCallback(() => {
        view.current?.reset();
        clearSelection();
        // A reset returns the view to the league average, so the recenter lock
        // goes back to its default: clicks fly points to the centre again.
        setRecenterOnClick(true);
    }, [clearSelection]);

    // Keyboard equivalents for the pointer gestures, so the view can be driven
    // without a mouse.
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            // Never swallow keys meant for a focused control or a modified
            // shortcut such as Ctrl+R.
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            const target = event.target;
            if (target instanceof HTMLElement && (target.isContentEditable || target.tagName === "INPUT")) return;

            if (event.key === "r" || event.key === "R") reset();
            else if (event.key === "Escape") clearSelection();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [clearSelection, reset]);

    return (
        <main className="relative h-screen w-screen overflow-hidden select-none">
            {/* The canvas is decorative for assistive tech; the HUD and the live
                region below carry everything worth reading out. */}
            <div className="absolute inset-0 touch-none" aria-hidden="true">
                <Canvas
                    camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
                    onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
                >
                    <ambientLight intensity={0.5} />
                    <color attach="background" args={["#05060f"]} />
                    {/* RIGHT defaults to PAN; leave it unmapped so right-drag only pans the hyperbolic nodes. */}
                    <OrbitControls
                        mouseButtons={{
                            LEFT: MOUSE.ROTATE,
                            MIDDLE: MOUSE.DOLLY,
                            RIGHT: undefined,
                        }}
                        minDistance={2} maxDistance={15}
                    />

                    <PoincareBoundary radius={POINCARE_RADIUS} />
                    <HyperbolicNodes
                        players={players}
                        radius={POINCARE_RADIUS}
                        apiRef={view}
                        onSelect={onSelect}
                        recenterOnClick={recenterOnClick}
                        activeIndex={activeIndex}
                        compareIndex={compareIndex}
                    />
                    <BoundaryAxes radius={POINCARE_RADIUS} view={view} />

                    <EffectComposer>
                        <Bloom luminanceThreshold={0.2} mipmapBlur />
                    </EffectComposer>
                </Canvas>
            </div>

            <p className="sr-only">{VISUAL_DESCRIPTION}</p>
            <p aria-live="polite" className="sr-only">
                {announcement}
            </p>

            {players === null ? (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-3">
                    {loadError ? (
                        <Panel title="Could not load players">
                            <p role="alert" className="text-xs leading-relaxed text-slate-300">
                                The player data could not be fetched from the API. Check that the
                                backend is running, then reload the page.
                            </p>
                        </Panel>
                    ) : (
                        <Panel title="Loading">
                            <p role="status" className="text-xs text-slate-300">
                                Fetching player data&hellip;
                            </p>
                        </Panel>
                    )}
                </div>
            ) : (
                <>
                    {/* Top row: what this is, the current selection, the controls. */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3">
                        {/* Two stacked panels can outgrow a short viewport, so the
                            column scrolls rather than clipping the comparison. */}
                        <div className="flex max-h-[calc(100vh-1.5rem)] min-w-0 flex-col gap-2 overflow-y-auto">
                            <header className="max-w-72 mb-4">
                                <h1 className="text-4xl font-bold leading-tight text-white mb-2">
                                    Hyperlytics
                                </h1>
                                <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
                                    NBA and NHL players compared on offense, defense and
                                    physicality.
                                </p>
                            </header>
                            <PlayerPanel
                                player={player}
                                recenterOnClick={recenterOnClick}
                                onRecenterOnClickChange={onRecenterOnClickChange}
                            />
                            <ComparePanel
                                player={compare}
                                enabled={!recenterOnClick}
                                onSwap={swapSelection}
                                onClear={clearCompare}
                            />
                        </div>

                        <ViewControls onReset={reset} />
                    </div>

                    {/* Bottom row: the key, plus gestures that apply everywhere. */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end p-3">
                        <Legend />
                    </div>
                    {/* Anchored to the viewport, not the bottom row, so it stays
                        centred no matter how wide the legend is. */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 hidden justify-center px-3 md:flex">
                        <HintBar />
                    </div>
                </>
            )}
        </main>
    );
}