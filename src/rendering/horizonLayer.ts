/**
 * horizonLayer.ts
 * Render the horizon ring, cardinal direction labels (N/E/S/W), and ZENITH marker.
 *
 * Planisphere sky-up orientation (observer looking up):
 *   North at TOP    (−y direction)
 *   South at BOTTOM (+y direction)
 *   East  at LEFT   (−x direction — mirrored from map convention)
 *   West  at RIGHT  (+x direction)
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

// Screen-space positions for each cardinal (cx/cy offset applied by caller)
const CARDINALS: { label: string; dx: number; dy: number }[] = [
    { label: 'N', dx: 0, dy: -1 },
    { label: 'S', dx: 0, dy: 1 },
    { label: 'E', dx: -1, dy: 0 },
    { label: 'W', dx: 1, dy: 0 },
];

/**
 * Render the horizon ring, cardinal labels, and zenith marker.
 *
 * @param layer    — <g id="layer-horizon">
 * @param cx       — SVG x of the sky center (zenith)
 * @param cy       — SVG y of the sky center (zenith)
 * @param radiusPx — horizon circle radius in SVG pixels
 */
export function renderHorizonLayer(
    layer: SVGGElement,
    cx: number,
    cy: number,
    radiusPx: number,
): void {
    layer.replaceChildren();

    // ── Horizon ring ─────────────────────────────────────────────
    const ring = document.createElementNS(SVG_NS, 'circle');
    ring.setAttribute('cx', String(cx));
    ring.setAttribute('cy', String(cy));
    ring.setAttribute('r', String(radiusPx));
    ring.setAttribute('class', 'horizon-ring');
    layer.appendChild(ring);

    // ── Cardinal labels ───────────────────────────────────────────
    const labelOffset = radiusPx + 18;

    for (const { label, dx, dy } of CARDINALS) {
        const text = document.createElementNS(SVG_NS, 'text');
        text.setAttribute('x', String(cx + dx * labelOffset));
        text.setAttribute('y', String(cy + dy * labelOffset));
        text.setAttribute('class', 'cardinal-label');
        text.textContent = label;
        layer.appendChild(text);
    }

    // ── Zenith marker ─────────────────────────────────────────────
    const zenith = document.createElementNS(SVG_NS, 'text');
    zenith.setAttribute('x', String(cx));
    zenith.setAttribute('y', String(cy - 8));
    zenith.setAttribute('class', 'zenith-label');
    zenith.textContent = 'ZENITH';
    layer.appendChild(zenith);

    // Small crosshair dot at zenith
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(cx));
    dot.setAttribute('cy', String(cy));
    dot.setAttribute('r', '2');
    dot.setAttribute('class', 'zenith-dot');
    layer.appendChild(dot);
}
