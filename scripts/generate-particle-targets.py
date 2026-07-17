#!/usr/bin/env python3

from __future__ import annotations

import argparse
import hashlib
import os
import struct
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage
from scipy.optimize import linear_sum_assignment


ROOT = Path(__file__).resolve().parents[1]
ROBOT_IMAGE = ROOT / "public/images/robot-source.png"
OUTPUT_BINARY = ROOT / "public/particles/portfolio-targets.bin"
PREVIEW_IMAGE = ROOT / "docs/design-references/standalone-particle-targets.png"

MAGIC = b"MPRT"
VERSION = 2
STAGE_COUNT = 4
POINT_COUNT = 10_000
COMPONENT_COUNT = 12
HEADER = struct.Struct("<4s4I")
EXPECTED_FILE_SIZE = HEADER.size + STAGE_COUNT * POINT_COUNT * COMPONENT_COUNT * 4

ROBOT_CROP = (660, 66, 1536, 1024)
ROBOT_SEED = 33
BOOK_SEED = 330303
PARTICLE_SEED = 330033
CATEGORY_SEED = 330033330
SATURN_SEED = 33003303
STYLE_SEED = 303303

DALA_PALETTE = np.array(
    (
        (0xC8, 0x8D, 0x00),
        (0x5C, 0x01, 0xBB),
        (0x00, 0x72, 0x49),
        (0xB1, 0xA0, 0xB6),
    ),
    dtype=np.float32,
) / np.float32(255.0)

STRUCTURE_COUNT = 8_800
HALO_COUNT = POINT_COUNT - STRUCTURE_COUNT
BRAID_POINT_COUNT = 1_350
BODY_POINT_COUNT = STRUCTURE_COUNT - BRAID_POINT_COUNT
BRAID_START_ROW = 0.13
BRAID_END_ROW = 0.60

SATURN_BODY_COUNT = 5_600
SATURN_RING_COUNT = STRUCTURE_COUNT - SATURN_BODY_COUNT
SATURN_CENTER = np.array((0.5, 0.5, 0.5), dtype=np.float32)
SATURN_BODY_RADIUS = 0.21
SATURN_RING_RADII = (0.30, 0.40)
SATURN_RING_TILT = np.deg2rad(68.0)
SATURN_RING_TURN = np.deg2rad(-14.0)
BOOK_OPEN_ANGLE = np.deg2rad(55.0)
BOOK_TILT_X = np.deg2rad(18.0)
BOOK_TURN_Y = np.deg2rad(-28.0)


class TargetGenerationError(RuntimeError):
    """Raised when a generated target cannot satisfy the binary contract."""


def extract_robot_silhouette(image: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    rgb = image.astype(np.float32)
    luminance = rgb[:, :, 0] * 0.2126 + rgb[:, :, 1] * 0.7152 + rgb[:, :, 2] * 0.0722
    raw_mask = luminance >= 22
    connected = ndimage.binary_dilation(raw_mask, iterations=3)
    connected = ndimage.binary_closing(connected, iterations=1)
    labels, count = ndimage.label(connected)
    if count == 0:
        raise TargetGenerationError("Robot silhouette extraction produced no connected regions.")

    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    mask = labels == int(np.argmax(sizes))
    holes = ndimage.binary_fill_holes(mask) & ~mask
    hole_labels, hole_count = ndimage.label(holes)
    if hole_count:
        hole_sizes = np.bincount(hole_labels.ravel())
        small_holes = hole_sizes <= 180
        small_holes[0] = False
        mask |= small_holes[hole_labels]
    return ndimage.binary_erosion(mask, iterations=1), luminance


def ponytail_trim_region(shape: tuple[int, int]) -> np.ndarray:
    height, width = shape
    rows = np.linspace(0.0, 1.0, height, dtype=np.float32)[:, None]
    columns = np.linspace(0.0, 1.0, width, dtype=np.float32)[None, :]
    row_stops = np.array((0.50, 0.58, 0.70, 0.78, 0.86, 1.00))
    column_stops = np.array((0.68, 0.68, 0.79, 0.84, 0.82, 0.75))
    limit = np.interp(rows[:, 0], row_stops, column_stops, left=1.0)[:, None]
    return (rows >= row_stops[0]) & (columns > limit)


def ponytail_braid_region(shape: tuple[int, int]) -> np.ndarray:
    height, width = shape
    rows = np.linspace(0.0, 1.0, height, dtype=np.float32)[:, None]
    columns = np.linspace(0.0, 1.0, width, dtype=np.float32)[None, :]
    progress = np.clip((rows - BRAID_START_ROW) / (BRAID_END_ROW - BRAID_START_ROW), 0.0, 1.0)
    center = 0.81 - 0.045 * progress + 0.008 * np.sin(np.pi * progress)
    taper = 0.068 * (1.0 - progress) + 0.012 * progress
    braided_lobes = 0.84 + 0.16 * np.cos(progress * np.pi * 8.0)
    return (
        (rows >= BRAID_START_ROW)
        & (rows <= BRAID_END_ROW)
        & (np.abs(columns - center) <= taper * braided_lobes)
    )


def refine_robot_mask(mask: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    original = np.asarray(mask, dtype=bool)
    refined = original.copy()
    refined[ponytail_trim_region(refined.shape)] = False

    height, width = refined.shape
    rows = np.linspace(0.0, 1.0, height, dtype=np.float32)[:, None]
    columns = np.linspace(0.0, 1.0, width, dtype=np.float32)[None, :]
    head_limit = np.interp(
        rows[:, 0],
        (BRAID_START_ROW, 0.25, 0.42, BRAID_END_ROW),
        (0.67, 0.655, 0.64, 0.635),
    )[:, None]
    rear_hair = (
        (rows >= BRAID_START_ROW)
        & (rows <= BRAID_END_ROW)
        & (columns > head_limit)
    )
    braid = ponytail_braid_region(refined.shape) & original
    refined[rear_hair] = False
    refined[braid] = True

    separation_channel = (
        (rows >= 0.15)
        & (rows <= 0.47)
        & (columns >= 0.65)
        & (columns <= 0.735)
    )
    refined[separation_channel] = False
    braid &= refined
    return refined, braid


def _sample_pixels(
    mask: np.ndarray,
    luminance: np.ndarray,
    count: int,
    rng: np.random.Generator,
) -> tuple[np.ndarray, np.ndarray]:
    rows, columns = np.nonzero(mask)
    if len(rows) < count:
        raise TargetGenerationError(
            f"Robot region contains {len(rows)} pixels but needs {count} unique samples."
        )
    normalized_light = np.clip(luminance[rows, columns] / 255.0, 0.0, 1.0)
    edge = mask & ~ndimage.binary_erosion(mask, iterations=3)
    edge_weight = edge[rows, columns].astype(np.float32)
    weights = (0.30 + np.sqrt(normalized_light)) * (0.72 + 0.78 * edge_weight)
    weights /= weights.sum()
    selected = rng.choice(len(rows), size=count, replace=False, p=weights)
    return rows[selected], columns[selected]


def particle_category_masks(seeds: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    if seeds.shape != (POINT_COUNT,):
        raise TargetGenerationError(f"Seeds have shape {seeds.shape}; expected {(POINT_COUNT,)}.")
    halo = np.zeros(POINT_COUNT, dtype=bool)
    category_rng = np.random.default_rng(CATEGORY_SEED)
    halo[category_rng.permutation(POINT_COUNT)[:HALO_COUNT]] = True
    return ~halo, halo


def compose_particle_identities(
    structure: np.ndarray,
    halo: np.ndarray,
    seeds: np.ndarray,
    rng: np.random.Generator,
) -> np.ndarray:
    if structure.shape != (STRUCTURE_COUNT, 3):
        raise TargetGenerationError(
            f"Structure has shape {structure.shape}; expected {(STRUCTURE_COUNT, 3)}."
        )
    if halo.shape != (HALO_COUNT, 3):
        raise TargetGenerationError(f"Halo has shape {halo.shape}; expected {(HALO_COUNT, 3)}.")
    structure_mask, halo_mask = particle_category_masks(seeds)
    points = np.empty((POINT_COUNT, 3), dtype=np.float32)
    points[structure_mask] = structure[rng.permutation(STRUCTURE_COUNT)]
    points[halo_mask] = halo[rng.permutation(HALO_COUNT)]
    return points


def match_points_to_particles(
    prev_positions: np.ndarray,
    candidates: np.ndarray,
    seeds: np.ndarray,
    sweep_axis: int,
    descending: bool,
) -> np.ndarray:
    """Pair category-preserving candidates with particle ids in 48 monotone bands."""
    if prev_positions.shape != (POINT_COUNT, 3) or candidates.shape != (POINT_COUNT, 3):
        raise TargetGenerationError("Point matcher requires two 10,000×3 point clouds.")
    structure_mask, halo_mask = particle_category_masks(seeds)
    result = np.empty_like(candidates, dtype=np.float32)
    def ordered_indices(points: np.ndarray, selection: np.ndarray) -> np.ndarray:
        indices = np.flatnonzero(selection)
        direction = -1.0 if descending else 1.0
        return indices[np.argsort(direction * points[indices, sweep_axis], kind="stable")]

    for selection in (structure_mask, halo_mask):
        particle_order = ordered_indices(prev_positions, selection)
        candidate_order = ordered_indices(candidates, selection)
        for particle_band, candidate_band in zip(
            np.array_split(particle_order, 48), np.array_split(candidate_order, 48)
        ):
            distances = np.linalg.norm(
                prev_positions[particle_band, None, :]
                - candidates[candidate_band][None, :, :],
                axis=2,
            )
            particle_rank, candidate_rank = linear_sum_assignment(distances)
            result[particle_band[particle_rank]] = candidates[candidate_band[candidate_rank]]
    return result


def _robot_transform(
    rows: np.ndarray,
    columns: np.ndarray,
    mask: np.ndarray,
    rng: np.random.Generator,
    *,
    halo: bool,
) -> np.ndarray:
    count = len(rows)
    mask_rows, mask_columns = np.nonzero(mask)
    min_x, max_x = float(mask_columns.min()), float(mask_columns.max())
    min_y, max_y = float(mask_rows.min()), float(mask_rows.max())
    center_x = (min_x + max_x) * 0.5
    center_y = (min_y + max_y) * 0.5
    scale = 0.92 / max(max_x - min_x, max_y - min_y)
    jitter = 0.30 if halo else 0.22
    x = 0.5 + (
        columns.astype(np.float32) + rng.uniform(-jitter, jitter, count) - center_x
    ) * scale
    y = 0.5 - (
        rows.astype(np.float32) + rng.uniform(-jitter, jitter, count) - center_y
    ) * scale

    if halo:
        z = 0.5 + rng.uniform(-0.31, 0.31, count)
    else:
        distance = ndimage.distance_transform_edt(mask)
        sampled_distance = distance[rows, columns]
        thickness = 0.035 + 0.24 * np.sqrt(np.clip(sampled_distance / 180.0, 0.0, 1.0))
        depth_bias = 0.018 * np.sin((y - 0.5) * np.pi * 2.0)
        z = 0.5 + rng.uniform(-1.0, 1.0, count) * thickness + depth_bias
    return np.clip(np.column_stack((x, y, z)), 0.02, 0.98).astype(np.float32)


def generate_about_points(
    seeds: np.ndarray, *, include_masks: bool = False
) -> np.ndarray | tuple[np.ndarray, np.ndarray, np.ndarray]:
    image = np.asarray(Image.open(ROBOT_IMAGE).convert("RGB").crop(ROBOT_CROP))
    silhouette, luminance = extract_robot_silhouette(image)
    mask, braid = refine_robot_mask(silhouette)
    body = mask & ~braid
    rng = np.random.default_rng(ROBOT_SEED)

    body_rows, body_columns = _sample_pixels(body, luminance, BODY_POINT_COUNT, rng)
    braid_rows, braid_columns = _sample_pixels(braid, luminance, BRAID_POINT_COUNT, rng)
    structure = _robot_transform(
        np.concatenate((body_rows, braid_rows)),
        np.concatenate((body_columns, braid_columns)),
        mask,
        rng,
        halo=False,
    )
    silhouette_edge = mask & ~ndimage.binary_erosion(mask, iterations=3)
    structure_braid = np.concatenate(
        (np.zeros(BODY_POINT_COUNT, dtype=bool), np.ones(BRAID_POINT_COUNT, dtype=bool))
    )
    structure_edge = silhouette_edge[
        np.concatenate((body_rows, braid_rows)),
        np.concatenate((body_columns, braid_columns)),
    ]

    outer = ndimage.binary_dilation(mask, iterations=38)
    inner = ndimage.binary_dilation(mask, iterations=8)
    halo_mask = outer & ~inner
    height, width = mask.shape
    normalized_rows = np.linspace(0.0, 1.0, height, dtype=np.float32)[:, None]
    normalized_columns = np.linspace(0.0, 1.0, width, dtype=np.float32)[None, :]
    separation_guard = (
        (normalized_rows >= 0.11)
        & (normalized_rows <= 0.50)
        & (normalized_columns >= 0.61)
        & (normalized_columns <= 0.75)
    )
    halo_mask[separation_guard] = False

    mask_rows, mask_columns = np.nonzero(mask)
    center_x = (float(mask_columns.min()) + float(mask_columns.max())) * 0.5
    center_y = (float(mask_rows.min()) + float(mask_rows.max())) * 0.5
    scale = 0.92 / max(float(np.ptp(mask_columns)), float(np.ptp(mask_rows)))
    row_grid, column_grid = np.indices(mask.shape)
    candidate_x = 0.5 + (column_grid - center_x) * scale
    candidate_y = 0.5 - (row_grid - center_y) * scale
    halo_mask &= (
        (candidate_x >= 0.025)
        & (candidate_x <= 0.975)
        & (candidate_y >= 0.025)
        & (candidate_y <= 0.975)
    )
    halo_rows, halo_columns = _sample_pixels(
        halo_mask,
        np.full_like(luminance, 128.0),
        HALO_COUNT,
        rng,
    )
    halo = _robot_transform(halo_rows, halo_columns, mask, rng, halo=True)
    structure_mask, particle_halo_mask = particle_category_masks(seeds)
    points = np.empty((POINT_COUNT, 3), dtype=np.float32)
    braid_particles = np.zeros(POINT_COUNT, dtype=bool)
    edge_particles = np.zeros(POINT_COUNT, dtype=bool)
    structure_order = rng.permutation(STRUCTURE_COUNT)
    points[structure_mask] = structure[structure_order]
    braid_particles[structure_mask] = structure_braid[structure_order]
    edge_particles[structure_mask] = structure_edge[structure_order]
    points[particle_halo_mask] = halo[rng.permutation(HALO_COUNT)]
    if include_masks:
        return points, braid_particles, edge_particles
    return points


def _rotate_x_then_z(points: np.ndarray, x_angle: float, z_angle: float) -> np.ndarray:
    x = points[:, 0]
    y = points[:, 1]
    z = points[:, 2]
    x_cosine, x_sine = np.cos(x_angle), np.sin(x_angle)
    tilted_y = y * x_cosine - z * x_sine
    tilted_z = y * x_sine + z * x_cosine
    z_cosine, z_sine = np.cos(z_angle), np.sin(z_angle)
    turned_x = x * z_cosine - tilted_y * z_sine
    turned_y = x * z_sine + tilted_y * z_cosine
    return np.column_stack((turned_x, turned_y, tilted_z))


def _fibonacci_directions(count: int, phase: float = 0.0) -> np.ndarray:
    index = np.arange(count, dtype=np.float64) + 0.5
    y = 1.0 - 2.0 * index / count
    radius_xy = np.sqrt(np.maximum(0.0, 1.0 - y * y))
    golden_angle = np.pi * (3.0 - np.sqrt(5.0))
    angle = (index + phase) * golden_angle
    return np.column_stack((radius_xy * np.cos(angle), y, radius_xy * np.sin(angle)))


def _ellipsoid_shell(
    count: int,
    center: tuple[float, float, float],
    radii: tuple[float, float, float],
    rng: np.random.Generator,
    *,
    inner: float,
    outer: float,
    phase: float,
) -> np.ndarray:
    directions = _fibonacci_directions(count, phase)
    radius = rng.uniform(inner, outer, count)
    return np.asarray(center) + directions * np.asarray(radii) * radius[:, None]


def generate_profile_points(
    about: np.ndarray,
    seeds: np.ndarray,
    braid: np.ndarray,
) -> np.ndarray:
    """Stage 1 is the exact stage-0 person, mirrored to face the other way.

    Every particle keeps its identity, colour seed, and braid membership; only
    the horizontal axis is flipped (x -> 1 - x). For the flat 2.5D silhouette a
    horizontal mirror reads as a 180 degrees turn about the vertical axis, so
    the About figure appears to simply rotate to face the opposite direction —
    "the same person, direction changed" — and the 0->1 morph becomes a clean
    horizontal sweep. Depth (z) is preserved so lighting and layering stay
    consistent with About.
    """
    points = about.astype(np.float64).copy()
    points[:, 0] = 1.0 - points[:, 0]
    return np.clip(points, 0.02, 0.98).astype(np.float32)


def _rotate_book(points: np.ndarray, inverse: bool = False) -> np.ndarray:
    x_angle = -BOOK_TILT_X if inverse else BOOK_TILT_X
    y_angle = -BOOK_TURN_Y if inverse else BOOK_TURN_Y
    if inverse:
        x, y, z = points.T
        cy, sy = np.cos(y_angle), np.sin(y_angle)
        turned = np.column_stack((x * cy + z * sy, y, -x * sy + z * cy))
        cx, sx = np.cos(x_angle), np.sin(x_angle)
        x, y, z = turned.T
        return np.column_stack((x, y * cx - z * sx, y * sx + z * cx))
    x, y, z = points.T
    cx, sx = np.cos(x_angle), np.sin(x_angle)
    tilted = np.column_stack((x, y * cx - z * sx, y * sx + z * cx))
    x, y, z = tilted.T
    cy, sy = np.cos(y_angle), np.sin(y_angle)
    return np.column_stack((x * cy + z * sy, y, -x * sy + z * cy))


def _cover_points(count: int, angle: float, rng: np.random.Generator) -> np.ndarray:
    edge_count = int(count * 0.55)
    edge = rng.integers(0, 4, edge_count)
    u = rng.uniform(0.0, 0.63, edge_count)
    v = rng.uniform(0.0, 0.47, edge_count)
    u[edge == 0], u[edge == 1] = 0.0, 0.63
    v[edge == 2], v[edge == 3] = 0.0, 0.47
    fill_count = count - edge_count
    u = np.concatenate((u, rng.uniform(0.0, 0.63, fill_count)))
    v = np.concatenate((v, rng.uniform(0.0, 0.47, fill_count)))
    thickness = rng.normal(0.0, 0.006, count)
    return np.column_stack((u, v - 0.235, thickness + u * np.sin(angle))) + np.column_stack(
        (np.zeros(count), np.zeros(count), u * (np.cos(angle) - 1.0))
    )


def generate_book_points(seeds: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(BOOK_SEED)
    back = _cover_points(1_500, 0.0, rng)
    front = _cover_points(1_500, BOOK_OPEN_ANGLE, rng)

    spine_angle = rng.uniform(0.0, np.pi / 2.0, 900)
    spine = np.column_stack(
        (
            rng.normal(0.0, 0.006, 900),
            rng.uniform(-0.235, 0.235, 900),
            0.075 * (np.sin(spine_angle) - 1.0),
        )
    )
    pages: list[np.ndarray] = []
    for angle in np.deg2rad(np.linspace(5.0, 50.0, 7)):
        count = 330
        side = rng.integers(0, 3, count)
        u = rng.uniform(0.015, 0.60, count)
        v = rng.uniform(-0.215, 0.215, count)
        u[side == 0] = 0.60
        v[side == 1], v[side == 2] = -0.215, 0.215
        pages.append(np.column_stack((u, v, u * (np.cos(angle) - 1.0) + u * np.sin(angle))))
    page_layers = np.concatenate(pages)

    angle = rng.choice(np.deg2rad(np.linspace(5.0, 50.0, 7)), 1_090)
    fore_u = rng.normal(0.605, 0.006, 1_090)
    fore = np.column_stack(
        (fore_u, rng.uniform(-0.215, 0.215, 1_090), fore_u * (np.cos(angle) - 1.0) + fore_u * np.sin(angle))
    )
    fill_angle = rng.uniform(np.deg2rad(4.0), np.deg2rad(52.0), 1_500)
    fill_u = rng.uniform(0.02, 0.59, 1_500)
    fill = np.column_stack(
        (
            fill_u,
            rng.uniform(-0.205, 0.205, 1_500),
            fill_u * (np.cos(fill_angle) - 1.0) + fill_u * np.sin(fill_angle) + rng.normal(0.0, 0.008, 1_500),
        )
    )
    structure = np.concatenate((back, front, spine, page_layers, fore, fill))
    structure[:, 0] -= 0.315
    book_center = np.array((0.5, 0.54, 0.5))
    structure = _rotate_book(structure) + book_center
    halo = _ellipsoid_shell(HALO_COUNT, tuple(book_center), (0.46, 0.40, 0.42), rng, inner=0.88, outer=1.0, phase=0.41)
    return np.clip(structure, 0.02, 0.98).astype(np.float32), np.clip(halo, 0.02, 0.98).astype(np.float32)


def _generate_ring_band(
    count: int,
    inner_radius: float,
    outer_radius: float,
    rng: np.random.Generator,
    phase: float,
) -> np.ndarray:
    index = np.arange(count, dtype=np.float64)
    angle = (index + rng.uniform(0.0, 1.0, count) + phase) * 2.0 * np.pi / count
    radial_mix = (index * 0.6180339887498949 + phase * 0.173) % 1.0
    radius = inner_radius + (outer_radius - inner_radius) * radial_mix
    height = rng.normal(0.0, 0.0045, count)
    local = np.column_stack((radius * np.cos(angle), radius * np.sin(angle), height))
    return SATURN_CENTER + _rotate_x_then_z(local, SATURN_RING_TILT, SATURN_RING_TURN)


def generate_saturn_points(seeds: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(SATURN_SEED)

    surface_count = 4_300
    volume_count = SATURN_BODY_COUNT - surface_count
    surface_directions = _fibonacci_directions(surface_count, 0.31)
    surface_radius = SATURN_BODY_RADIUS + rng.uniform(-0.008, 0.008, surface_count)
    surface = SATURN_CENTER + surface_directions * surface_radius[:, None]

    volume_directions = _fibonacci_directions(volume_count, 0.73)
    volume_radius = 0.025 + 0.177 * np.cbrt(rng.random(volume_count))
    volume = SATURN_CENTER + volume_directions * volume_radius[:, None]
    body = np.concatenate((surface, volume), axis=0)

    ring = _generate_ring_band(SATURN_RING_COUNT, *SATURN_RING_RADII, rng, phase=0.13)
    structure = np.concatenate((body, ring), axis=0)
    if structure.shape != (STRUCTURE_COUNT, 3):
        raise TargetGenerationError(
            f"Saturn structure produced {structure.shape}; expected {(STRUCTURE_COUNT, 3)}."
        )

    dust_candidates = rng.uniform(0.02, 0.98, (HALO_COUNT * 6, 3))
    dust_radius = np.linalg.norm(dust_candidates - SATURN_CENTER, axis=1)
    dust = dust_candidates[dust_radius >= 0.47][:HALO_COUNT]
    if dust.shape != (HALO_COUNT, 3):
        raise TargetGenerationError("Saturn ambient field is undersampled.")
    structure = np.clip(structure, 0.02, 0.98).astype(np.float32)
    dust = np.clip(dust, 0.02, 0.98).astype(np.float32)
    return structure, dust


def generate_particle_seeds() -> np.ndarray:
    rng = np.random.default_rng(PARTICLE_SEED)
    return rng.random(POINT_COUNT, dtype=np.float32)


def identify_saturn_ring(points: np.ndarray, seeds: np.ndarray) -> np.ndarray:
    structure_mask, _ = particle_category_masks(seeds)
    centered = points.astype(np.float64) - SATURN_CENTER
    radius = np.linalg.norm(centered, axis=1)
    normal = np.array(
        (
            np.sin(SATURN_RING_TILT) * np.sin(SATURN_RING_TURN),
            -np.sin(SATURN_RING_TILT) * np.cos(SATURN_RING_TURN),
            np.cos(SATURN_RING_TILT),
        )
    )
    plane_distance = np.abs(np.sum(centered * normal[None, :], axis=1))
    return structure_mask & (radius > 0.30) & (radius < 0.45) & (plane_distance < 0.018)


def generate_stage_styles(
    points: np.ndarray,
    seeds: np.ndarray,
    stage_index: int,
    braid_mask: np.ndarray | None = None,
) -> np.ndarray:
    structure_mask, halo_mask = particle_category_masks(seeds)
    scale = 0.30 + 0.52 * seeds.astype(np.float64)
    scale[halo_mask] = 0.14 + 0.28 * seeds[halo_mask]
    depth = np.clip(points[:, 2].astype(np.float64), 0.0, 1.0)
    scale *= 0.78 + 0.28 * depth
    scale *= (0.98, 0.92, 0.88, 0.84)[stage_index]

    ring_mask = np.zeros(POINT_COUNT, dtype=bool)
    book_edge_mask = np.zeros(POINT_COUNT, dtype=bool)
    # Stage 1 is the mirrored About person, so it deliberately reuses the exact
    # same per-particle scale as stage 0 — no braid-specific treatment.
    if stage_index == 2:
        local = _rotate_book(
            points.astype(np.float64) - np.array((0.5, 0.54, 0.5)), inverse=True
        )
        book_edge_mask = structure_mask & (
            (np.abs(local[:, 1]) > 0.20)
            | (local[:, 0] > 0.27)
            | (local[:, 0] < -0.27)
        )
        scale[structure_mask & ~book_edge_mask] = 0.20 + 0.12 * seeds[structure_mask & ~book_edge_mask]
        scale[book_edge_mask] = 0.34 + 0.16 * seeds[book_edge_mask]
    if stage_index == 3:
        ring_mask = identify_saturn_ring(points, seeds)
        scale[ring_mask] = 0.32 + 0.12 * seeds[ring_mask]
    scale = np.clip(scale, 0.12, 0.95).astype(np.float32)

    palette_index = (
        np.floor(seeds.astype(np.float64) * 9_973.0).astype(np.int64)
        + stage_index
    ) % len(DALA_PALETTE)
    colors = DALA_PALETTE[palette_index]
    colors[halo_mask] = DALA_PALETTE[(palette_index[halo_mask] + 3) % len(DALA_PALETTE)]
    if stage_index == 3:
        ring_sequence = np.arange(POINT_COUNT)[ring_mask]
        colors[ring_mask] = DALA_PALETTE[(ring_sequence // 3) % 2 * 3]
    if stage_index == 2:
        colors[book_edge_mask] = DALA_PALETTE[
            np.where(np.arange(POINT_COUNT)[book_edge_mask] % 2 == 0, 3, 0)
        ]
    styles = np.column_stack((scale, colors)).astype(np.float32)
    if styles.shape != (POINT_COUNT, 4) or int(structure_mask.sum()) != STRUCTURE_COUNT:
        raise TargetGenerationError("Generated style data does not match the MPRT v2 contract.")
    return styles


def generate_stage_metadata(
    points: np.ndarray,
    seeds: np.ndarray,
    stage_index: int,
) -> np.ndarray:
    if stage_index == 0:
        sort_key = -points[:, 1]
    elif stage_index == 1:
        sort_key = points[:, 0]
    elif stage_index == 2:
        sort_key = -points[:, 0]
    else:
        sort_key = -points[:, 1]
    sorted_indices = np.argsort(sort_key, kind="stable")
    order = np.empty(POINT_COUNT, dtype=np.float32)
    order[sorted_indices] = np.linspace(0.0, 1.0, POINT_COUNT, dtype=np.float32)

    rng = np.random.default_rng(STYLE_SEED + stage_index * 101)
    phase = np.mod(seeds.astype(np.float64) * 997.754877666 + stage_index * 0.173, 1.0)
    wobble = rng.uniform(0.16, 0.96, POINT_COUNT)
    speed = rng.uniform(0.24, 1.0, POINT_COUNT)
    if stage_index == 3:
        wobble[identify_saturn_ring(points, seeds)] = 1.0
    return np.column_stack((order, phase, wobble, speed)).astype(np.float32)


def generate_targets() -> np.ndarray:
    seeds = generate_particle_seeds()
    about, braid_mask, _silhouette_edge = generate_about_points(seeds, include_masks=True)
    project = generate_profile_points(about, seeds, braid_mask)
    structure_mask, halo_mask = particle_category_masks(seeds)
    book_structure, book_halo = generate_book_points(seeds)
    book_candidates = np.empty((POINT_COUNT, 3), dtype=np.float32)
    book_candidates[structure_mask] = book_structure
    book_candidates[halo_mask] = book_halo
    publication = match_points_to_particles(project, book_candidates, seeds, 0, True)
    saturn_structure, saturn_halo = generate_saturn_points(seeds)
    saturn_candidates = np.empty((POINT_COUNT, 3), dtype=np.float32)
    saturn_candidates[structure_mask] = saturn_structure
    saturn_candidates[halo_mask] = saturn_halo
    contact = match_points_to_particles(publication, saturn_candidates, seeds, 1, True)
    positions = (about, project, publication, contact)
    stages = []
    for stage_index, points in enumerate(positions):
        position = np.column_stack((points, seeds)).astype(np.float32)
        styles = generate_stage_styles(
            points, seeds, stage_index, braid_mask if stage_index == 1 else None
        )
        metadata = generate_stage_metadata(points, seeds, stage_index)
        stages.append(np.column_stack((position, styles, metadata)).astype(np.float32))
    return np.stack(stages, axis=0)


def encode_targets(targets: np.ndarray) -> bytes:
    expected_shape = (STAGE_COUNT, POINT_COUNT, COMPONENT_COUNT)
    if targets.shape != expected_shape:
        raise TargetGenerationError(f"Targets have shape {targets.shape}; expected {expected_shape}.")
    if targets.dtype != np.float32:
        raise TargetGenerationError(f"Targets have dtype {targets.dtype}; expected float32.")
    if not np.isfinite(targets).all():
        raise TargetGenerationError("Targets contain NaN or infinite values.")
    if np.any(targets < 0.0) or np.any(targets > 1.0):
        raise TargetGenerationError("MPRT v2 target values must stay in [0, 1].")
    header = HEADER.pack(MAGIC, VERSION, STAGE_COUNT, POINT_COUNT, COMPONENT_COUNT)
    payload = np.asarray(targets, dtype="<f4").tobytes(order="C")
    encoded = header + payload
    if len(encoded) != EXPECTED_FILE_SIZE:
        raise TargetGenerationError(
            f"Encoded target file has {len(encoded)} bytes; expected {EXPECTED_FILE_SIZE}."
        )
    return encoded


def decode_targets(encoded: bytes) -> np.ndarray:
    if len(encoded) != EXPECTED_FILE_SIZE:
        raise TargetGenerationError(
            f"Target file has {len(encoded)} bytes; expected {EXPECTED_FILE_SIZE}."
        )
    magic, version, stages, points, components = HEADER.unpack_from(encoded)
    expected = (MAGIC, VERSION, STAGE_COUNT, POINT_COUNT, COMPONENT_COUNT)
    if (magic, version, stages, points, components) != expected:
        raise TargetGenerationError("Target header does not match the MPRT v2 contract.")
    return np.frombuffer(encoded, dtype="<f4", offset=HEADER.size).reshape(
        STAGE_COUNT, POINT_COUNT, COMPONENT_COUNT
    ).copy()


def _project_preview(points: np.ndarray) -> np.ndarray:
    centered = points[:, :3].astype(np.float64) - 0.5
    return _rotate_x_then_z(centered, np.deg2rad(-3.0), np.deg2rad(1.5)) + 0.5


def render_preview(targets: np.ndarray, path: Path) -> None:
    panel = 480
    margin = 24
    preview = Image.new("RGB", (panel * STAGE_COUNT, panel), "#05070b")
    draw = ImageDraw.Draw(preview)
    font = ImageFont.load_default(size=16)
    labels = ("01 ABOUT / ROBOT", "02 PROJECT / PROFILE", "03 PUBLICATION / BOOK", "04 CONTACT / SATURN")
    palette = tuple(
        "#{:02x}{:02x}{:02x}".format(*tuple((color * 255.0).round().astype(np.uint8)))
        for color in DALA_PALETTE
    )
    _, halo_mask = particle_category_masks(targets[0, :, 3])

    for stage_index, label in enumerate(labels):
        offset = stage_index * panel
        draw.rectangle((offset, 0, offset + panel - 1, panel - 1), outline="#202938")
        draw.text((offset + margin, margin), label, fill="#f4ead8", font=font)
        points = _project_preview(targets[stage_index, :, :4])
        order = np.argsort(points[:, 2])
        for particle_index in order:
            x, y, z = points[particle_index]
            px = offset + int(margin + x * (panel - margin * 2))
            py = int(margin + (1.0 - y) * (panel - margin * 2))
            if halo_mask[particle_index]:
                color = "#30465a"
            else:
                color = palette[int(np.floor(targets[stage_index, particle_index, 3] * 9_973.0) + stage_index) % len(palette)]
            draw.point((px, py), fill=color)
            if not halo_mask[particle_index] and z > 0.68 and particle_index % 5 == 0:
                draw.point((px + 1, py), fill=color)

    path.parent.mkdir(parents=True, exist_ok=True)
    preview.save(path, format="PNG", optimize=True)


def _atomic_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        dir=path.parent,
        prefix=f".{path.stem}-",
        suffix=path.suffix,
        delete=False,
    )
    temporary = Path(handle.name)
    try:
        with handle:
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def generate_outputs(binary_path: Path, preview_path: Path) -> tuple[np.ndarray, bytes]:
    targets = generate_targets()
    encoded = encode_targets(targets)
    decoded = decode_targets(encoded)
    if not np.array_equal(decoded, targets):
        raise TargetGenerationError("Binary round trip changed target values.")
    _atomic_write(binary_path, encoded)

    temporary_preview = preview_path.with_name(f".{preview_path.name}.tmp.png")
    try:
        render_preview(targets, temporary_preview)
        with Image.open(temporary_preview) as image:
            image.verify()
        preview_path.parent.mkdir(parents=True, exist_ok=True)
        os.replace(temporary_preview, preview_path)
    finally:
        temporary_preview.unlink(missing_ok=True)
    return targets, encoded


def run_self_test() -> None:
    first = generate_targets()
    second = generate_targets()
    if not np.array_equal(first, second):
        raise TargetGenerationError("Repeated target generation is not deterministic.")
    first_bytes = encode_targets(first)
    second_bytes = encode_targets(second)
    if first_bytes != second_bytes:
        raise TargetGenerationError("Repeated binary generation is not byte deterministic.")
    if not np.array_equal(decode_targets(first_bytes), first):
        raise TargetGenerationError("Binary encode/decode self-test failed.")
    if first.shape != (STAGE_COUNT, POINT_COUNT, COMPONENT_COUNT):
        raise TargetGenerationError("Generated MPRT v2 payload has the wrong shape.")
    digest = hashlib.sha256(first_bytes).hexdigest()
    print(f"PASS: deterministic MPRT target self-test ({digest}).")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate first-party portfolio particle targets.")
    parser.add_argument("--self-test", action="store_true", help="run deterministic in-memory checks")
    arguments = parser.parse_args()
    if arguments.self_test:
        run_self_test()
        return

    targets, encoded = generate_outputs(OUTPUT_BINARY, PREVIEW_IMAGE)
    print(
        f"Generated {OUTPUT_BINARY.relative_to(ROOT)}: {len(encoded)} bytes, "
        f"sha256={hashlib.sha256(encoded).hexdigest()}"
    )
    for label, stage in zip(("About", "Project", "Publication", "Contact"), targets):
        minimum = stage[:, :4].min(axis=0)
        maximum = stage[:, :4].max(axis=0)
        print(
            f"{label}: X {minimum[0]:.4f}-{maximum[0]:.4f}, "
            f"Y {minimum[1]:.4f}-{maximum[1]:.4f}, "
            f"Z {minimum[2]:.4f}-{maximum[2]:.4f}, "
            f"W {minimum[3]:.4f}-{maximum[3]:.4f}"
        )
    print(f"Preview: {PREVIEW_IMAGE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
