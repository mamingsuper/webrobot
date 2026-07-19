#!/usr/bin/env python3

from __future__ import annotations

import argparse
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage


ROOT = Path(__file__).resolve().parents[1]
SOURCE_EXR = ROOT / "public/images/pos-33.exr"
ROBOT_IMAGE = ROOT / "public/images/robot-source.png"
OUTPUT_EXR = ROOT / "public/images/pos-ming-robot-v1.exr"
PREVIEW_IMAGE = ROOT / "docs/design-references/native-dala-robot-points.png"

ATLAS_SIZE = 200
TARGET_SIZE = 100
PARTICLE_COUNT = TARGET_SIZE * TARGET_SIZE
ROBOT_CROP = (660, 66, 1536, 1024)
RANDOM_SEED = 33
BOOK_RANDOM_SEED = 3303

PONYTAIL_TRIM_ROW_STOPS = np.array((0.50, 0.58, 0.70, 0.78, 0.86, 1.00))
PONYTAIL_TRIM_COLUMN_STOPS = np.array((0.68, 0.68, 0.79, 0.84, 0.82, 0.75))
BRAID_START_ROW = 0.13
BRAID_END_ROW = 0.60


def decode_exr(path: Path) -> np.ndarray:
    command = [
        "ffmpeg", "-v", "error", "-i", str(path), "-f", "rawvideo",
        "-pix_fmt", "gbrpf32le", "pipe:1",
    ]
    raw = subprocess.run(command, check=True, capture_output=True).stdout
    planar = np.frombuffer(raw, dtype="<f4").reshape(3, ATLAS_SIZE, ATLAS_SIZE)
    green, blue, red = planar
    return np.stack((red, green, blue), axis=-1).copy()


def encode_exr(path: Path, rgb: np.ndarray) -> None:
    red = np.ascontiguousarray(rgb[:, :, 0], dtype="<f4")
    green = np.ascontiguousarray(rgb[:, :, 1], dtype="<f4")
    blue = np.ascontiguousarray(rgb[:, :, 2], dtype="<f4")
    planar = np.stack((green, blue, red), axis=0)
    command = [
        "ffmpeg", "-v", "error", "-y", "-f", "rawvideo",
        "-pixel_format", "gbrpf32le", "-video_size", f"{ATLAS_SIZE}x{ATLAS_SIZE}",
        "-framerate", "1", "-i", "pipe:0", "-frames:v", "1", "-c:v", "exr",
        "-compression", "zip16", "-format", "float", str(path),
    ]
    subprocess.run(command, input=planar.tobytes(), check=True)


def extract_robot_silhouette(image: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    rgb = image.astype(np.float32)
    luminance = rgb[:, :, 0] * 0.2126 + rgb[:, :, 1] * 0.7152 + rgb[:, :, 2] * 0.0722
    raw_mask = luminance >= 22
    connected = ndimage.binary_dilation(raw_mask, iterations=3)
    connected = ndimage.binary_closing(connected, iterations=1)
    labels, count = ndimage.label(connected)
    if count == 0:
        raise RuntimeError("Robot silhouette extraction produced no connected regions.")

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
    normalized_rows = np.linspace(0.0, 1.0, height, dtype=np.float32)
    normalized_columns = np.linspace(0.0, 1.0, width, dtype=np.float32)
    column_limit = np.interp(
        normalized_rows,
        PONYTAIL_TRIM_ROW_STOPS,
        PONYTAIL_TRIM_COLUMN_STOPS,
        left=1.0,
    )
    return (
        (normalized_rows[:, None] >= PONYTAIL_TRIM_ROW_STOPS[0])
        & (normalized_columns[None, :] > column_limit[:, None])
    )


def ponytail_braid_region(shape: tuple[int, int]) -> np.ndarray:
    height, width = shape
    rows = np.linspace(0.0, 1.0, height, dtype=np.float32)[:, None]
    columns = np.linspace(0.0, 1.0, width, dtype=np.float32)[None, :]
    progress = np.clip(
        (rows - BRAID_START_ROW) / (BRAID_END_ROW - BRAID_START_ROW),
        0.0,
        1.0,
    )
    center = 0.81 - 0.045 * progress + 0.008 * np.sin(np.pi * progress)
    taper = 0.068 * (1.0 - progress) + 0.012 * progress
    braided_lobes = 0.84 + 0.16 * np.cos(progress * np.pi * 8.0)
    half_width = taper * braided_lobes
    active_rows = (rows >= BRAID_START_ROW) & (rows <= BRAID_END_ROW)
    return active_rows & (np.abs(columns - center) <= half_width)


def refine_robot_mask(mask: np.ndarray) -> np.ndarray:
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
    rear_hair_zone = (
        (rows >= BRAID_START_ROW)
        & (rows <= BRAID_END_ROW)
        & (columns > head_limit)
    )
    braid = ponytail_braid_region(refined.shape)
    refined[rear_hair_zone] = False
    refined[braid] = original[braid]
    separation_channel = (
        (rows >= 0.15)
        & (rows <= 0.47)
        & (columns >= 0.65)
        & (columns <= 0.735)
    )
    refined[separation_channel] = False
    return refined


def extract_robot_mask(image: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    mask, luminance = extract_robot_silhouette(image)
    return refine_robot_mask(mask), luminance


def generate_robot_points(mask: np.ndarray, luminance: np.ndarray) -> np.ndarray:
    rng = np.random.default_rng(RANDOM_SEED)
    rows, columns = np.nonzero(mask)
    if len(rows) < PARTICLE_COUNT:
        raise RuntimeError(f"Robot silhouette has only {len(rows)} candidate pixels.")

    normalized_light = np.clip(luminance[rows, columns] / 255, 0, 1)
    edge = mask & ~ndimage.binary_erosion(mask, iterations=3)
    edge_weight = edge[rows, columns].astype(np.float32)
    weights = (0.30 + np.sqrt(normalized_light)) * (0.72 + 0.78 * edge_weight)
    weights /= weights.sum()
    selected = rng.choice(len(rows), size=PARTICLE_COUNT, replace=False, p=weights)
    y = rows[selected].astype(np.float32) + rng.uniform(-0.22, 0.22, PARTICLE_COUNT)
    x = columns[selected].astype(np.float32) + rng.uniform(-0.22, 0.22, PARTICLE_COUNT)

    mask_rows, mask_columns = np.nonzero(mask)
    min_x, max_x = float(mask_columns.min()), float(mask_columns.max())
    min_y, max_y = float(mask_rows.min()), float(mask_rows.max())
    center_x = (min_x + max_x) * 0.5
    center_y = (min_y + max_y) * 0.5
    scale = 0.92 / max(max_x - min_x, max_y - min_y)
    position_x = 0.5 + (x - center_x) * scale
    position_y = 0.5 - (y - center_y) * scale

    distance = ndimage.distance_transform_edt(mask)
    sampled_distance = distance[rows[selected], columns[selected]]
    thickness = 0.035 + 0.24 * np.sqrt(np.clip(sampled_distance / 180, 0, 1))
    depth_bias = 0.018 * np.sin((position_y - 0.5) * np.pi * 2)
    position_z = 0.5 + rng.uniform(-1, 1, PARTICLE_COUNT) * thickness + depth_bias

    points = np.column_stack((position_x, position_y, position_z))
    points = np.clip(points, 0.02, 0.98).astype(np.float32)
    return points[rng.permutation(PARTICLE_COUNT)]


def mirror_robot_points(points: np.ndarray) -> np.ndarray:
    mirrored = np.array(points, dtype=np.float32, copy=True)
    mirrored[:, 0] = 1.0 - mirrored[:, 0]
    return mirrored


def generate_book_points() -> np.ndarray:
    rng = np.random.default_rng(BOOK_RANDOM_SEED)
    page_sets = []

    def page_coordinates(
        side: float,
        u: np.ndarray,
        v: np.ndarray,
        depth_offset: np.ndarray | float = 0.0,
    ) -> np.ndarray:
        x = 0.5 + side * (0.020 + 0.220 * u)
        bottom = 0.33 + 0.060 * u + 0.012 * np.sin(np.pi * u)
        top = 0.68 - 0.060 * u + 0.012 * np.sin(np.pi * u)
        y = bottom + v * (top - bottom)
        z = 0.40 + 0.17 * np.power(u, 1.35)
        z += 0.035 * np.square(2.0 * v - 1.0)
        z += side * 0.008 * (v - 0.5)
        z += depth_offset
        return np.column_stack((x, y, z))

    for side in (-1.0, 1.0):
        surface_count = 2_200
        surface_u = rng.beta(1.15, 1.15, surface_count)
        surface_v = rng.random(surface_count)
        surface = page_coordinates(side, surface_u, surface_v)
        surface[:, 2] += rng.normal(0.0, 0.003, surface_count)

        outer_count = 650
        outer_u = np.clip(1.0 - rng.beta(0.7, 18.0, outer_count), 0.965, 1.0)
        outer_v = rng.random(outer_count)
        outer = page_coordinates(side, outer_u, outer_v)

        gutter_count = 650
        gutter_u = np.clip(rng.beta(0.7, 18.0, gutter_count), 0.0, 0.035)
        gutter_v = rng.random(gutter_count)
        gutter = page_coordinates(side, gutter_u, gutter_v)

        outline_count = 1_000
        outline_u = rng.random(outline_count)
        outline_v = np.concatenate(
            (
                rng.uniform(0.0, 0.012, outline_count // 2),
                rng.uniform(0.988, 1.0, outline_count // 2),
            )
        )
        outline = page_coordinates(side, outline_u, outline_v)

        thickness_count = 150
        thickness_u = rng.choice(
            np.concatenate((rng.uniform(0.82, 1.0, thickness_count), rng.random(thickness_count))),
            size=thickness_count,
            replace=False,
        )
        thickness_v = np.where(
            rng.random(thickness_count) < 0.62,
            rng.uniform(0.0, 0.018, thickness_count),
            rng.random(thickness_count),
        )
        depth_offset = rng.uniform(-0.038, -0.018, thickness_count)
        thickness = page_coordinates(side, thickness_u, thickness_v, depth_offset)

        contour_count = 350
        contour_u = rng.random(contour_count)
        contour_v = rng.choice(np.array((0.27, 0.50, 0.73)), contour_count)
        contour_v += rng.normal(0.0, 0.004, contour_count)
        contours = page_coordinates(side, contour_u, np.clip(contour_v, 0.0, 1.0))

        page_sets.extend((surface, outer, gutter, outline, thickness, contours))

    book = np.concatenate(page_sets, axis=0)
    if book.shape != (PARTICLE_COUNT, 3):
        raise RuntimeError(f"Open-book sampling produced {book.shape}; expected {(PARTICLE_COUNT, 3)}.")
    book = np.clip(book, 0.02, 0.98).astype(np.float32)
    return book[rng.permutation(PARTICLE_COUNT)]


def render_preview(stages: list[tuple[str, np.ndarray]], path: Path) -> None:
    panel_size = 500
    preview = Image.new("RGB", (panel_size * len(stages), panel_size), "black")
    draw = ImageDraw.Draw(preview)
    palette = ("#8052ff", "#189b81", "#ffb829", "#ffffff")

    for panel, (label, points) in enumerate(stages):
        offset_x = panel * panel_size
        draw.text((offset_x + 18, 16), label, fill="white")
        for index, (x, y, z) in enumerate(points):
            px = offset_x + int(x * panel_size)
            py = int((1 - y) * panel_size)
            radius = 1 + int(z > 0.66)
            color = palette[index % len(palette)]
            draw.point((px, py), fill=color)
            if radius > 1:
                draw.point((px + 1, py), fill=color)

    path.parent.mkdir(parents=True, exist_ok=True)
    preview.save(path, optimize=True)


def temporary_output_path(destination: Path) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        dir=destination.parent,
        prefix=f".{destination.stem}-",
        suffix=destination.suffix,
        delete=False,
    )
    handle.close()
    return Path(handle.name)


def validate_encoded_atlas(decoded: np.ndarray, atlas: np.ndarray, brain: np.ndarray) -> None:
    if decoded.shape != atlas.shape:
        raise RuntimeError(f"Decoded atlas has shape {decoded.shape}; expected {atlas.shape}.")
    if not np.isfinite(decoded).all():
        raise RuntimeError("Decoded atlas contains NaN or infinite coordinates.")

    quadrants = (
        ("robot", decoded[0:TARGET_SIZE, 0:TARGET_SIZE], atlas[0:TARGET_SIZE, 0:TARGET_SIZE]),
        ("mirrored robot", decoded[0:TARGET_SIZE, TARGET_SIZE:ATLAS_SIZE], atlas[0:TARGET_SIZE, TARGET_SIZE:ATLAS_SIZE]),
        ("book", decoded[TARGET_SIZE:ATLAS_SIZE, 0:TARGET_SIZE], atlas[TARGET_SIZE:ATLAS_SIZE, 0:TARGET_SIZE]),
    )
    for label, actual, expected in quadrants:
        if not np.allclose(actual, expected, atol=1e-6, rtol=0):
            raise RuntimeError(f"Decoded {label} quadrant differs from the generated atlas target.")

    if decoded[TARGET_SIZE:, TARGET_SIZE:].tobytes() != brain.tobytes():
        raise RuntimeError("Decoded contact brain differs from the source atlas brain target.")


def validate_preview(path: Path, expected_size: tuple[int, int]) -> None:
    with Image.open(path) as preview:
        preview.verify()
    with Image.open(path) as preview:
        preview.load()
        if preview.format != "PNG":
            raise RuntimeError(f"Preview has format {preview.format}; expected PNG.")
        if preview.mode != "RGB":
            raise RuntimeError(f"Preview has mode {preview.mode}; expected RGB.")
        if preview.size != expected_size:
            raise RuntimeError(f"Preview has size {preview.size}; expected {expected_size}.")


def backup_existing_output(destination: Path) -> Path:
    backup = temporary_output_path(destination)
    try:
        os.replace(destination, backup)
    except BaseException:
        backup.unlink(missing_ok=True)
        raise
    return backup


def publish_outputs(outputs: tuple[tuple[Path, Path], ...]) -> None:
    backups: dict[Path, Path | None] = {}
    published = False
    try:
        for _, destination in outputs:
            if destination.exists():
                backups[destination] = backup_existing_output(destination)
            else:
                backups[destination] = None

        for temporary, destination in outputs:
            os.replace(temporary, destination)
        published = True
    except BaseException:
        for _, destination in reversed(outputs):
            backup = backups.get(destination)
            if backup is not None and backup.exists():
                os.replace(backup, destination)
            elif destination in backups:
                destination.unlink(missing_ok=True)
        raise
    finally:
        if published:
            for backup in backups.values():
                if backup is not None:
                    backup.unlink(missing_ok=True)


def generate_outputs(output_exr: Path, preview_image: Path) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    temporary_exr: Path | None = None
    temporary_preview: Path | None = None
    try:
        temporary_exr = temporary_output_path(output_exr)
        temporary_preview = temporary_output_path(preview_image)

        source = decode_exr(SOURCE_EXR)
        robot_image = np.asarray(Image.open(ROBOT_IMAGE).convert("RGB").crop(ROBOT_CROP))
        mask, luminance = extract_robot_mask(robot_image)
        robot = generate_robot_points(mask, luminance)
        mirrored_robot = mirror_robot_points(robot)
        book = generate_book_points()
        brain = source[0:TARGET_SIZE, 0:TARGET_SIZE].copy()

        atlas = np.empty_like(source)
        atlas[0:TARGET_SIZE, 0:TARGET_SIZE] = robot.reshape(TARGET_SIZE, TARGET_SIZE, 3)
        atlas[0:TARGET_SIZE, TARGET_SIZE:ATLAS_SIZE] = mirrored_robot.reshape(TARGET_SIZE, TARGET_SIZE, 3)
        atlas[TARGET_SIZE:ATLAS_SIZE, 0:TARGET_SIZE] = book.reshape(TARGET_SIZE, TARGET_SIZE, 3)
        atlas[TARGET_SIZE:ATLAS_SIZE, TARGET_SIZE:ATLAS_SIZE] = brain

        stages = [
            ("About: robot", robot),
            ("Project: mirrored robot", mirrored_robot),
            ("Publication: open book", book),
            ("Contact: brain", brain.reshape(PARTICLE_COUNT, 3)),
        ]
        encode_exr(temporary_exr, atlas)
        validate_encoded_atlas(decode_exr(temporary_exr), atlas, brain)
        render_preview(stages, temporary_preview)
        validate_preview(temporary_preview, (500 * len(stages), 500))
        publish_outputs(
            ((temporary_exr, output_exr), (temporary_preview, preview_image))
        )
        return robot, mirrored_robot, book, brain
    finally:
        if temporary_exr is not None:
            temporary_exr.unlink(missing_ok=True)
        if temporary_preview is not None:
            temporary_preview.unlink(missing_ok=True)


def main() -> None:
    robot, mirrored_robot, book, brain = generate_outputs(OUTPUT_EXR, PREVIEW_IMAGE)

    print(f"Generated {OUTPUT_EXR.relative_to(ROOT)} with four 10,000-point targets.")
    for label, points in (("Robot", robot), ("Mirrored robot", mirrored_robot), ("Book", book), ("Brain", brain.reshape(PARTICLE_COUNT, 3))):
        mins = points.min(axis=0)
        maxes = points.max(axis=0)
        print(f"{label}: X {mins[0]:.4f}-{maxes[0]:.4f}, Y {mins[1]:.4f}-{maxes[1]:.4f}, Z {mins[2]:.4f}-{maxes[2]:.4f}")
    print(f"Preview: {PREVIEW_IMAGE.relative_to(ROOT)}")


class OutputPublishingTests(unittest.TestCase):
    def test_second_replace_failure_restores_both_old_outputs(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            temporary_exr = root / ".new.exr"
            temporary_preview = root / ".new.png"
            output_exr = root / "output.exr"
            preview_image = root / "preview.png"
            temporary_exr.write_bytes(b"new exr")
            temporary_preview.write_bytes(b"new png")
            output_exr.write_bytes(b"old exr")
            preview_image.write_bytes(b"old png")

            real_replace = os.replace
            published_new_files = 0

            def fail_second_publish(source: Path, destination: Path) -> None:
                nonlocal published_new_files
                if source in (temporary_exr, temporary_preview):
                    published_new_files += 1
                    if published_new_files == 2:
                        raise OSError("injected second publish failure")
                real_replace(source, destination)

            with mock.patch.object(os, "replace", side_effect=fail_second_publish):
                with self.assertRaisesRegex(OSError, "injected second publish failure"):
                    publish_outputs(
                        ((temporary_exr, output_exr), (temporary_preview, preview_image))
                    )

            self.assertEqual(output_exr.read_bytes(), b"old exr")
            self.assertEqual(preview_image.read_bytes(), b"old png")

    def test_second_temporary_path_failure_removes_first_temporary_file(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output_exr = root / "output.exr"
            preview_image = root / "preview.png"
            created_paths: list[Path] = []
            real_temporary_output_path = temporary_output_path

            def fail_second_temporary_path(destination: Path) -> Path:
                if created_paths:
                    raise OSError("injected second temporary path failure")
                path = real_temporary_output_path(destination)
                created_paths.append(path)
                return path

            with mock.patch(
                f"{__name__}.temporary_output_path",
                side_effect=fail_second_temporary_path,
            ):
                with self.assertRaisesRegex(OSError, "injected second temporary path failure"):
                    generate_outputs(output_exr, preview_image)

            self.assertEqual(len(created_paths), 1)
            self.assertFalse(created_paths[0].exists())


def run_self_tests() -> None:
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(OutputPublishingTests)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    if not result.wasSuccessful():
        raise SystemExit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    arguments = parser.parse_args()
    if arguments.self_test:
        run_self_tests()
    else:
        main()
