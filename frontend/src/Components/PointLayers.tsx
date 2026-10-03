// Components/PointLayers.tsx
import { createInstances } from "@react-three/drei";
import * as THREE from "three";
import { useMemo } from "react";

const RED = "#ff3b4e";
const GREEN = "#2bff88";

const coreGeometry = new THREE.SphereGeometry(1, 48, 48);
// Halo scale baked into geometry so instances share one transform
const haloGeometry = new THREE.SphereGeometry(1.35, 32, 32);

const haloVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    mat4 m = modelViewMatrix;
    #ifdef USE_INSTANCING
      m = m * instanceMatrix;
    #endif
    vNormal = normalize(mat3(m) * normal); // fine for uniform scale
    vec4 mv = m * vec4(position, 1.0);
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

function makeLayer(color: string) {
    const [CoreParent, CoreInstance] = createInstances();
    const [HaloParent, HaloInstance] = createInstances();

    function Layer({ children, limit }: { children: React.ReactNode; limit: number }) {
        const haloUniforms = useMemo(
            () => ({
                uColor: { value: new THREE.Color(color) },
                uPower: { value: 2.5 },
                uIntensity: { value: 1.2 },
            }),
            []
        );

        return (
            <CoreParent geometry={coreGeometry} limit={limit} frustumCulled={false}>
                <meshPhysicalMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.5}
                    roughness={0.25}
                    metalness={0.1}
                    clearcoat={1}
                    clearcoatRoughness={0.15}
                />
                <HaloParent
                    geometry={haloGeometry}
                    limit={limit}
                    frustumCulled={false}
                    raycast={() => null} // halo must not steal clicks
                    renderOrder={1}
                >
                    <shaderMaterial
                        vertexShader={haloVertex}
                        fragmentShader={haloFragment}
                        uniforms={haloUniforms}
                        transparent
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                        toneMapped={false}
                    />
                    {children}
                </HaloParent>
            </CoreParent>
        );
    }

    return { Layer, CoreInstance, HaloInstance };
}

export const hockeyLayer = makeLayer(RED);
export const basketballLayer = makeLayer(GREEN);

/** Wrap all <Point/>s in this. `limit` = max points per team. */
export function PointLayers({
    children,
    limit = 10000,
}: {
    children: React.ReactNode;
    limit?: number;
}) {
    return (
        <hockeyLayer.Layer limit={limit}>
            <basketballLayer.Layer limit={limit}>{children}</basketballLayer.Layer>
        </hockeyLayer.Layer>
    );
}