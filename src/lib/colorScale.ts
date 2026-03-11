/**
 * Maps carbon intensity (gCO2/kWh) to a hex colour.
 * 0   → #00fff5 (cyan)
 * 150 → #f59e0b (amber)
 * 300+→ #ef4444 (red)
 */
export function ciToColor(gCO2: number): string {
  const v = Math.max(0, Math.min(gCO2, 400));

  if (v <= 150) {
    // cyan → amber
    const t = v / 150;
    return interpolateHex('#00fff5', '#f59e0b', t);
  } else {
    // amber → red
    const t = (v - 150) / 250;
    return interpolateHex('#f59e0b', '#ef4444', Math.min(t, 1));
  }
}

function interpolateHex(a: string, b: string, t: number): string {
  const ra = parseInt(a.slice(1, 3), 16);
  const ga = parseInt(a.slice(3, 5), 16);
  const ba = parseInt(a.slice(5, 7), 16);
  const rb = parseInt(b.slice(1, 3), 16);
  const gb = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ra + (rb - ra) * t);
  const g = Math.round(ga + (gb - ga) * t);
  const bl = Math.round(ba + (bb - ba) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

export function ciToOpacity(gCO2: number): number {
  return 0.5 + Math.min(gCO2 / 400, 1) * 0.5;
}
