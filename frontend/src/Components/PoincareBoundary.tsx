import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vPos;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    vPos = position;
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uIntensity;
  uniform float uTime;
  uniform float uShimmer;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vPos;

  void main() {
    // abs() so it works whether the camera is inside or outside the sphere
    float fres = pow(
      1.0 - abs(dot(normalize(vNormal), normalize(vViewDir))),
      uPower
    );

    float shimmer = 1.0 - uShimmer + uShimmer *
      (0.5 + 0.5 * sin(uTime * 0.5 + vPos.y * 6.0 + vPos.x * 4.0));

    float a = fres * uIntensity * shimmer;
    gl_FragColor = vec4(uColor * a, a);
  }
`

export interface PoincareBoundaryProps {
    radius?: number
    color?: string
    /** Higher = thinner rim glow */
    power?: number
    intensity?: number
    /** 0 disables the shimmer, 1 is strongest */
    shimmer?: number
    /** True if the camera lives inside the ball */
    inside?: boolean
    /** Faint latitude/longitude lines on the shell */
    graticule?: boolean
    graticuleOpacity?: number
}

export function PoincareBoundary({
    radius = 3,
    color = '#7c6cff',
    power = 3,
    intensity = 1.5,
    shimmer = 0.1,
    inside = false,
    graticule = true,
    graticuleOpacity = 0.04,
}: PoincareBoundaryProps) {
    const uniforms = useMemo(
        () => ({
            uColor: { value: new THREE.Color(color) },
            uPower: { value: power },
            uIntensity: { value: intensity },
            uTime: { value: 0 },
            uShimmer: { value: shimmer },
        }),
        [color, power, intensity, shimmer]
    )

    useFrame((_, dt) => {
        // Nothing animates when the shimmer is switched off.
        if (uniforms.uShimmer.value === 0) return
        uniforms.uTime.value += dt
    })

    return (
        <group scale={radius}>
            <mesh>
                <sphereGeometry args={[1, 128, 128]} />
                <shaderMaterial
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    uniforms={uniforms}
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    side={inside ? THREE.BackSide : THREE.FrontSide}
                    toneMapped={false}
                />
            </mesh>

            {graticule && (
                <mesh>
                    <sphereGeometry args={[1.001, 32, 16]} />
                    <meshBasicMaterial
                        color={color}
                        wireframe
                        transparent
                        opacity={graticuleOpacity}
                        depthWrite={false}
                        toneMapped={false}
                    />
                </mesh>
            )}
        </group>
    )
}