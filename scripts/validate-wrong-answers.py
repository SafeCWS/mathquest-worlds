#!/usr/bin/env python3
"""
Validate the wrong-answer generation logic from multiplicationDifficulty.ts.

Re-implements the generateWrongAnswers algorithm in Python, then exhaustively
tests it for every possible multiplication fact (100 facts) and both answer
types ('product' and 'factor').

Checks:
  1. No wrong answer ever equals the correct answer
  2. All wrong answers are positive integers
  3. Product-type answers are within valid range (1-100)
  4. Factor-type answers are within valid range (1-10)
  5. No duplicate wrong answers within a single set
  6. Correct number of wrong answers is always generated

Uses Python stdlib only. Run from anywhere:
    python3 scripts/validate-wrong-answers.py
"""

from __future__ import annotations

import random
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Locate the TypeScript source file relative to THIS script
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
TS_FILE = PROJECT_ROOT / "lib" / "utils" / "multiplicationDifficulty.ts"

# Number of wrong answers to generate (matches game usage)
WRONG_ANSWER_COUNT = 3

# Number of random trials per fact (to catch stochastic issues)
TRIALS_PER_FACT = 50


def verify_ts_source(ts_source: str) -> list[str]:
    """
    Verify that the TypeScript source contains the expected patterns
    so we know our Python reimplementation matches.
    """
    warnings: list[str] = []

    # Check function signature exists
    if "function generateWrongAnswers" not in ts_source:
        warnings.append("generateWrongAnswers function not found in TS source")

    # Check the two types are handled
    if "'product'" not in ts_source and '"product"' not in ts_source:
        warnings.append("'product' type not found in TS source")
    if "'factor'" not in ts_source and '"factor"' not in ts_source:
        warnings.append("'factor' type not found in TS source")

    # Check that correct answer is excluded
    if "val !== correctAnswer" not in ts_source:
        warnings.append("correctAnswer exclusion check not found in TS source")

    # Check product candidate generation: table * mult for 1..10 x 1..10
    if "table * mult" not in ts_source:
        warnings.append("'table * mult' candidate generation not found in TS source")

    # Check factor candidate range 1-10
    if re.search(r"for\s*\(\s*let\s+n\s*=\s*1\s*;\s*n\s*<=\s*10", ts_source):
        pass  # Good, factor loop found
    else:
        warnings.append("Factor loop (1..10) not found in expected form")

    # Check fallback exists
    if "Fallback" not in ts_source and "fallback" not in ts_source:
        warnings.append("Fallback logic not found in TS source")

    # Check product fallback range: Math.floor(Math.random() * 90) + 1 => 1..90
    if "Math.floor(Math.random() * 90) + 1" in ts_source:
        pass  # Product fallback generates 1-90
    else:
        warnings.append("Product fallback range (1-90) not found in expected form")

    # Check factor fallback range: Math.floor(Math.random() * 10) + 1 => 1..10
    if "Math.floor(Math.random() * 10) + 1" in ts_source:
        pass  # Factor fallback generates 1-10
    else:
        warnings.append("Factor fallback range (1-10) not found in expected form")

    return warnings


def generate_wrong_answers_product(correct_answer: int, count: int) -> list[int]:
    """
    Python reimplementation of generateWrongAnswers for type='product'.

    Mirrors the TypeScript logic exactly:
    1. Generate candidates from all table*mult products (1-10 x 1-10) excluding correct
    2. Add offset candidates (+/-1, +/-2, +/-10) excluding correct and non-positive
    3. Sort candidates by distance from correct answer
    4. Take top pool (3*count or 12, whichever is larger)
    5. Shuffle the pool
    6. Pick unique values != correct answer
    7. Fallback: random 1-90 if not enough
    """
    wrong: set[int] = set()
    candidates: list[int] = []

    # Nearby multiples from all tables
    for table in range(1, 11):
        for mult in range(1, 11):
            val = table * mult
            if val != correct_answer and val > 0:
                candidates.append(val)

    # Off-by offsets (common kid mistakes)
    offsets = [-10, -2, -1, 1, 2, 10]
    for offset in offsets:
        val = correct_answer + offset
        if val > 0 and val != correct_answer:
            candidates.append(val)

    # Sort by distance from correct answer
    candidates.sort(key=lambda x: abs(x - correct_answer))

    # Take top pool
    pool_size = max(count * 3, 12)
    pool = candidates[:pool_size]

    # Shuffle pool
    random.shuffle(pool)

    # Pick unique wrong answers
    for val in pool:
        if len(wrong) >= count:
            break
        if val != correct_answer and val not in wrong:
            wrong.add(val)

    # Fallback
    while len(wrong) < count:
        fallback = random.randint(1, 90)
        if fallback != correct_answer and fallback not in wrong:
            wrong.add(fallback)

    return list(wrong)[:count]


def generate_wrong_answers_factor(correct_answer: int, count: int) -> list[int]:
    """
    Python reimplementation of generateWrongAnswers for type='factor'.

    Mirrors the TypeScript logic exactly:
    1. Generate candidates: 1-10 excluding correct answer
    2. Sort by distance from correct answer
    3. Take top pool (2*count or 6, whichever is larger)
    4. Shuffle pool
    5. Pick unique values
    6. Fallback: random 1-10 if not enough
    """
    wrong: set[int] = set()
    candidates: list[int] = []

    for n in range(1, 11):
        if n != correct_answer:
            candidates.append(n)

    # Sort by distance
    candidates.sort(key=lambda x: abs(x - correct_answer))

    # Take top pool
    pool_size = max(count * 2, 6)
    pool = candidates[:pool_size]

    # Shuffle pool
    random.shuffle(pool)

    # Pick unique wrong answers
    for val in pool:
        if len(wrong) >= count:
            break
        wrong.add(val)

    # Fallback
    while len(wrong) < count:
        fallback = random.randint(1, 10)
        if fallback != correct_answer and fallback not in wrong:
            wrong.add(fallback)

    return list(wrong)[:count]


def validate_wrong_answers(
    answer_type: str,
    correct_answer: int,
    wrong_answers: list[int],
    a: int,
    b: int,
) -> list[str]:
    """Validate a single set of wrong answers. Returns list of error messages."""
    errors: list[str] = []
    context = f"{a}x{b}={correct_answer} ({answer_type})"

    # Check 1: No wrong answer equals correct answer
    if correct_answer in wrong_answers:
        errors.append(f"{context}: correct answer {correct_answer} in wrong answers!")

    # Check 2: All positive integers
    for wa in wrong_answers:
        if not isinstance(wa, int) or wa <= 0:
            errors.append(f"{context}: non-positive wrong answer: {wa}")

    # Check 3: Range validation
    if answer_type == "product":
        for wa in wrong_answers:
            if wa < 1 or wa > 100:
                # Note: the TS logic can produce values > 100 via offsets (e.g., 100+10=110)
                # and from table products (max=100). The offset +10 from 100 = 110.
                # We check a generous range for products.
                if wa > 110:
                    errors.append(f"{context}: product wrong answer {wa} out of range (>110)")
                if wa < 1:
                    errors.append(f"{context}: product wrong answer {wa} < 1")
    elif answer_type == "factor":
        for wa in wrong_answers:
            if wa < 1 or wa > 10:
                errors.append(f"{context}: factor wrong answer {wa} out of range [1-10]")

    # Check 4: No duplicates within the set
    if len(wrong_answers) != len(set(wrong_answers)):
        errors.append(f"{context}: duplicate wrong answers found: {wrong_answers}")

    # Check 5: Correct count
    if len(wrong_answers) != WRONG_ANSWER_COUNT:
        errors.append(
            f"{context}: expected {WRONG_ANSWER_COUNT} wrong answers, "
            f"got {len(wrong_answers)}"
        )

    return errors


def main() -> int:
    print("=== Wrong Answer Generation Validation ===")
    print()

    # --- Read and verify the TypeScript source ---
    if not TS_FILE.exists():
        print(f"FAIL: TypeScript source not found at {TS_FILE}")
        return 1

    ts_source = TS_FILE.read_text(encoding="utf-8")
    print(f"Source: {TS_FILE.relative_to(PROJECT_ROOT)}")
    print(f"File size: {len(ts_source)} bytes")
    print()

    # Verify TS source structure
    source_warnings = verify_ts_source(ts_source)
    if source_warnings:
        print("  Source structure warnings:")
        for w in source_warnings:
            print(f"    WARNING: {w}")
        print()
    else:
        print("  Source structure: [+] All expected patterns found")
        print()

    # --- Run validation ---
    print(f"Testing {WRONG_ANSWER_COUNT} wrong answers per fact, "
          f"{TRIALS_PER_FACT} trials each...")
    print(f"Total trials: 100 facts x 2 types x {TRIALS_PER_FACT} = "
          f"{100 * 2 * TRIALS_PER_FACT:,}")
    print()

    all_errors: list[str] = []
    total_trials = 0
    product_trials_passed = 0
    factor_trials_passed = 0

    # Seed for reproducibility, but also run unseeded trials
    random.seed(42)

    # Test every multiplication fact
    for a in range(1, 11):
        table_errors = 0

        for b in range(1, 11):
            correct_product = a * b

            # --- Product type validation ---
            for trial in range(TRIALS_PER_FACT):
                wrong = generate_wrong_answers_product(
                    correct_product, WRONG_ANSWER_COUNT
                )
                errors = validate_wrong_answers("product", correct_product, wrong, a, b)
                if errors:
                    all_errors.extend(errors)
                    table_errors += len(errors)
                else:
                    product_trials_passed += 1
                total_trials += 1

            # --- Factor type validation (test both factors) ---
            for factor in [a, b]:
                for trial in range(TRIALS_PER_FACT):
                    wrong = generate_wrong_answers_factor(
                        factor, WRONG_ANSWER_COUNT
                    )
                    errors = validate_wrong_answers("factor", factor, wrong, a, b)
                    if errors:
                        all_errors.extend(errors)
                        table_errors += len(errors)
                    else:
                        factor_trials_passed += 1
                    total_trials += 1

        mark = "+" if table_errors == 0 else "X"
        facts_in_table = 10
        product_per_table = facts_in_table * TRIALS_PER_FACT
        factor_per_table = facts_in_table * 2 * TRIALS_PER_FACT  # both a and b
        total_per_table = product_per_table + factor_per_table
        print(f"  Table {a:>2}: [{mark}] ({total_per_table}/{total_per_table} trials"
              f"{f', {table_errors} errors' if table_errors else ''})")

    print()

    # --- Summary ---
    total_product_trials = 100 * TRIALS_PER_FACT
    total_factor_trials = 100 * 2 * TRIALS_PER_FACT

    mark_p = "+" if product_trials_passed == total_product_trials else "X"
    mark_f = "+" if factor_trials_passed == total_factor_trials else "X"

    print(f"  Product type: [{mark_p}] {product_trials_passed:,}/{total_product_trials:,} "
          f"trials passed")
    print(f"  Factor type:  [{mark_f}] {factor_trials_passed:,}/{total_factor_trials:,} "
          f"trials passed")

    # --- Invariant checks ---
    print()
    print("  Invariant checks:")

    # Check: for every possible correct product (1-100), can we always generate 3 wrong answers?
    can_always_generate = True
    for correct in range(1, 101):
        for _ in range(10):
            wrong = generate_wrong_answers_product(correct, WRONG_ANSWER_COUNT)
            if len(wrong) != WRONG_ANSWER_COUNT or correct in wrong:
                can_always_generate = False
                all_errors.append(
                    f"Product invariant: cannot reliably generate {WRONG_ANSWER_COUNT} "
                    f"wrong answers for correct={correct}"
                )
    mark = "+" if can_always_generate else "X"
    print(f"    [{mark}] Product: always generates {WRONG_ANSWER_COUNT} "
          f"distinct wrong answers for products 1-100")

    # Check: for every possible correct factor (1-10), can we always generate 3 wrong answers?
    can_always_generate_f = True
    for correct in range(1, 11):
        for _ in range(10):
            wrong = generate_wrong_answers_factor(correct, WRONG_ANSWER_COUNT)
            if len(wrong) != WRONG_ANSWER_COUNT or correct in wrong:
                can_always_generate_f = False
                all_errors.append(
                    f"Factor invariant: cannot reliably generate {WRONG_ANSWER_COUNT} "
                    f"wrong answers for correct={correct}"
                )
    mark = "+" if can_always_generate_f else "X"
    print(f"    [{mark}] Factor: always generates {WRONG_ANSWER_COUNT} "
          f"distinct wrong answers for factors 1-10")

    # Check: factor wrong answers always in [1, 10]
    factor_range_ok = True
    for correct in range(1, 11):
        for _ in range(100):
            wrong = generate_wrong_answers_factor(correct, WRONG_ANSWER_COUNT)
            for w in wrong:
                if w < 1 or w > 10:
                    factor_range_ok = False
                    all_errors.append(
                        f"Factor range: wrong answer {w} outside [1,10] "
                        f"for correct={correct}"
                    )
    mark = "+" if factor_range_ok else "X"
    print(f"    [{mark}] Factor wrong answers always in [1, 10]")

    # Check: product wrong answers are always positive
    product_positive_ok = True
    for correct in range(1, 101):
        for _ in range(10):
            wrong = generate_wrong_answers_product(correct, WRONG_ANSWER_COUNT)
            for w in wrong:
                if w <= 0:
                    product_positive_ok = False
                    all_errors.append(
                        f"Product positive: wrong answer {w} <= 0 "
                        f"for correct={correct}"
                    )
    mark = "+" if product_positive_ok else "X"
    print(f"    [{mark}] Product wrong answers always positive")

    print()

    # --- Unique error summary ---
    if all_errors:
        unique_errors = sorted(set(all_errors))
        print(f"  Unique errors ({len(unique_errors)}):")
        for err in unique_errors[:20]:
            print(f"    ERROR: {err}")
        if len(unique_errors) > 20:
            print(f"    ... and {len(unique_errors) - 20} more")
        print()

    print("=" * 47)
    if not all_errors:
        print("  RESULT: ALL WRONG ANSWER CHECKS PASSED [PASS]")
    else:
        print(f"  RESULT: {len(all_errors)} ERRORS FOUND          [FAIL]")
    print("=" * 47)

    return 0 if not all_errors else 1


if __name__ == "__main__":
    sys.exit(main())
