// Components/Point.tsx
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface PointState {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
}

interface PointProps {
    state: { current: PointState };
    /** Base size multiplier, applied on top of state.scale */
    scale?: number;
    /** true = red (baseball), false = green (basketball) */
    isBaseball?: boolean;
}

const RED = "#ff3b4e";
const GREEN = "#2bff88";

// Shared across all points so thousands of them don't each allocate geometry
const sphereGeometry = new THREE.SphereGeometry(1, 48, 48);

const haloVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const haloFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewDir))), uPower);
    float a = fres * uIntensity;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

export default function Point({
    state,
    scale = 1,
    isBaseball = false,
}: PointProps) {
    const group = useRef<THREE.Group>(null!);

    const color = isBaseball ? RED : GREEN;

    const haloUniforms = useMemo(
        () => ({
            uColor: { value: new THREE.Color(color) },
            uPower: { value: 2.5 },
            uIntensity: { value: 1.2 },
        }),
        [color]
    );

    useFrame(() => {
        const { position, rotation, scale: s } = state.current;
        group.current.position.set(...position);
        group.current.rotation.set(...rotation);
        group.current.scale.setScalar(s * scale);
    });

    return (
        <group ref={group}>
            {/* Core: glossy, slightly self-lit sphere */}
            <mesh geometry={sphereGeometry}>
                <meshPhysicalMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.5}
                    roughness={0.25}
                    metalness={0.1}
                    clearcoat={1}
                    clearcoatRoughness={0.15}
                />
            </mesh>

            {/* Halo: soft additive rim glow around the core */}
            <mesh geometry={sphereGeometry} scale={1.35}>
                <shaderMaterial
                    vertexShader={haloVertex}
                    fragmentShader={haloFragment}
                    uniforms={haloUniforms}
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    toneMapped={false}
                />
            </mesh>
        </group>
    );
}