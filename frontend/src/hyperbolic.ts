export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];
export type Mat4 = Float64Array; // row-major 4x4 Lorentz matrix

export const identity = (): Mat4 =>
    new Float64Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

export function mul(a: Mat4, b: Mat4): Mat4 {
    const out = new Float64Array(16);
    for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++) {
            let s = 0;
            for (let k = 0; k < 4; k++) s += a[r * 4 + k] * b[k * 4 + c];
            out[r * 4 + c] = s;
        }
    return out;
}

/** Poincaré ball -> hyperboloid (x0 is the "time" coordinate) */
export function ballToHyperboloid(p: Vec3): Vec4 {
    const s = p[0] * p[0] + p[1] * p[1] + p[2] * p[2];
    const d = 1 - s;
    return [(1 + s) / d, (2 * p[0]) / d, (2 * p[1]) / d, (2 * p[2]) / d];
}

/** Apply a view matrix to a hyperboloid point and project back to the ball */
export function applyToBall(m: Mat4, h: Vec4, out: Vec3): Vec3 {
    const x0 = m[0] * h[0] + m[1] * h[1] + m[2] * h[2] + m[3] * h[3];
    const x1 = m[4] * h[0] + m[5] * h[1] + m[6] * h[2] + m[7] * h[3];
    const x2 = m[8] * h[0] + m[9] * h[1] + m[10] * h[2] + m[11] * h[3];
    const x3 = m[12] * h[0] + m[13] * h[1] + m[14] * h[2] + m[15] * h[3];
    const k = 1 / (1 + x0);
    out[0] = x1 * k;
    out[1] = x2 * k;
    out[2] = x3 * k;
    return out;
}

/** Pure translation (boost) that moves the origin to hyperboloid point h */
export function boost(h0: number, hx: number, hy: number, hz: number): Mat4 {
    const f = 1 / (1 + h0);
    return new Float64Array([
        h0, hx, hy, hz,
        hx, 1 + hx * hx * f, hx * hy * f, hx * hz * f,
        hy, hy * hx * f, 1 + hy * hy * f, hy * hz * f,
        hz, hz * hx * f, hz * hy * f, 1 + hz * hz * f,
    ]);
}

/** Isometry that moves ball point a to ball point b */
export function translateBall(a: Vec3, b: Vec3): Mat4 {
    const ha = ballToHyperboloid(a);
    const hb = ballToHyperboloid(b);
    const aToOrigin = boost(ha[0], -ha[1], -ha[2], -ha[3]);
    const originToB = boost(hb[0], hb[1], hb[2], hb[3]);
    return mul(originToB, aToOrigin);
}

/**
 * Isometry that moves the origin-bound point c a fraction t (0..1) of the
 * way along the geodesic to the center. Used for click-to-focus animation.
 */
export function focusStep(c: Vec3, t: number): Mat4 {
    const h = ballToHyperboloid(c);
    const dist = Math.acosh(Math.max(1, h[0]));
    const len = Math.hypot(h[1], h[2], h[3]);
    if (len < 1e-9) return identity();
    const ux = h[1] / len, uy = h[2] / len, uz = h[3] / len;
    const sh = Math.sinh(t * dist);
    return boost(Math.cosh(t * dist), -sh * ux, -sh * uy, -sh * uz);
}