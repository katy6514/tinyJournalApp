#!/usr/bin/env python3
"""
Generate contours.geojson from DEM raster files.

Drop .tif files into scripts/dem/, then run:
  python3 scripts/generate_contours.py

Output: public/contours.geojson (loaded by CDTmap.js)
"""

import json
import os
import sys
import numpy as np
import rasterio
from skimage.measure import find_contours

INTERVAL = 100       # meters between contour lines
INDEX_EVERY = 500    # every Nth meter gets a thicker index contour
SIMPLIFY_STEP = 8    # keep every Nth vertex (~224m accuracy at 28m/pixel)
MIN_POINTS = 3       # discard tiny contour fragments

DEM_DIR = os.path.join(os.path.dirname(__file__), "dem")
OUTPUT = os.path.join(os.path.dirname(__file__), "..", "public", "contours.geojson")


def pixel_to_geo(rows, cols, transform):
    xs = transform.c + cols * transform.a + rows * transform.b
    ys = transform.f + cols * transform.d + rows * transform.e
    return xs, ys


def process_file(tif_path):
    features = []
    with rasterio.open(tif_path) as src:
        data = src.read(1).astype(float)
        transform = src.transform
        nodata = src.nodata

    if nodata is not None:
        data[data == nodata] = np.nan

    min_elev = np.ceil(np.nanmin(data) / INTERVAL) * INTERVAL
    max_elev = np.floor(np.nanmax(data) / INTERVAL) * INTERVAL
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

    all_features = []
    for filename in tif_files:
        path = os.path.join(DEM_DIR, filename)
        print(f"Processing {filename}...")
        features = process_file(path)
        print(f"  → {len(features)} contour lines")
        all_features.extend(features)

    geojson = {"type": "FeatureCollection", "features": all_features}

    with open(OUTPUT, "w") as f:
        json.dump(geojson, f)

    size_kb = os.path.getsize(OUTPUT) / 1024
    print(f"\nWrote {len(all_features)} total contour lines to public/contours.geojson ({size_kb:.0f} KB)")


if __name__ == "__main__":
    main()
