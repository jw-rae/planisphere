/**
 * loader.ts
 * Load and merge all sky datasets for the planisphere renderer.
 *
 * Data sources (d3-celestial format, served from /public/data/):
 *
 *   stars.mag6.json
 *     GeoJSON FeatureCollection of Point features.
 *     feature.id            → HIP catalogue number (integer)
 *     feature.geometry      → { type: "Point", coordinates: [ra_deg, dec_deg] }
 *     feature.properties    → { mag: number, bv: string }
 *
 *   starnames.json
 *     Plain JS object keyed by HIP number as string.
 *     e.g. { "27989": { name: "Betelgeuse", bayer: "α", flam: "58", c: "Ori", desig: "α" } }
 *     name is "" when no proper name exists.
 *
 *   constellations.lines.json
 *     GeoJSON FeatureCollection of MultiLineString features.
 *     feature.id            → constellation abbreviation ("Ori", "UMa", …)
 *     coordinates in RA/Dec degrees
 *
 *   constellations.labels.json  (constellations.json renamed)
 *     GeoJSON FeatureCollection of Point features (one per constellation centroid).
 *     feature.id            → constellation abbreviation
 *     feature.geometry      → { type: "Point", coordinates: [ra_deg, dec_deg] }
 *     feature.properties    → { name: string, desig: string, rank: string, … }
 */

// ── Types ────────────────────────────────────────────

/** A fully merged star record ready for the renderer */
export interface Star {
    /** Hipparcos catalogue ID */
    hip: number;
    /** Right Ascension in decimal degrees (0–360) */
    ra: number;
    /** Declination in decimal degrees (−90 to +90) */
    dec: number;
    /** Apparent visual magnitude */
    mag: number;
    /** B−V colour index (used for star colour tinting) */
    bv: number;
    /** Proper name (e.g. "Sirius") — undefined when none */
    name?: string;
    /** Bayer Greek-letter designation (e.g. "α") — undefined when none */
    bayer?: string;
    /** Flamsteed number (e.g. "58") — undefined when none */
    flamsteed?: string;
    /** Constellation abbreviation (e.g. "Ori") — undefined when none */
    constellation?: string;
}

/** Raw starnames.json entry */
interface StarnameEntry {
    name: string;
    bayer: string;
    flam: string;
    var: string;
    hd: string;
    gl: string;
    hip: string;
    c: string;
    desig: string;
}

/** Lookup table: HIP string → StarnameEntry */
type StarnameMap = Record<string, StarnameEntry>;

/** GeoJSON FeatureCollection of constellation MultiLineString segments */
export type ConstellationLines = GeoJSON.FeatureCollection<GeoJSON.MultiLineString>;

/** Constellation centroid label for sky overlay */
export interface ConstellationLabel {
    /** Three-letter abbreviation: "Ori", "UMa", … */
    id: string;
    /** Full English name: "Orion", "Ursa Major", … */
    name: string;
    /** Right Ascension of centroid in decimal degrees */
    ra: number;
    /** Declination of centroid in decimal degrees */
    dec: number;
    /** Display rank: 1 = major, 2 = medium, 3 = minor */
    rank: number;
}

/** Aggregated sky dataset returned to the application */
export interface SkyData {
    stars: Star[];
    starMap: Map<number, Star>;
    constellationLines: ConstellationLines;
    constellationLabels: ConstellationLabel[];
}

// ── Loader ───────────────────────────────────────────

// import.meta.env.BASE_URL is injected by Vite and equals the configured base
// (e.g. '/apps/planisphere/' in deploy builds, '/' in dev). Trailing slash is
// guaranteed by Vite so we strip it before appending '/data'.
const DATA_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/data`;

export async function loadSkyData(): Promise<SkyData> {
    const [starsRaw, starnamesRaw, linesRaw, labelsRaw] = await Promise.all([
        fetch(`${DATA_BASE}/stars.mag6.json`).then((r) => r.json()) as Promise<GeoJSON.FeatureCollection>,
        fetch(`${DATA_BASE}/starnames.json`).then((r) => r.json()) as Promise<StarnameMap>,
        fetch(`${DATA_BASE}/constellations.lines.json`).then((r) => r.json()) as Promise<GeoJSON.FeatureCollection>,
        fetch(`${DATA_BASE}/constellations.labels.json`).then((r) => r.json()) as Promise<GeoJSON.FeatureCollection>,
    ]);

    const stars: Star[] = parseStars(starsRaw, starnamesRaw);
    const starMap = new Map<number, Star>(stars.map((s) => [s.hip, s]));
    const constellationLines = linesRaw as ConstellationLines;
    const constellationLabels: ConstellationLabel[] = parseLabels(labelsRaw);

    return { stars, starMap, constellationLines, constellationLabels };
}

// ── Parsers ──────────────────────────────────────────

/**
 * Parse d3-celestial stars.6.json GeoJSON and merge with starnames lookup.
 *
 * d3-celestial star schema:
 *   feature.id                    → HIP number (integer stored as feature id, NOT in properties)
 *   feature.geometry.coordinates  → [ra_deg, dec_deg]
 *   feature.properties.mag        → apparent magnitude
 *   feature.properties.bv         → B−V colour index (string)
 */
function parseStars(
    raw: GeoJSON.FeatureCollection,
    names: StarnameMap,
): Star[] {
    return raw.features.map((f: GeoJSON.Feature) => {
        const hip = Number(f.id ?? 0);
        const coords = (f.geometry as GeoJSON.Point).coordinates;
        const p = f.properties ?? {};
        const entry = names[String(hip)];

        const name = entry?.name?.trim() || undefined;
        const bayer = entry?.bayer?.trim() || undefined;
        const flamsteed = entry?.flam?.trim() || undefined;
        const constellation = entry?.c?.trim() || undefined;

        return {
            hip,
            ra: coords[0],
            dec: coords[1],
            mag: Number(p['mag'] ?? 99),
            bv: parseFloat(String(p['bv'] ?? '0')) || 0,
            name,
            bayer,
            flamsteed,
            constellation,
        } satisfies Star;
    });
}

/**
 * Parse d3-celestial constellations.json (renamed to constellations.labels.json).
 *
 * Schema:
 *   feature.id                    → abbreviation string ("And", "Ori", …)
 *   feature.geometry.coordinates  → [ra_deg, dec_deg] centroid
 *   feature.properties.name       → full English name
 *   feature.properties.rank       → "1" | "2" | "3"
 */
function parseLabels(raw: GeoJSON.FeatureCollection): ConstellationLabel[] {
    return raw.features.map((f: GeoJSON.Feature) => {
        const coords = (f.geometry as GeoJSON.Point).coordinates;
        const p = f.properties ?? {};
        return {
            id: String(f.id ?? p['desig'] ?? ''),
            name: String(p['name'] ?? p['desig'] ?? ''),
            ra: coords[0],
            dec: coords[1],
            rank: Number(p['rank'] ?? 3),
        } satisfies ConstellationLabel;
    });
}
