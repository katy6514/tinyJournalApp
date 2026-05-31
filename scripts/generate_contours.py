#!/usr/bin/env python3
"""
Generate contours.geojson from DEM raster files.

If scripts/trail_legs.geojson exists, each TIF is clipped to a 30-mile
buffer around the trail before contour extraction, dramatically reducing
output size for large full-CDT rasters.

To export trail legs from the running dev server:
  curl http://localhost:3000/api/legs > scripts/trail_legs.geojson

Drop .tif files into scripts/dem/, then run:
  python3 scripts/generate_contours.py

Output: public/contours.geojson (loaded by CDTmap.js)
"""

import json
import os
import sys
import numpy as np
import rasterio
from rasterio.mask import mask as rio_mask
from skimage.measure import find_contours

INTERVAL = 100       # meters between contour lines
INDEX_EVERY = 500    # every Nth meter gets a thicker index contour
SIMPLIFY_STEP = 8    # keep every Nth vertex (~224m accuracy at 28m/pixel)
MIN_POINTS = 3       # discard tiny contour fragments
BUFFER_MILES = 30    # trail corridor half-width
NODATA_FILL = -32768.0

# 30 miles in decimal degrees (lat: ~0.435°; we use a single value since
# the CDT spans only ~17° of longitude — the approximation is good enough)
_MILES_PER_DEG_LAT = 69.0
BUFFER_DEGREES = BUFFER_MILES / _MILES_PER_DEG_LAT  # ≈ 0.435°

DEM_DIR = os.path.join(os.path.dirname(__file__), "dem")
TRAIL_LEGS = os.path.join(os.path.dirname(__file__), "trail_legs.geojson")
OUTPUT = os.path.join(os.path.dirname(__file__), "..", "public", "contours.geojson")


def load_trail_buffer():
    """Return a list with one GeoJSON geometry dict representing the buffered trail, or None."""
    if not os.path.exists(TRAIL_LEGS):
        return None

    try:
        from shapely.geometry import shape
        from shapely.ops import unary_union
    except ImportError:
        print("shapely not installed — skipping trail buffer clipping.")
        print("  pip3 install shapely --break-system-packages")
        return None

    with open(TRAIL_LEGS) as f:
        legs_data = json.load(f)

    lines = [shape(feat["geometry"]) for feat in legs_data["features"] if feat.get("geometry")]
    if not lines:
        print("trail_legs.geojson has no geometry features — skipping buffer.")
        return None

    trail_union = unary_union(lines)
    buffer_geom = trail_union.buffer(BUFFER_DEGREES)
    return [buffer_geom.__geo_interface__]


def pixel_to_geo(rows, cols, transform):
    xs = transform.c + cols * transform.a + rows * transform.b
    ys = transform.f + cols * transform.d + rows * transform.e
    return xs, ys


def process_file(tif_path, clip_geom=None):
    features = []
    with rasterio.open(tif_path) as src:
        if clip_geom is not None:
            try:
                clipped, transform = rio_mask(
                    src, clip_geom, crop=True, nodata=NODATA_FILL, filled=True
                )
                data = clipped[0].astype(float)
                data[data == NODATA_FILL] = np.nan
            except Exception as e:
                print(f"  Warning: clip failed ({e}), using full raster")
                data = src.read(1).astype(float)
                transform = src.transform
                nodata = src.nodata
                if nodata is not None:
                    data[data == nodata] = np.nan
        else:
            data = src.read(1).astype(float)
            transform = src.transform
            nodata = src.nodata
            if nodata is not None:
                data[data == nodata] = np.nan

    valid = data[~np.isnan(data)]
    if valid.size == 0:
        print("  → 0 contour lines (no data in clip region)")
        return features

    min_elev = np.ceil(valid.min() / INTERVAL) * INTERVAL
    max_elev = np.floor(valid.max() / INTERVAL) * INTERVAL
    levels = np.arange(min_elev, max_elev + 1, INTERVAL)

    for level in levels:
        is_index = int(level) % INDEX_EVERY == 0
        contours = find_contours(data, level=float(level))
        for contour in contours:
            sampled = np.concatenate([contour[::SIMPLIFY_STEP], contour[[-1]]])
            if len(sampled) < MIN_POINTS:
                continue
            lons, lats = pixel_to_geo(sampled[:, 0], sampled[:, 1], transform)
            coords = [
                [round(float(lon), 6), round(float(lat), 6)]
                for lon, lat in zip(lons, lats)
            ]
            features.append({
                "type": "Feature",
                "geometry": {"type": "LineString", "coordinates": coords},
                "properties": {"elevation": int(level), "index": is_index},
            })

    return features


def main():
    tif_files = sorted(
        f for f in os.listdir(DEM_DIR) if f.lower().endswith((".tif", ".tiff"))
    )

    if not tif_files:
        print(f"No .tif files found in {DEM_DIR}/")
        sys.exit(1)

    clip_geom = load_trail_buffer()
    if clip_geom:
        print(f"Trail buffer loaded — clipping to {BUFFER_MILES}-mile corridor around trail.")
    else:
        print("No trail_legs.geojson found — processing full rasters (may be slow for large files).")

    all_features = []
    for filename in tif_files:
        path = os.path.join(DEM_DIR, filename)
        print(f"Processing {filename}...")
        features = process_file(path, clip_geom)
        print(f"  → {len(features)} contour lines")
        all_features.extend(features)

    geojson = {"type": "FeatureCollection", "features": all_features}

    with open(OUTPUT, "w") as f:
        json.dump(geojson, f)

    size_kb = os.path.getsize(OUTPUT) / 1024
    print(f"\nWrote {len(all_features)} total contour lines to public/contours.geojson ({size_kb:.0f} KB)")


if __name__ == "__main__":
    main()
