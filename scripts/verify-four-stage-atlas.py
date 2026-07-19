#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
from pathlib import Path
import sys
from types import ModuleType

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
GENERATOR_PATH = ROOT / "scripts/generate-native-robot-texture.py"
EXPECTED_SHAPE = (10_000, 3)
COORDINATE_MIN = 0.02
COORDINATE_MAX = 0.98


class AtlasValidationError(RuntimeError):
    """Raised when the generated four-stage particle atlas violates its contract."""


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AtlasValidationError(message)


def load_generator() -> ModuleType:
    spec = importlib.util.spec_from_file_location(
        "native_robot_generator",
        GENERATOR_PATH,
    )
    require(spec is not None, f"Could not create an import specification for {GENERATOR_PATH}.")
    require(spec.loader is not None, f"No Python loader is available for {GENERATOR_PATH}.")

    module = importlib.util.module_from_spec(spec)
    module_name = spec.name
    sys.modules[module_name] = module
    try:
        spec.loader.exec_module(module)
    except Exception as error:
        sys.modules.pop(module_name, None)
        raise AtlasValidationError(
            f"Could not import generator {GENERATOR_PATH}: {type(error).__name__}: {error}"
        ) from error

    required_functions = (
        "decode_exr",
        "extract_robot_silhouette",
        "extract_robot_mask",
        "generate_robot_points",
        "generate_book_points",
        "mirror_robot_points",
        "ponytail_braid_region",
        "ponytail_trim_region",
    )
    required_constants = (
        "SOURCE_EXR",
        "OUTPUT_EXR",
        "ROBOT_IMAGE",
        "ROBOT_CROP",
    )
    missing_functions = [
        name for name in required_functions if not callable(getattr(module, name, None))
    ]
    missing_constants = [name for name in required_constants if not hasattr(module, name)]
    missing_details = []
    if missing_functions:
        missing_details.append(f"callable function(s): {', '.join(missing_functions)}")
    if missing_constants:
        missing_details.append(f"constant(s): {', '.join(missing_constants)}")
    require(
        not missing_details,
        f"Generator API is incomplete in {GENERATOR_PATH}. Add "
        + "; add ".join(missing_details)
        + ".",
    )
    return module


def validate_points(name: str, points: np.ndarray) -> None:
    require(
        isinstance(points, np.ndarray),
        f"{name} points must be a NumPy array, got {type(points).__name__}.",
    )
    require(points.shape == EXPECTED_SHAPE, f"{name} points have shape {points.shape}; expected {EXPECTED_SHAPE}.")
    require(points.dtype == np.float32, f"{name} points have dtype {points.dtype}; expected float32.")
    require(np.isfinite(points).all(), f"{name} points contain NaN or infinite coordinates.")

    below = int(np.count_nonzero(points < COORDINATE_MIN))
    above = int(np.count_nonzero(points > COORDINATE_MAX))
    require(
        below == 0 and above == 0,
        f"{name} points must stay in [{COORDINATE_MIN}, {COORDINATE_MAX}]; "
        f"found {below} values below and {above} values above the range.",
    )


def validate_book(book: np.ndarray) -> None:
    spans = np.ptp(book, axis=0)
    for axis, span in zip("XYZ", spans):
        require(span > 1e-4, f"Book {axis} coordinates are degenerate (span={span:.8f}).")

    x = book[:, 0]
    left_page = x <= 0.48
    right_page = x >= 0.52
    require(int(left_page.sum()) >= 4_000, "Book left page has fewer than 4,000 points (X <= 0.48).")
    require(int(right_page.sum()) >= 4_000, "Book right page has fewer than 4,000 points (X >= 0.52).")

    left_gutter = (x >= 0.46) & (x <= 0.49)
    right_gutter = (x >= 0.51) & (x <= 0.54)
    left_edge = x <= 0.30
    right_edge = x >= 0.70
    for label, selection in (
        ("left outer edge", left_edge),
        ("right outer edge", right_edge),
        ("left side of the center gutter", left_gutter),
        ("right side of the center gutter", right_gutter),
    ):
        require(
            int(selection.sum()) >= 300,
            f"Book needs at least 300 edge samples on the {label}; found {int(selection.sum())}.",
        )

    crease = np.abs(x - 0.5) <= 0.04
    require(int(crease.sum()) >= 300, f"Book center gutter/crease is undersampled; found {int(crease.sum())} points.")
    require(
        int(np.count_nonzero(np.abs(x - 0.5) <= 0.018)) == 0,
        "Book center gutter collapsed into a filled strip; expected a narrow crease between two page surfaces.",
    )

    inner = (np.abs(x - 0.5) >= 0.02) & (np.abs(x - 0.5) <= 0.08)
    outer = np.abs(x - 0.5) >= 0.19
    inner_top = float(np.quantile(book[inner, 1], 0.985))
    outer_top = float(np.quantile(book[outer, 1], 0.985))
    inner_bottom = float(np.quantile(book[inner, 1], 0.015))
    outer_bottom = float(np.quantile(book[outer, 1], 0.015))
    require(
        inner_top - outer_top >= 0.035,
        "Book upper page outline is not visibly curved toward the outer corners.",
    )
    require(
        outer_bottom - inner_bottom >= 0.035,
        "Book lower page outline is not visibly curved toward the outer corners.",
    )

    inner_depth = float(np.median(book[inner, 2]))
    outer_depth = float(np.median(book[outer, 2]))
    require(
        outer_depth - inner_depth >= 0.12,
        "Book pages do not rise far enough from the center crease to show a shallow 3D opening.",
    )
    require(float(np.ptp(book[:, 2])) >= 0.20, "Book page thickness/depth span is too shallow.")
    require(float(spans[0]) <= 0.52, f"Book width is too large for the lower-left target zone (span={spans[0]:.4f}).")
    require(float(spans[1]) <= 0.38, f"Book height is too large for the lower-left target zone (span={spans[1]:.4f}).")

    for label, selection in (("left", left_page), ("right", right_page)):
        page_spans = np.ptp(book[selection], axis=0)
        require(
            np.all(page_spans > 1e-4),
            f"Book {label} page is degenerate; per-axis spans are {page_spans.tolist()}.",
        )


def validate_short_ponytail(module: ModuleType, image: np.ndarray, mask: np.ndarray) -> None:
    original, _ = module.extract_robot_silhouette(image)
    trim_region = module.ponytail_trim_region(original.shape)
    removed = original & trim_region
    require(
        int(removed.sum()) >= 20_000,
        f"Ponytail refinement removed only {int(removed.sum())} pixels; the long tail was not clearly truncated.",
    )
    braid = module.ponytail_braid_region(original.shape)
    require(
        int(np.count_nonzero(mask & trim_region & ~braid)) == 0,
        "Refined robot mask still contains non-braid samples inside the long-ponytail trim region.",
    )

    normalized_rows = np.linspace(0.0, 1.0, mask.shape[0], dtype=np.float32)[:, None]
    normalized_columns = np.linspace(0.0, 1.0, mask.shape[1], dtype=np.float32)[None, :]
    separation = (
        (normalized_rows >= 0.18)
        & (normalized_rows <= 0.46)
        & (normalized_columns >= 0.66)
        & (normalized_columns <= 0.72)
    )
    require(
        int(np.count_nonzero(mask & separation)) == 0,
        "Braid is still connected to the rear head mass; the separation channel is not empty.",
    )

    upper_braid = mask & braid & (normalized_rows >= 0.18) & (normalized_rows <= 0.30)
    lower_braid = mask & braid & (normalized_rows >= 0.51) & (normalized_rows <= 0.59)
    require(int(upper_braid.sum()) >= 2_000, "Upper braid does not retain enough samples to remain visible.")
    require(int(lower_braid.sum()) >= 250, "Tapered braid tip does not retain enough samples to remain visible.")
    upper_columns = np.nonzero(upper_braid)[1]
    lower_columns = np.nonzero(lower_braid)[1]
    upper_width = int(upper_columns.max() - upper_columns.min() + 1)
    lower_width = int(lower_columns.max() - lower_columns.min() + 1)
    require(
        lower_width < upper_width * 0.5,
        f"Braid tip is not sufficiently tapered (upper width={upper_width}, lower width={lower_width}).",
    )

    height, width = mask.shape
    face_visor = mask[int(height * 0.16):int(height * 0.56), :int(width * 0.58)]
    neck = mask[int(height * 0.50):int(height * 0.78), int(width * 0.28):int(width * 0.66)]
    shoulders = mask[int(height * 0.72):, int(width * 0.18):int(width * 0.78)]
    for label, region, minimum in (
        ("face and visor", face_visor, 45_000),
        ("neck", neck, 25_000),
        ("shoulders", shoulders, 35_000),
    ):
        require(
            int(region.sum()) >= minimum,
            f"Ponytail refinement damaged the {label} silhouette; found {int(region.sum())} retained pixels.",
        )


def validate_output(module: ModuleType, source: np.ndarray, robot: np.ndarray, right: np.ndarray, book: np.ndarray) -> None:
    output_path = Path(module.OUTPUT_EXR)
    require(
        output_path.exists(),
        f"Output atlas is missing at {output_path}. Run {GENERATOR_PATH} to generate it before validation.",
    )

    output = module.decode_exr(output_path)
    require(output.shape == (200, 200, 3), f"Output atlas has shape {output.shape}; expected (200, 200, 3).")
    require(np.isfinite(output).all(), "Output atlas contains NaN or infinite coordinates.")

    expected_quadrants = (
        ("top-left robot", output[0:100, 0:100], robot.reshape(100, 100, 3)),
        ("top-right mirrored robot", output[0:100, 100:200], right.reshape(100, 100, 3)),
        ("bottom-left book", output[100:200, 0:100], book.reshape(100, 100, 3)),
    )
    for label, actual, expected in expected_quadrants:
        try:
            np.testing.assert_allclose(actual, expected, atol=1e-6, rtol=0)
        except AssertionError as error:
            raise AtlasValidationError(f"Output {label} quadrant does not match its generated point array: {error}") from error

    require(source.shape[0] >= 100 and source.shape[1] >= 100 and source.shape[2] == 3, f"Source atlas shape {source.shape} cannot provide a 100x100 RGB brain target.")
    require(
        output[100:200, 100:200].tobytes() == source[0:100, 0:100].tobytes(),
        "Output bottom-right contact brain differs from the source atlas top-left brain target.",
    )


def main() -> None:
    module = load_generator()

    source = module.decode_exr(module.SOURCE_EXR)
    robot_image = np.asarray(
        Image.open(module.ROBOT_IMAGE).convert("RGB").crop(module.ROBOT_CROP)
    )
    mask, luminance = module.extract_robot_mask(robot_image)
    robot = module.generate_robot_points(mask, luminance)
    repeated_robot = module.generate_robot_points(mask, luminance)
    book = module.generate_book_points()
    repeated_book = module.generate_book_points()
    right_robot = module.mirror_robot_points(robot)

    validate_points("Robot", robot)
    validate_points("Right robot", right_robot)
    validate_points("Book", book)
    require(np.array_equal(robot, repeated_robot), "Robot sampling is not deterministic for its fixed seed.")
    require(np.array_equal(book, repeated_book), "Book sampling is not deterministic for its fixed seed.")

    try:
        np.testing.assert_allclose(right_robot[:, 0], 1.0 - robot[:, 0], atol=1e-6, rtol=0)
        np.testing.assert_allclose(right_robot[:, 1:], robot[:, 1:], atol=1e-6, rtol=0)
    except AssertionError as error:
        raise AtlasValidationError(
            "Right robot is not an order-preserving X=1-X mirror with unchanged Y/Z coordinates: "
            f"{error}"
        ) from error

    validate_short_ponytail(module, robot_image, mask)
    validate_book(book)
    validate_output(module, source, robot, right_robot, book)
    print("PASS: four-stage particle atlas and generator outputs satisfy all checks.")


if __name__ == "__main__":
    try:
        main()
    except AtlasValidationError as error:
        raise SystemExit(f"FAIL: {error}") from error
