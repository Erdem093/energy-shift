"""
generate_uk_map.py
Downloads UK NUTS1 regional boundaries from Eurostat GISCO and creates a
GeoJSON file mapped to Carbon Intensity API region IDs.

Outputs: ../public/data/uk_dno_regions.json
"""

import json
import math
import requests
from typing import Optional
from pathlib import Path

OUTPUT_PATH = Path(__file__).parent.parent / "public" / "data" / "uk_dno_regions.json"

# UK NUTS1 codes → Carbon Intensity API region IDs mapping
# Some NUTS1 regions map to 2 CI regions (Scotland, Wales)
# We use a best approximation with 12 NUTS1 → 14 CI zones
NUTS1_TO_CI = {
    "UKC": {"regionId": 4, "shortName": "North East England"},
    "UKD": {"regionId": 3, "shortName": "North West England"},
    "UKE": {"regionId": 5, "shortName": "Yorkshire"},
    "UKF": {"regionId": 9, "shortName": "East Midlands"},
    "UKG": {"regionId": 8, "shortName": "West Midlands"},
    "UKH": {"regionId": 10, "shortName": "East England"},
    "UKI": {"regionId": 13, "shortName": "London"},
    # UKJ is split into South England (12) and South East England (14)
    "UKK": {"regionId": 11, "shortName": "South West England"},
    "UKL": {"regionId": 7,  "shortName": "South Wales"},
    "UKM": {"regionId": 2,  "shortName": "South Scotland"},
    # We'll add synthetic North Scotland (1), North Wales & Mersey (6), South England (12)
}

GISCO_URL = "https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_10M_2021_4326_LEVL_1.geojson"

def simplify_geometry(geometry: dict, tolerance: float = 0.05) -> dict:
    """Very basic geometry simplification to reduce file size."""
    if geometry["type"] == "Polygon":
        coords = geometry["coordinates"]
        simplified = [simplify_ring(ring, tolerance) for ring in coords]
        return {"type": "Polygon", "coordinates": simplified}
    elif geometry["type"] == "MultiPolygon":
        polys = []
        for poly in geometry["coordinates"]:
            simplified = [simplify_ring(ring, tolerance) for ring in poly]
            polys.append(simplified)
        return {"type": "MultiPolygon", "coordinates": polys}
    return geometry

def simplify_ring(ring: list, tolerance: float) -> list:
    """Douglas-Peucker line simplification."""
    if len(ring) <= 4:
        return ring
    result = [ring[0]]
    for i in range(1, len(ring) - 1):
        dx = ring[i][0] - result[-1][0]
        dy = ring[i][1] - result[-1][1]
        if math.sqrt(dx*dx + dy*dy) >= tolerance:
            result.append(ring[i])
    result.append(ring[-1])
    return result if len(result) >= 4 else ring

def ensure_closed(ring: list) -> list:
    if len(ring) < 3:
        return ring
    if ring[0] == ring[-1]:
        return ring
    return ring + [ring[0]]

def clip_ring_half_plane(ring: list, is_inside, intersect) -> list:
    """Sutherland-Hodgman ring clipping against a single half-plane."""
    pts = ensure_closed(ring)
    if len(pts) < 4:
        return []
    output = []
    prev = pts[-1]
    prev_inside = is_inside(prev)
    for curr in pts:
        curr_inside = is_inside(curr)
        if curr_inside:
            if not prev_inside:
                output.append(intersect(prev, curr))
            output.append(curr)
        elif prev_inside:
            output.append(intersect(prev, curr))
        prev = curr
        prev_inside = curr_inside
    if len(output) < 3:
        return []
    output = ensure_closed(output)
    return output if len(output) >= 4 else []

def clip_geometry_by_lat(geometry: dict, split_lat: float, keep_north: bool) -> Optional[dict]:
    def is_inside(pt):
        return pt[1] >= split_lat if keep_north else pt[1] <= split_lat

    def intersect(a, b):
        ay, by = a[1], b[1]
        if by == ay:
            return [b[0], split_lat]
        t = (split_lat - ay) / (by - ay)
        return [a[0] + t * (b[0] - a[0]), split_lat]

    def clip_polygon(polygon):
        if not polygon:
            return None
        outer = clip_ring_half_plane(polygon[0], is_inside, intersect)
        if not outer:
            return None
        holes = []
        for hole in polygon[1:]:
            clipped = clip_ring_half_plane(hole, is_inside, intersect)
            if clipped:
                holes.append(clipped)
        return [outer] + holes

    if geometry["type"] == "Polygon":
        poly = clip_polygon(geometry["coordinates"])
        return {"type": "Polygon", "coordinates": poly} if poly else None
    if geometry["type"] == "MultiPolygon":
        polys = []
        for poly in geometry["coordinates"]:
            clipped = clip_polygon(poly)
            if clipped:
                polys.append(clipped)
        if not polys:
            return None
        return {"type": "MultiPolygon", "coordinates": polys}
    return None

def clip_geometry_by_lon(geometry: dict, split_lon: float, keep_east: bool) -> Optional[dict]:
    def is_inside(pt):
        return pt[0] >= split_lon if keep_east else pt[0] <= split_lon

    def intersect(a, b):
        ax, bx = a[0], b[0]
        if bx == ax:
            return [split_lon, b[1]]
        t = (split_lon - ax) / (bx - ax)
        return [split_lon, a[1] + t * (b[1] - a[1])]

    def clip_polygon(polygon):
        if not polygon:
            return None
        outer = clip_ring_half_plane(polygon[0], is_inside, intersect)
        if not outer:
            return None
        holes = []
        for hole in polygon[1:]:
            clipped = clip_ring_half_plane(hole, is_inside, intersect)
            if clipped:
                holes.append(clipped)
        return [outer] + holes

    if geometry["type"] == "Polygon":
        poly = clip_polygon(geometry["coordinates"])
        return {"type": "Polygon", "coordinates": poly} if poly else None
    if geometry["type"] == "MultiPolygon":
        polys = []
        for poly in geometry["coordinates"]:
            clipped = clip_polygon(poly)
            if clipped:
                polys.append(clipped)
        if not polys:
            return None
        return {"type": "MultiPolygon", "coordinates": polys}
    return None

def split_scotland(geometry: dict) -> tuple[dict, dict]:
    """
    Split Scotland geometry at latitude ~56.5 into North and South Scotland.
    Returns (north_geometry, south_geometry).
    """
    split_lat = 56.5
    north = clip_geometry_by_lat(geometry, split_lat, keep_north=True) or geometry
    south = clip_geometry_by_lat(geometry, split_lat, keep_north=False) or geometry
    return north, south

def split_wales(geometry: dict) -> tuple[dict, dict]:
    """
    Split Wales at latitude ~52.4 into North Wales (CI 6) and South Wales (CI 7).
    """
    split_lat = 52.4
    north = clip_geometry_by_lat(geometry, split_lat, keep_north=True) or geometry
    south = clip_geometry_by_lat(geometry, split_lat, keep_north=False) or geometry
    return north, south

def create_synthetic_south_england(south_east_geometry: dict) -> dict:
    """
    Create approximate South England (CI 12: Hampshire/Berkshire/Wiltshire area)
    by using a bounding box in the south-central area.
    """
    # Simple polygon approximating South England (Hampshire, Berkshire, Wiltshire, Dorset)
    return {
        "type": "Polygon",
        "coordinates": [[
            [-2.0, 51.8], [-0.5, 51.8], [0.5, 51.5], [0.2, 50.8],
            [-2.0, 50.6], [-2.8, 51.0], [-2.0, 51.8],
        ]],
    }

def split_south_east(geometry: dict) -> tuple[dict, dict]:
    """
    Split NUTS1 South East England (UKJ) into:
    - South England (12): western side
    - South East England (14): eastern side
    """
    split_lon = -0.4
    south_england = clip_geometry_by_lon(geometry, split_lon, keep_east=False) or geometry
    south_east = clip_geometry_by_lon(geometry, split_lon, keep_east=True) or geometry
    return south_england, south_east

def create_north_wales_mersey(north_wales_geometry: dict) -> dict:
    """
    Create approximate North Wales & Mersey (CI 6) combining north Wales
    with approximate Merseyside/Cheshire area.
    """
    if north_wales_geometry.get("type") in ("Polygon", "MultiPolygon"):
        return north_wales_geometry
    return {
        "type": "Polygon",
        "coordinates": [[
            [-4.5, 52.4], [-3.0, 53.5], [-2.0, 53.5], [-2.0, 52.9],
            [-3.5, 52.4], [-4.5, 52.4],
        ]],
    }

def main():
    print("=== Generating UK DNO Regions Map ===")
    print(f"Downloading UK NUTS1 boundaries from Eurostat GISCO...")

    try:
        resp = requests.get(GISCO_URL, timeout=30)
        resp.raise_for_status()
        geojson = resp.json()
        features_raw = geojson.get("features", [])
        print(f"Downloaded {len(features_raw)} NUTS features")
    except Exception as e:
        print(f"ERROR downloading boundary data: {e}")
        print("Generating fallback simplified map...")
        generate_fallback()
        return

    # Filter to UK only (nuts_id starts with "UK")
    uk_features = [f for f in features_raw if f.get("properties", {}).get("NUTS_ID", "").startswith("UK")]
    print(f"UK NUTS1 regions found: {len(uk_features)}")

    output_features = []

    for feature in uk_features:
        props = feature.get("properties", {})
        nuts_id = props.get("NUTS_ID", "")
        geom = feature.get("geometry", {})

        # Skip Northern Ireland
        if nuts_id == "UKN":
            continue

        # Simplify geometry
        geom = simplify_geometry(geom, tolerance=0.04)

        if nuts_id == "UKM":  # Scotland → split into North (1) and South (2)
            north_geom, south_geom = split_scotland(geom)
            output_features.append({
                "type": "Feature",
                "properties": {"regionId": 1, "shortName": "North Scotland", "nutsId": "UKM_N"},
                "geometry": north_geom,
            })
            output_features.append({
                "type": "Feature",
                "properties": {"regionId": 2, "shortName": "South Scotland", "nutsId": "UKM_S"},
                "geometry": south_geom,
            })
        elif nuts_id == "UKL":  # Wales → split into North Wales & Mersey (6) and South Wales (7)
            north_geom, south_geom = split_wales(geom)
            output_features.append({
                "type": "Feature",
                "properties": {"regionId": 6, "shortName": "North Wales & Mersey", "nutsId": "UKL_N"},
                "geometry": north_geom,
            })
            output_features.append({
                "type": "Feature",
                "properties": {"regionId": 7, "shortName": "South Wales", "nutsId": "UKL_S"},
                "geometry": south_geom,
            })
        elif nuts_id == "UKJ":
            south_eng_geom, south_east_geom = split_south_east(geom)
            output_features.append({
                "type": "Feature",
                "properties": {"regionId": 12, "shortName": "South England", "nutsId": "UKJ_W"},
                "geometry": south_eng_geom,
            })
            output_features.append({
                "type": "Feature",
                "properties": {"regionId": 14, "shortName": "South East England", "nutsId": "UKJ_E"},
                "geometry": south_east_geom,
            })
        elif nuts_id in NUTS1_TO_CI:
            ci = NUTS1_TO_CI[nuts_id]
            output_features.append({
                "type": "Feature",
                "properties": {
                    "regionId": ci["regionId"],
                    "shortName": ci["shortName"],
                    "nutsId": nuts_id,
                },
                "geometry": geom,
            })

    output_geojson = {
        "type": "FeatureCollection",
        "features": output_features,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output_geojson, f, separators=(",", ":"))

    size_kb = OUTPUT_PATH.stat().st_size / 1024
    print(f"\n✓ Written: {OUTPUT_PATH} ({size_kb:.1f} KB)")
    print(f"  Features: {len(output_features)}")
    for feat in sorted(output_features, key=lambda x: x["properties"]["regionId"]):
        print(f"  [{feat['properties']['regionId']:2d}] {feat['properties']['shortName']}")

def generate_fallback():
    """Generate a simplified UK map with approximate polygon coordinates."""
    # Approximate bounding polygons for 14 CI regions (WGS84)
    regions = [
        {
            "regionId": 1, "shortName": "North Scotland",
            "coords": [[-7.5,57.0],[-5.0,58.7],[-1.5,60.9],[0.0,60.5],[-1.0,57.8],[-3.5,56.5],[-7.5,57.0]],
        },
        {
            "regionId": 2, "shortName": "South Scotland",
            "coords": [[-5.0,55.0],[-2.5,55.8],[-2.0,56.0],[-3.5,56.5],[-5.5,56.5],[-5.0,55.0]],
        },
        {
            "regionId": 3, "shortName": "North West England",
            "coords": [[-3.5,54.0],[-2.0,54.5],[-2.0,53.5],[-2.5,53.0],[-3.5,53.0],[-3.5,54.0]],
        },
        {
            "regionId": 4, "shortName": "North East England",
            "coords": [[-2.0,54.5],[-1.0,55.0],[-1.0,54.0],[-2.0,53.5],[-2.0,54.5]],
        },
        {
            "regionId": 5, "shortName": "Yorkshire",
            "coords": [[-2.0,53.5],[-0.5,54.0],[-0.5,53.0],[-1.5,53.0],[-2.0,53.5]],
        },
        {
            "regionId": 6, "shortName": "North Wales & Mersey",
            "coords": [[-4.5,52.5],[-2.5,53.5],[-2.0,53.5],[-2.5,52.9],[-3.5,52.5],[-4.5,52.5]],
        },
        {
            "regionId": 7, "shortName": "South Wales",
            "coords": [[-5.0,51.5],[-4.5,52.5],[-3.5,52.5],[-2.5,51.8],[-5.0,51.5]],
        },
        {
            "regionId": 8, "shortName": "West Midlands",
            "coords": [[-2.5,52.0],[-1.5,53.0],[-1.5,52.0],[-2.5,52.0]],
        },
        {
            "regionId": 9, "shortName": "East Midlands",
            "coords": [[-1.5,53.0],[-0.5,53.0],[-0.5,52.5],[-1.5,52.0],[-1.5,53.0]],
        },
        {
            "regionId": 10, "shortName": "East England",
            "coords": [[0.5,53.0],[0.5,51.5],[-0.5,51.5],[-0.5,53.0],[0.5,53.0]],
        },
        {
            "regionId": 11, "shortName": "South West England",
            "coords": [[-5.7,50.0],[-2.8,51.0],[-2.0,51.5],[-2.5,51.0],[-3.5,50.5],[-5.7,50.0]],
        },
        {
            "regionId": 12, "shortName": "South England",
            "coords": [[-2.0,51.8],[-0.8,51.8],[0.2,51.4],[-1.8,50.5],[-2.8,51.0],[-2.0,51.8]],
        },
        {
            "regionId": 13, "shortName": "London",
            "coords": [[-0.5,51.8],[0.2,51.7],[0.2,51.3],[-0.5,51.3],[-0.5,51.8]],
        },
        {
            "regionId": 14, "shortName": "South East England",
            "coords": [[0.2,51.7],[1.5,51.5],[1.5,51.0],[0.2,51.3],[0.2,51.7]],
        },
    ]

    features = [{
        "type": "Feature",
        "properties": {"regionId": r["regionId"], "shortName": r["shortName"]},
        "geometry": {"type": "Polygon", "coordinates": [[list(c) for c in r["coords"]]]},
    } for r in regions]

    output = {"type": "FeatureCollection", "features": features}
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, separators=(",", ":"))
    print(f"✓ Written fallback: {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
