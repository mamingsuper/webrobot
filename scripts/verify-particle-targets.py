#!/usr/bin/env python3

from __future__ import annotations

import hashlib
import importlib.util
from pathlib import Path
import struct
import sys
from types import ModuleType

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
GENERATOR_PATH = ROOT / "scripts/generate-particle-targets.py"
OUTPUT_BINARY = ROOT / "public/particles/portfolio-targets.bin"
PREVIEW_IMAGE = ROOT / "docs/design-references/standalone-particle-targets.png"

MAGIC = b"MPRT"
VERSION = 2
STAGE_COUNT = 4
POINT_COUNT = 10_000
COMPONENT_COUNT = 12
STRUCTURE_COUNT = 8_800
HALO_COUNT = POINT_COUNT - STRUCTURE_COUNT
CATEGORY_SEED = 330033330
HEADER = struct.Struct("<4s4I")
EXPECTED_FILE_SIZE = HEADER.size + STAGE_COUNT * POINT_COUNT * COMPONENT_COUNT * 4
DALA_PALETTE = np.array(
    (
        (0xC8, 0x8D, 0x00),
        (0x5C, 0x01, 0xBB),
        (0x00, 0x72, 0x49),
        (0xB1, 0xA0, 0xB6),
    ),
    dtype=np.float32,
) / np.float32(255.0)


class TargetValidationError(RuntimeError):
    """Raised when standalone particle targets violate their contract."""


def require(condition: bool, message: str) -> None:
    if not condition:
        raise TargetValidationError(message)


def load_generator() -> ModuleType:
    specification = importlib.util.spec_from_file_location(
        "standalone_particle_target_generator", GENERATOR_PATH
    )
    require(specification is not None, f"Could not load {GENERATOR_PATH}.")
    require(specification.loader is not None, f"No Python loader is available for {GENERATOR_PATH}.")
    module = importlib.util.module_from_spec(specification)
    sys.modules[specification.name] = module
    try:
        specification.loader.exec_module(module)
    except Exception as error:
        sys.modules.pop(specification.name, None)
        raise TargetValidationError(
            f"Could not import generator: {type(error).__name__}: {error}"
        ) from error
    for name in ("generate_targets", "encode_targets", "decode_targets"):
        require(callable(getattr(module, name, None)), f"Generator is missing callable {name}().")
    return module


def parse_binary(path: Path) -> tuple[np.ndarray, bytes]:
    require(path.exists(), f"Target binary is missing at {path}.")
    encoded = path.read_bytes()
    require(
        len(encoded) == EXPECTED_FILE_SIZE,
        f"Target binary has {len(encoded)} bytes; expected {EXPECTED_FILE_SIZE}.",
    )
    magic, version, stages, points, components = HEADER.unpack_from(encoded)
    require(magic == MAGIC, f"Target magic is {magic!r}; expected {MAGIC!r}.")
    require(version == VERSION, f"Target version is {version}; expected {VERSION}.")
    require(stages == STAGE_COUNT, f"Target stage count is {stages}; expected {STAGE_COUNT}.")
    require(points == POINT_COUNT, f"Target point count is {points}; expected {POINT_COUNT}.")
    require(components == COMPONENT_COUNT, f"Target component count is {components}; expected 12.")
    targets = np.frombuffer(encoded, dtype="<f4", offset=HEADER.size).reshape(
        STAGE_COUNT, POINT_COUNT, COMPONENT_COUNT
    )
    require(np.isfinite(targets).all(), "Target payload contains NaN or infinite values.")
    require(
        bool(np.all((targets >= 0.0) & (targets <= 1.0))),
        "All MPRT v2 position, style, and metadata values must stay in [0, 1].",
    )
    return targets.copy(), encoded


def particle_category_masks() -> tuple[np.ndarray, np.ndarray]:
    halo = np.zeros(POINT_COUNT, dtype=bool)
    category_rng = np.random.default_rng(CATEGORY_SEED)
    halo[category_rng.permutation(POINT_COUNT)[:HALO_COUNT]] = True
    return ~halo, halo


def spatial_sort_key(points: np.ndarray, stage_index: int) -> np.ndarray:
    if stage_index == 0:
        return -points[:, 1]
    if stage_index == 1:
        return -points[:, 0]
    if stage_index == 2:
        return -points[:, 0]
    return -points[:, 1]


def validate_contract(targets: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    require(
        targets.shape == (STAGE_COUNT, POINT_COUNT, COMPONENT_COUNT),
        f"Target array has shape {targets.shape}; expected {(STAGE_COUNT, POINT_COUNT, COMPONENT_COUNT)}.",
    )
    positions = targets[:, :, :4]
    styles = targets[:, :, 4:8]
    metadata = targets[:, :, 8:12]
    seeds = positions[:, :, 3]
    require(
        all(seeds[stage].tobytes() == seeds[0].tobytes() for stage in range(1, STAGE_COUNT)),
        "Position seed must preserve particle identity across all four stages.",
    )
    require(float(np.ptp(seeds[0])) >= 0.99, "Position seeds do not cover [0, 1].")
    require(len(np.unique(seeds[0])) >= 9_990, "Position seeds contain too many duplicates.")

    palette_bytes = {color.tobytes() for color in DALA_PALETTE}
    for stage_index, label in enumerate(("About", "Project", "Publication", "Contact")):
        points = positions[stage_index, :, :3]
        spans = np.ptp(points, axis=0)
        minimum_spans = 0.60
        require(bool(np.all(spans >= minimum_spans)), f"{label} XYZ spans are too small: {spans.tolist()}.")
        mobile_spans = np.ptp(points[:7_000], axis=0)
        require(
            bool(np.all(mobile_spans >= spans * 0.94)),
            f"The first 7,000 {label} points do not cover its full XYZ extent.",
        )
        require(
            all(color.tobytes() in palette_bytes for color in styles[stage_index, :, 1:4]),
            f"{label} uses a color outside the exact Dala palette.",
        )
        require(
            0.11 <= float(styles[stage_index, :, 0].min())
            and float(styles[stage_index, :, 0].max()) <= 0.96,
            f"{label} normalized scales are outside the intended v2 range.",
        )

        order = metadata[stage_index, :, 0]
        require(len(np.unique(order)) == POINT_COUNT, f"{label} order is not a unique spatial rank.")
        require(float(order.min()) == 0.0 and float(order.max()) == 1.0, f"{label} order must span [0, 1].")
        correlation = float(np.corrcoef(order, spatial_sort_key(points, stage_index))[0, 1])
        require(correlation >= 0.92, f"{label} order is not spatially sorted (r={correlation:.4f}).")
        require(float(np.ptp(metadata[stage_index, :, 1])) >= 0.99, f"{label} phase lacks variation.")
        require(float(np.ptp(metadata[stage_index, :, 2])) >= 0.78, f"{label} wobble lacks variation.")
        require(float(np.ptp(metadata[stage_index, :, 3])) >= 0.74, f"{label} speed lacks variation.")
    return positions, styles


def validate_about(about: np.ndarray, structure_mask: np.ndarray) -> None:
    x, y, z = about[:, :3].T
    head = structure_mask & (x > 0.32) & (x < 0.76) & (y > 0.64) & (y < 0.90)
    face = structure_mask & (x > 0.32) & (x < 0.65) & (y > 0.67) & (y < 0.84)
    antennas = structure_mask & (x > 0.34) & (x < 0.70) & (y > 0.88)
    flower = structure_mask & (x < 0.35) & (y > 0.43) & (y < 0.69)
    torso = structure_mask & (x > 0.34) & (x < 0.68) & (y > 0.34) & (y < 0.65)
    legs = structure_mask & (x > 0.34) & (x < 0.68) & (y < 0.36)
    require(int(head.sum()) >= 2_600, "About robot lost its smiling box head.")
    require(int(face.sum()) >= 1_200, "About robot lost its readable face panel.")
    require(int(antennas.sum()) >= 160, "About robot lost its twin antennas.")
    require(int(flower.sum()) >= 650, "About robot lost its flower gesture.")
    require(int(torso.sum()) >= 2_000, "About robot lost its compact torso.")
    require(int(legs.sum()) >= 1_300, "About robot lost its legs and block feet.")
    mobile = np.arange(POINT_COUNT) < 7_000
    require(int((face & mobile).sum()) >= 850,
            "First 7,000 points lose the About robot face.")
    require(int((flower & mobile).sum()) >= 450,
            "First 7,000 points lose the About robot flower.")
    require(int((legs & mobile).sum()) >= 900,
            "First 7,000 points lose the About robot legs.")
    require(float(np.ptp(z[structure_mask])) >= 0.50, "About lacks meaningful front/back depth.")


def validate_human_profile(
    about: np.ndarray,
    project: np.ndarray,
    project_styles: np.ndarray,
    structure_mask: np.ndarray,
) -> None:
    x, y, z = project[:, :3].T
    nose = structure_mask & (x > 0.70) & (y > 0.42) & (y < 0.68)
    rear_cranium = structure_mask & (x < 0.36) & (y > 0.55)
    neck = structure_mask & (x < 0.56) & (y < 0.28)
    jaw = structure_mask & (x > 0.54) & (y > 0.25) & (y < 0.45)
    require(int(nose.sum()) >= 450, "Project human profile lost its right-facing nose and lips.")
    require(int(rear_cranium.sum()) >= 900, "Project human profile lost its rear cranium.")
    require(int(neck.sum()) >= 1_000, "Project human profile lost its neck.")
    require(int(jaw.sum()) >= 700, "Project human profile lost its jawline.")
    require(float(np.ptp(project[structure_mask, 2])) >= 0.30,
            "Project human profile lacks front/back facial depth.")
    warm = np.isclose(project_styles[:, 1:4], DALA_PALETTE[0]).all(axis=1) \
        | np.isclose(project_styles[:, 1:4], DALA_PALETTE[3]).all(axis=1)
    cool = np.isclose(project_styles[:, 1:4], DALA_PALETTE[1]).all(axis=1) \
        | np.isclose(project_styles[:, 1:4], DALA_PALETTE[2]).all(axis=1)
    require(float(warm[structure_mask].mean()) >= 0.74,
            "Project human profile lost its warm/pale color emphasis.")
    require(0.15 <= float(cool[structure_mask].mean()) <= 0.30,
            "Project human profile needs restrained cool-color depth accents.")
    mobile = project[:7_000]
    require(bool(np.all(np.ptp(mobile[:, :2], axis=0) >= np.ptp(project[:, :2], axis=0) * 0.94)),
            "First 7,000 Project points no longer cover the human profile.")
    mobile_ids = np.arange(POINT_COUNT) < 7_000
    require(int((nose & mobile_ids).sum()) >= 300,
            "First 7,000 Project points lose the right-facing nose.")
    require(int((neck & mobile_ids).sum()) >= 650,
            "First 7,000 Project points lose the human neck.")
    displacement = np.linalg.norm(project[:, :3] - about[:, :3], axis=1)
    require(float(displacement.mean()) <= 0.30,
            "About→Project semantic matching is too abrupt for a smooth face morph.")


def covariance_eigenvalue_ratio(points: np.ndarray) -> float:
    centered = points - points.mean(axis=0)
    covariance = centered.T @ centered / len(centered)
    eigenvalues = np.linalg.eigvalsh(covariance)
    return float(eigenvalues[0] / eigenvalues[2])


def validate_book(
    publication: np.ndarray,
    publication_styles: np.ndarray,
    structure_mask: np.ndarray,
    halo_mask: np.ndarray,
) -> None:
    xyz = publication[:, :3].astype(np.float64)
    centered = xyz - np.array((0.5, 0.54, 0.5))
    turn, tilt = np.deg2rad(28.0), np.deg2rad(-18.0)
    x, y, z = centered.T
    turned = np.column_stack((x * np.cos(turn) + z * np.sin(turn), y, -x * np.sin(turn) + z * np.cos(turn)))
    x, y, z = turned.T
    local = np.column_stack((x, y * np.cos(tilt) - z * np.sin(tilt), y * np.sin(tilt) + z * np.cos(tilt)))
    lx, ly, lz = local.T
    spine = structure_mask & (np.abs(lx) <= 0.04)
    fore_edge = structure_mask & (lx >= 0.27)
    cover_edges = structure_mask & ((np.abs(ly) >= 0.20) | (np.abs(lx) >= 0.27))
    interior = structure_mask & ~cover_edges
    require(int(spine.sum()) >= 550, "Publication book spine is undersampled.")
    require(int(fore_edge.sum()) >= 2_000, "Publication book fore-edge is missing.")
    require(int(cover_edges.sum()) >= 5_000, "Publication cover/page edge shell is too sparse.")
    require(float(np.ptp(lz[structure_mask])) >= 0.28, "Publication book does not visibly open.")
    histogram, _ = np.histogram(lz[fore_edge], bins=48)
    peaks = sum(histogram[index] > histogram[index - 1] and histogram[index] > histogram[index + 1]
                for index in range(1, len(histogram) - 1))
    require(peaks >= 5, f"Publication page fan exposes only {peaks} separated thickness peaks.")
    require(covariance_eigenvalue_ratio(xyz[structure_mask]) <= 0.50, "Publication remains sphere-like instead of book-like.")
    require(float(np.mean(publication_styles[cover_edges, 0])) >= float(np.mean(publication_styles[interior, 0])) * 1.03,
            "Publication edge particles are not emphasized over the interior.")
    require(float(np.linalg.norm(xyz[halo_mask] - np.array((0.5, 0.54, 0.5)), axis=1).min()) >= 0.34,
            "Publication halo obscures the book.")
    mobile = np.arange(POINT_COUNT) < 7_000
    require(int((spine & mobile).sum()) >= 350, "First 7,000 Publication points lose the spine.")
    require(int((fore_edge & mobile).sum()) >= 1_300, "First 7,000 Publication points lose the fore-edge.")


def validate_saturn(contact: np.ndarray, structure_mask: np.ndarray, halo_mask: np.ndarray) -> None:
    xyz = contact[:, :3].astype(np.float64)
    centered = xyz - 0.5
    radius = np.linalg.norm(centered, axis=1)
    tilt = np.deg2rad(68.0)
    turn = np.deg2rad(-14.0)
    normal = np.array((np.sin(tilt) * np.sin(turn), -np.sin(tilt) * np.cos(turn), np.cos(tilt)))
    plane_distance = np.abs(np.sum(centered * normal[None, :], axis=1))
    body = structure_mask & (radius < 0.26)
    ring = structure_mask & (radius > 0.30) & (radius < 0.45) & (plane_distance < 0.018)
    satellites = structure_mask & ~body & ~ring
    require(int(body.sum()) == 5_600, f"Contact planet has {int(body.sum())} points; expected 5,600.")
    require(int(ring.sum()) == 3_200, f"Contact rings have {int(ring.sum())} points; expected 3,200.")
    require(int(satellites.sum()) == 0, "Contact must not contain satellite particles.")
    require(covariance_eigenvalue_ratio(xyz[body]) >= 0.96, "Contact planet body is not spherical.")
    body_radius = radius[body]
    ring_radius = radius[ring]
    require(float(ring_radius.min() - body_radius.max()) >= 0.08, "Contact lost the black planet/ring gap.")
    require(float(np.diff(np.sort(ring_radius)).max()) < 0.012, "Contact ring split into multiple radial bands.")
    ring_points = xyz[ring]
    projected_radius = np.linalg.norm(ring_points[:, :2] - 0.5, axis=1)
    require(float(projected_radius.min()) <= 0.14,
            "Contact ring never intersects the planet disk in xy projection.")
    crossing = projected_radius < 0.8 * 0.21
    require(bool(np.any(crossing & (ring_points[:, 2] > 0.5)))
            and bool(np.any(crossing & (ring_points[:, 2] < 0.5))),
            "Contact ring does not pass both in front of and behind the planet disk.")
    ring_centered = ring_points - ring_points.mean(axis=0)
    eigenvalues = np.linalg.eigvalsh(ring_centered.T @ ring_centered / len(ring_centered))
    require(float(eigenvalues[0]) <= 3.0e-5, "Contact rings are too thick.")
    fitted_normal = np.linalg.eigh(ring_centered.T @ ring_centered / len(ring_centered))[1][:, 0]
    normal_error = np.rad2deg(np.arccos(np.clip(abs(float(fitted_normal @ normal)), 0.0, 1.0)))
    require(normal_error < 3.0, f"Contact ring normal is off by {normal_error:.2f}°.")
    require(float(np.ptp(ring_points[:, 2])) >= 0.50, "Contact ring lacks front/back depth ordering.")
    require(float(radius[halo_mask].min()) >= 0.43, "Contact ambient halo obscures the ring gaps.")
    mobile = np.arange(POINT_COUNT) < 7_000
    for label, selection, minimum in (
        ("planet body", body, 3_700),
        ("single ring", ring, 2_050),
    ):
        require(int((selection & mobile).sum()) >= minimum, f"First 7,000 Contact points lose the {label}.")


def validate_matching(positions: np.ndarray, structure_mask: np.ndarray, halo_mask: np.ndarray) -> None:
    require(float(np.linalg.norm(positions[1, :, :3] - positions[0, :, :3], axis=1).mean()) <= 0.35,
            "About→Project matching exceeds its absolute displacement budget.")
    rng = np.random.default_rng(330033)
    for source, target in ((1, 2), (2, 3)):
        randomized = positions[target, :, :3].copy()
        for selection in (structure_mask, halo_mask):
            randomized[selection] = randomized[selection][rng.permutation(int(selection.sum()))]
        baseline = float(np.linalg.norm(randomized - positions[source, :, :3], axis=1).mean())
        matched = float(np.linalg.norm(positions[target, :, :3] - positions[source, :, :3], axis=1).mean())
        maximum_ratio = 0.60 if source == 1 else 0.55
        require(matched <= baseline * maximum_ratio,
                f"Stage {source}→{target} matching is {matched / baseline:.3f}× random baseline; "
                f"expected ≤{maximum_ratio:.2f}×.")


def validate_determinism(module: ModuleType, encoded: bytes, targets: np.ndarray) -> None:
    first = module.generate_targets()
    second = module.generate_targets()
    require(np.array_equal(first, second), "Consecutive generation changed float values.")
    first_bytes = module.encode_targets(first)
    second_bytes = module.encode_targets(second)
    require(first_bytes == second_bytes, "Consecutive generation changed binary bytes.")
    require(first_bytes == encoded, "Checked-in binary differs from deterministic generator output.")
    require(np.array_equal(module.decode_targets(encoded), targets), "Generator decoder changed payload values.")


def validate_preview(path: Path) -> None:
    require(path.exists(), f"Preview image is missing at {path}.")
    with Image.open(path) as preview:
        preview.load()
        require(preview.format == "PNG", f"Preview format is {preview.format}; expected PNG.")
        require(preview.mode == "RGB", f"Preview mode is {preview.mode}; expected RGB.")
        require(preview.size == (1_920, 480), f"Preview size is {preview.size}; expected (1920, 480).")
        pixels = np.asarray(preview)
        background = np.array((5, 7, 11), dtype=np.uint8)
        non_background = np.any(pixels != background, axis=2)
        for panel_index in range(STAGE_COUNT):
            panel = non_background[:, panel_index * 480:(panel_index + 1) * 480]
            require(int(panel.sum()) >= 4_000, f"Preview panel {panel_index + 1} is nearly empty.")


def main() -> None:
    module = load_generator()
    targets, encoded = parse_binary(OUTPUT_BINARY)
    positions, styles = validate_contract(targets)
    structure_mask, halo_mask = particle_category_masks()
    regenerated_about, _ = module.generate_about_points(
        positions[0, :, 3], include_masks=True
    )
    require(np.array_equal(regenerated_about, positions[0, :, :3]),
            "Stage-0 semantic masks no longer align with the checked-in binary.")
    require(700 <= int(halo_mask[:7_000].sum()) <= 1_000, "First 7,000 points have a bad halo ratio.")
    validate_about(positions[0], structure_mask)
    validate_human_profile(positions[0], positions[1], styles[1], structure_mask)
    validate_book(positions[2], styles[2], structure_mask, halo_mask)
    validate_saturn(positions[3], structure_mask, halo_mask)
    validate_matching(positions, structure_mask, halo_mask)
    validate_determinism(module, encoded, targets)
    validate_preview(PREVIEW_IMAGE)
    print(
        "PASS: MPRT v2 targets satisfy contract, palette, geometry, mobile coverage, "
        f"determinism, and preview checks (sha256={hashlib.sha256(encoded).hexdigest()})."
    )


if __name__ == "__main__":
    try:
        main()
    except TargetValidationError as error:
        raise SystemExit(f"FAIL: {error}") from error
