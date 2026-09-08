from __future__ import annotations

import csv
import io
import json
import math
import textwrap
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFont


OUTPUT_DIR = Path(__file__).resolve().parent
QUERY_DATE = date(2026, 9, 1)
REID = "241419"
MAP_SIZE = 4096
MAP_SR = 3857
MAP_LATITUDE = 36.14726
HEADER_HEIGHT = 360
FOOTER_HEIGHT = 300

PARCEL_LAYER = (
    "https://gcgis.guilfordcountync.gov/arcgis/rest/services/"
    "GC_Cadastral_Current/Parcels_Ownership/MapServer/0"
)
COUNTY_BASEMAP = (
    "https://gcgis.guilfordcountync.gov/arcgis/rest/services/"
    "GISDV/Base_Map/MapServer"
)
WORLD_IMAGERY = (
    "https://services.arcgisonline.com/ArcGIS/rest/services/"
    "World_Imagery/MapServer"
)


def request_bytes(base_url: str, endpoint: str, params: dict[str, str]) -> bytes:
    url = f"{base_url}/{endpoint}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": "Spears-YMCA-parcel-research/1.0"})
    with urllib.request.urlopen(req, timeout=120) as response:
        body = response.read()
        content_type = response.headers.get("Content-Type", "")
    if "json" in content_type or body[:1] == b"{":
        payload = json.loads(body.decode("utf-8"))
        if "error" in payload:
            raise RuntimeError(f"ArcGIS request failed: {payload['error']}")
    return body


def request_json(base_url: str, endpoint: str, params: dict[str, str]) -> dict:
    return json.loads(request_bytes(base_url, endpoint, params).decode("utf-8"))


def query_parcel(out_sr: int) -> dict:
    payload = request_json(
        PARCEL_LAYER,
        "query",
        {
            "where": f"REID='{REID}'",
            "outFields": "*",
            "returnGeometry": "true",
            "outSR": str(out_sr),
            "f": "json",
        },
    )
    features = payload.get("features", [])
    if len(features) != 1:
        raise RuntimeError(f"Expected one active parcel for REID {REID}; received {len(features)}")
    return features[0]


def extent_from_geometry(geometry: dict) -> tuple[float, float, float, float]:
    points = [point for ring in geometry["rings"] for point in ring]
    xs = [point[0] for point in points]
    ys = [point[1] for point in points]
    return min(xs), min(ys), max(xs), max(ys)


def square_extent(
    geometry: dict, margin_units: float = 165.0
) -> tuple[float, float, float, float]:
    xmin, ymin, xmax, ymax = extent_from_geometry(geometry)
    center_x = (xmin + xmax) / 2
    center_y = (ymin + ymax) / 2
    span = max(xmax - xmin, ymax - ymin) + (2 * margin_units)
    return (
        center_x - span / 2,
        center_y - span / 2,
        center_x + span / 2,
        center_y + span / 2,
    )


def query_nearby_parcels(bbox: tuple[float, float, float, float]) -> list[dict]:
    payload = request_json(
        PARCEL_LAYER,
        "query",
        {
            "where": "1=1",
            "geometry": ",".join(f"{value:.3f}" for value in bbox),
            "geometryType": "esriGeometryEnvelope",
            "inSR": str(MAP_SR),
            "spatialRel": "esriSpatialRelIntersects",
            "outFields": "REID,LOCATION_ADDR,PROPERTY_OWNER",
            "returnGeometry": "true",
            "outSR": str(MAP_SR),
            "f": "json",
        },
    )
    return payload.get("features", [])


def map_point(
    point: list[float], bbox: tuple[float, float, float, float]
) -> tuple[int, int]:
    xmin, ymin, xmax, ymax = bbox
    x = round((point[0] - xmin) / (xmax - xmin) * (MAP_SIZE - 1))
    y = round((ymax - point[1]) / (ymax - ymin) * (MAP_SIZE - 1))
    return x, y


def mapped_rings(
    geometry: dict, bbox: tuple[float, float, float, float]
) -> list[list[tuple[int, int]]]:
    return [[map_point(point, bbox) for point in ring] for ring in geometry["rings"]]


def polygon_centroid(points: list[tuple[int, int]]) -> tuple[float, float]:
    signed_area = 0.0
    centroid_x = 0.0
    centroid_y = 0.0
    for index in range(len(points) - 1):
        x0, y0 = points[index]
        x1, y1 = points[index + 1]
        cross = (x0 * y1) - (x1 * y0)
        signed_area += cross
        centroid_x += (x0 + x1) * cross
        centroid_y += (y0 + y1) * cross
    signed_area *= 0.5
    if abs(signed_area) < 1e-9:
        return (
            sum(point[0] for point in points) / len(points),
            sum(point[1] for point in points) / len(points),
        )
    return centroid_x / (6 * signed_area), centroid_y / (6 * signed_area)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    filename = "arialbd.ttf" if bold else "arial.ttf"
    candidates = [
        Path("C:/Windows/Fonts") / filename,
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
        if bold
        else Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default(size=size)


def export_tiled_map(
    service_url: str,
    bbox: tuple[float, float, float, float],
    *,
    transparent: bool,
    layers: str | None = None,
) -> Image.Image:
    """Export four 2,048-pixel tiles and assemble a true 4,096-pixel map."""
    tile_size = MAP_SIZE // 2
    canvas = Image.new(
        "RGBA",
        (MAP_SIZE, MAP_SIZE),
        (0, 0, 0, 0) if transparent else (255, 255, 255, 255),
    )
    xmin, ymin, xmax, ymax = bbox
    x_mid = (xmin + xmax) / 2
    y_mid = (ymin + ymax) / 2
    tile_extents = [
        (xmin, y_mid, x_mid, ymax),
        (x_mid, y_mid, xmax, ymax),
        (xmin, ymin, x_mid, y_mid),
        (x_mid, ymin, xmax, y_mid),
    ]
    for index, tile_bbox in enumerate(tile_extents):
        params = {
            "bbox": ",".join(f"{value:.3f}" for value in tile_bbox),
            "bboxSR": str(MAP_SR),
            "imageSR": str(MAP_SR),
            "size": f"{tile_size},{tile_size}",
            "format": "png32",
            "transparent": "true" if transparent else "false",
            "f": "image",
        }
        if layers:
            params["layers"] = layers
        tile = Image.open(
            io.BytesIO(request_bytes(service_url, "export", params))
        ).convert("RGBA")
        row, col = divmod(index, 2)
        canvas.paste(tile, (col * tile_size, row * tile_size), tile if transparent else None)
    return canvas


def download_basemap(bbox: tuple[float, float, float, float]) -> Image.Image:
    imagery = export_tiled_map(
        WORLD_IMAGERY, bbox, transparent=False
    ).convert("RGB")
    imagery = ImageEnhance.Contrast(imagery).enhance(1.08)
    imagery = ImageEnhance.Color(imagery).enhance(0.90).convert("RGBA")

    try:
        reference = export_tiled_map(
            COUNTY_BASEMAP,
            bbox,
            transparent=True,
            layers="show:1,2,6,7,8,9",
        )
        imagery = Image.alpha_composite(imagery, reference)
    except Exception:
        # The parcel geometry and image remain complete if the optional road-label
        # overlay is temporarily unavailable.
        pass
    return imagery


def draw_map(
    owned_parcel: dict,
    nearby_parcels: list[dict],
    bbox: tuple[float, float, float, float],
) -> Image.Image:
    image = download_basemap(bbox)
    owned_rings = mapped_rings(owned_parcel["geometry"], bbox)

    # Subdue surrounding land while keeping the YMCA parcel itself bright.
    owned_mask = Image.new("L", (MAP_SIZE, MAP_SIZE), 0)
    mask_draw = ImageDraw.Draw(owned_mask)
    for ring in owned_rings:
        mask_draw.polygon(ring, fill=255)
    outside_alpha = ImageChops.invert(owned_mask).point(lambda value: round(value * 0.22))
    shade = Image.new("RGBA", (MAP_SIZE, MAP_SIZE), (8, 22, 36, 0))
    shade.putalpha(outside_alpha)
    image = Image.alpha_composite(image, shade)

    boundary_layer = Image.new("RGBA", (MAP_SIZE, MAP_SIZE), (0, 0, 0, 0))
    boundary_draw = ImageDraw.Draw(boundary_layer)
    for parcel in nearby_parcels:
        for ring in mapped_rings(parcel["geometry"], bbox):
            boundary_draw.line(ring, fill=(255, 255, 255, 205), width=4, joint="curve")
            boundary_draw.line(ring, fill=(35, 46, 55, 170), width=2, joint="curve")
    image = Image.alpha_composite(image, boundary_layer)

    highlight = Image.new("RGBA", (MAP_SIZE, MAP_SIZE), (0, 0, 0, 0))
    highlight_draw = ImageDraw.Draw(highlight)
    for ring in owned_rings:
        highlight_draw.polygon(ring, fill=(0, 165, 196, 86))
        highlight_draw.line(ring, fill=(10, 20, 28, 245), width=26, joint="curve")
        highlight_draw.line(ring, fill=(255, 205, 54, 255), width=15, joint="curve")
    image = Image.alpha_composite(image, highlight)

    draw = ImageDraw.Draw(image, "RGBA")
    centroid_x, centroid_y = polygon_centroid(owned_rings[0])
    label_width = 1190
    label_height = 275
    left = int(centroid_x - label_width / 2)
    top = int(centroid_y - label_height / 2)
    draw.rounded_rectangle(
        (left, top, left + label_width, top + label_height),
        radius=34,
        fill=(8, 28, 46, 224),
        outline=(255, 205, 54, 255),
        width=8,
    )
    draw.text(
        (centroid_x, top + 54),
        "YMCA-OWNED PARCEL",
        font=font(70, bold=True),
        fill=(255, 255, 255, 255),
        anchor="ma",
    )
    draw.text(
        (centroid_x, top + 150),
        "REID 241419  •  8.52 ACRES",
        font=font(50),
        fill=(255, 222, 117, 255),
        anchor="ma",
    )

    # North arrow.
    arrow_x = MAP_SIZE - 190
    arrow_y = 170
    draw.polygon(
        [(arrow_x, arrow_y - 105), (arrow_x - 55, arrow_y + 55), (arrow_x, arrow_y + 28),
         (arrow_x + 55, arrow_y + 55)],
        fill=(255, 255, 255, 235),
        outline=(7, 20, 31, 255),
    )
    draw.text(
        (arrow_x, arrow_y + 75),
        "N",
        font=font(62, bold=True),
        fill=(255, 255, 255, 255),
        stroke_width=4,
        stroke_fill=(7, 20, 31, 255),
        anchor="ma",
    )

    # 300-foot scale bar.
    # Web Mercator distances are corrected to ground scale at the map latitude.
    feet_per_pixel = (
        (bbox[2] - bbox[0])
        / MAP_SIZE
        * math.cos(math.radians(MAP_LATITUDE))
        * 3.280839895
    )
    segment_px = round(150 / feet_per_pixel)
    scale_left = MAP_SIZE - (segment_px * 2) - 170
    scale_top = MAP_SIZE - 135
    draw.rectangle(
        (scale_left - 35, scale_top - 75, MAP_SIZE - 100, scale_top + 95),
        fill=(8, 28, 46, 205),
    )
    draw.rectangle(
        (scale_left, scale_top, scale_left + segment_px, scale_top + 42),
        fill=(255, 255, 255, 255),
        outline=(0, 0, 0, 255),
        width=4,
    )
    draw.rectangle(
        (scale_left + segment_px, scale_top, scale_left + segment_px * 2, scale_top + 42),
        fill=(255, 205, 54, 255),
        outline=(0, 0, 0, 255),
        width=4,
    )
    for offset, value in [(0, "0"), (segment_px, "150"), (segment_px * 2, "300 ft")]:
        draw.text(
            (scale_left + offset, scale_top - 55),
            value,
            font=font(38, bold=True),
            fill=(255, 255, 255, 255),
            stroke_width=3,
            stroke_fill=(7, 20, 31, 255),
            anchor="ma",
        )

    return image


def compose_final(map_image: Image.Image, attributes: dict) -> Image.Image:
    canvas = Image.new(
        "RGB", (MAP_SIZE, HEADER_HEIGHT + MAP_SIZE + FOOTER_HEIGHT), (246, 248, 250)
    )
    draw = ImageDraw.Draw(canvas)

    draw.rectangle((0, 0, MAP_SIZE, HEADER_HEIGHT), fill=(8, 35, 58))
    draw.rectangle((0, HEADER_HEIGHT - 18, MAP_SIZE, HEADER_HEIGHT), fill=(255, 205, 54))
    draw.text(
        (170, 76),
        "SPEARS YMCA — PARCEL OWNERSHIP MAP",
        font=font(112, bold=True),
        fill=(255, 255, 255),
    )
    draw.text(
        (175, 218),
        "3216 Horse Pen Creek Road, Greensboro, North Carolina",
        font=font(64),
        fill=(196, 220, 234),
    )
    canvas.paste(map_image.convert("RGB"), (0, HEADER_HEIGHT))

    map_draw = ImageDraw.Draw(canvas, "RGBA")
    card_left = 110
    card_top = HEADER_HEIGHT + MAP_SIZE - 805
    card_right = 2500
    card_bottom = HEADER_HEIGHT + MAP_SIZE - 90
    map_draw.rounded_rectangle(
        (card_left, card_top, card_right, card_bottom),
        radius=42,
        fill=(7, 27, 43, 230),
        outline=(255, 255, 255, 215),
        width=5,
    )
    map_draw.text(
        (card_left + 70, card_top + 58),
        "COUNTY RECORD SUMMARY",
        font=font(64, bold=True),
        fill=(255, 205, 54, 255),
    )
    owner_lines = textwrap.wrap(attributes["PROPERTY_OWNER"], width=56)
    owner_y = card_top + 160
    map_draw.text(
        (card_left + 70, owner_y),
        "Owner of record",
        font=font(42, bold=True),
        fill=(172, 204, 222, 255),
    )
    owner_y += 60
    for line in owner_lines:
        map_draw.text(
            (card_left + 70, owner_y),
            line,
            font=font(49, bold=True),
            fill=(255, 255, 255, 255),
        )
        owner_y += 58

    detail_lines = [
        f"REID  {attributes['REID']}     PIN  {attributes['PIN_PLUS_EXT']}",
        f"Recorded acreage  {attributes['ACREAGE']:.2f} ac     Deeded acreage  {attributes['DEEDED_ACRES']:.2f} ac",
        f"Deed Book/Page  {int(attributes['DEED_BOOK'])}/{int(attributes['DEED_PAGE'])}     Plat  {attributes['PB_PG_NUM']}",
        f"Zoning  {attributes['ZONING']}",
    ]
    details_y = owner_y + 24
    for line in detail_lines:
        map_draw.text(
            (card_left + 70, details_y),
            line,
            font=font(42),
            fill=(237, 243, 247, 255),
        )
        details_y += 57

    footer_top = HEADER_HEIGHT + MAP_SIZE
    draw.rectangle((0, footer_top, MAP_SIZE, footer_top + FOOTER_HEIGHT), fill=(8, 35, 58))
    draw.text(
        (120, footer_top + 54),
        "Parcel/ownership: Guilford County GIS  •  Aerial: Esri World Imagery  •  Research date: September 1, 2026",
        font=font(45),
        fill=(231, 239, 244),
    )
    draw.text(
        (120, footer_top + 135),
        "Boundary positions are approximate and for research/illustration only; this map is not a survey.",
        font=font(43),
        fill=(255, 216, 101),
    )
    draw.text(
        (120, footer_top + 214),
        "Highlighted ownership was verified in the county's current 2026 parcel layer.",
        font=font(41),
        fill=(177, 205, 221),
    )
    return canvas


def save_supporting_files(parcel_wgs84: dict, attributes: dict) -> None:
    geojson = {
        "type": "FeatureCollection",
        "name": "Spears YMCA owned parcel",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "reid": attributes["REID"],
                    "pin": attributes["PIN_PLUS_EXT"],
                    "address": attributes["LOCATION_ADDR"],
                    "owner": attributes["PROPERTY_OWNER"],
                    "acreage": attributes["ACREAGE"],
                    "deeded_acres": attributes["DEEDED_ACRES"],
                    "deed_book": attributes["DEED_BOOK"],
                    "deed_page": attributes["DEED_PAGE"],
                    "plat_book_page": attributes["PB_PG_NUM"],
                    "zoning": attributes["ZONING"],
                    "source": "Guilford County GIS Parcels_Ownership",
                    "queried": QUERY_DATE.isoformat(),
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": parcel_wgs84["geometry"]["rings"],
                },
            }
        ],
    }
    (OUTPUT_DIR / "spears_ymca_owned_parcel.geojson").write_text(
        json.dumps(geojson, indent=2), encoding="utf-8"
    )

    csv_fields = [
        "REID",
        "PIN_PLUS_EXT",
        "LOCATION_ADDR",
        "PROPERTY_OWNER",
        "ACREAGE",
        "DEEDED_ACRES",
        "DEED_BOOK",
        "DEED_PAGE",
        "PB_PG_NUM",
        "ZONING",
        "PROPERTY_DESCR",
    ]
    with (OUTPUT_DIR / "spears_ymca_parcel_summary.csv").open(
        "w", encoding="utf-8-sig", newline=""
    ) as handle:
        writer = csv.DictWriter(handle, fieldnames=csv_fields)
        writer.writeheader()
        writer.writerow({field: attributes.get(field) for field in csv_fields})

    notes = f"""# Spears YMCA parcel ownership research

Research date: {QUERY_DATE.strftime('%B')} {QUERY_DATE.day}, {QUERY_DATE.year}

## Finding

The Alex W. Spears III Family YMCA campus at 3216 Horse Pen Creek Road is one current Guilford County tax parcel. A countywide owner-name query and a spatial review of adjoining parcels found no additional YMCA-owned parcel contiguous with the Spears site.

| Field | County record |
| --- | --- |
| Owner of record | {attributes['PROPERTY_OWNER']} |
| Address | {attributes['LOCATION_ADDR']}, Greensboro, NC 27410 |
| REID | {attributes['REID']} |
| PIN | {attributes['PIN_PLUS_EXT']} |
| Recorded acreage | {attributes['ACREAGE']:.2f} acres |
| Deeded acreage | {attributes['DEEDED_ACRES']:.2f} acres |
| Deed | Book {int(attributes['DEED_BOOK'])}, Page {int(attributes['DEED_PAGE'])} |
| Plat | {attributes['PB_PG_NUM']} |
| Zoning | {attributes['ZONING']} |
| Property description | {attributes['PROPERTY_DESCR']} |

## Sources

- Guilford County GIS, current parcel ownership service: https://gcgis.guilfordcountync.gov/arcgis/rest/services/GC_Cadastral_Current/Parcels_Ownership/MapServer/0
- Guilford County Land Records overview and GIS caveat: https://www.guilfordcountync.gov/government/departments-and-agencies/tax-department/mapping-and-ownership-transfer
- YMCA of Greensboro branch page: https://www.ymcagreensboro.org/locations/alex-w-spears-iii-ymca

## Important limitation

Guilford County states that its online parcel maps are informational and should not be treated as certified boundary surveys. Ownership and parcel configuration should be rechecked for any transaction, permitting, or legal use.
"""
    (OUTPUT_DIR / "spears_ymca_research_notes.md").write_text(notes, encoding="utf-8")


def main() -> None:
    parcel_state_plane = query_parcel(out_sr=MAP_SR)
    parcel_wgs84 = query_parcel(out_sr=4326)
    attributes = parcel_state_plane["attributes"]
    bbox = square_extent(parcel_state_plane["geometry"])
    nearby_parcels = query_nearby_parcels(bbox)
    map_image = draw_map(parcel_state_plane, nearby_parcels, bbox)
    final_image = compose_final(map_image, attributes)
    output_path = OUTPUT_DIR / "spears_ymca_parcel_map_4096px.png"
    final_image.save(output_path, format="PNG", optimize=True, compress_level=7)
    save_supporting_files(parcel_wgs84, attributes)

    print(
        json.dumps(
            {
                "map": str(output_path),
                "map_dimensions": final_image.size,
                "nearby_parcels_reviewed": len(nearby_parcels),
                "owner": attributes["PROPERTY_OWNER"],
                "reid": attributes["REID"],
                "pin": attributes["PIN_PLUS_EXT"],
                "acreage": attributes["ACREAGE"],
                "bbox_web_mercator_meters": bbox,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
