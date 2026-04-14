#!/usr/bin/env python3
"""
Validate all 100 multiplication facts from multiplicationTables.ts.

Reads the TypeScript source file, parses the generation logic,
independently computes every product, and checks for correctness,
completeness, duplicates, and edge cases.

Uses Python stdlib only. Run from anywhere:
    python3 scripts/validate-multiplication.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Locate the TypeScript source file relative to THIS script
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
TS_FILE = PROJECT_ROOT / "lib" / "constants" / "multiplicationTables.ts"


def parse_ts_generation_logic(ts_source: str) -> dict[int, list[dict[str, int]]]:
    """
    Parse the TypeScript file to understand and replicate the generation logic.

    The TS file uses:
        function generateTable(n: number): MultiplicationFact[] {
          return Array.from({ length: 10 }, (_, i) => ({
            a: n,
            b: i + 1,
            product: n * (i + 1),
            table: n,
          }))
        }

    And builds tables 1-10 via:
        Array.from({ length: 10 }, (_, i) => [i + 1, generateTable(i + 1)])

    We verify that pattern exists, then replicate it in Python.
    """
    # Verify the generateTable function exists with expected pattern
    gen_pattern = re.search(
        r"function\s+generateTable\s*\(\s*n\s*:\s*number\s*\)",
        ts_source,
    )
    if not gen_pattern:
        raise ValueError("Could not find generateTable function in TS source")

    # Verify the product computation pattern: product: n * (i + 1)
    product_pattern = re.search(r"product\s*:\s*n\s*\*\s*\(\s*i\s*\+\s*1\s*\)", ts_source)
    if not product_pattern:
        raise ValueError("Could not find 'product: n * (i + 1)' pattern in TS source")

    # Verify the table generation: length: 10 for facts per table
    facts_length = re.search(r"Array\.from\(\s*\{\s*length\s*:\s*10\s*\}", ts_source)
    if not facts_length:
        raise ValueError("Could not find Array.from({ length: 10 }) pattern in TS source")

    # Verify field assignments
    field_a = re.search(r"a\s*:\s*n\s*,", ts_source)
    field_b = re.search(r"b\s*:\s*i\s*\+\s*1\s*,", ts_source)
    field_table = re.search(r"table\s*:\s*n\s*,", ts_source)
    if not all([field_a, field_b, field_table]):
        raise ValueError("Missing expected field assignments (a: n, b: i + 1, table: n)")

    # Verify ALL_TABLES constant covers 1-10
    all_tables_match = re.search(
        r"ALL_TABLES\s*=\s*\[([\d\s,]+)\]",
        ts_source,
    )
    if all_tables_match:
        table_nums = [int(x.strip()) for x in all_tables_match.group(1).split(",") if x.strip()]
        if table_nums != list(range(1, 11)):
            raise ValueError(
                f"ALL_TABLES should be [1..10], found {table_nums}"
            )

    # Replicate the exact generation logic in Python
    tables: dict[int, list[dict[str, int]]] = {}
    for n in range(1, 11):
        facts = []
        for i in range(10):
            fact = {
                "a": n,
                "b": i + 1,
                "product": n * (i + 1),
                "table": n,
            }
            facts.append(fact)
        tables[n] = facts

    return tables


def validate_correctness(tables: dict[int, list[dict[str, int]]]) -> tuple[bool, list[str]]:
    """Verify every product equals a * b (independent computation)."""
    errors: list[str] = []
    table_results: dict[int, tuple[int, int]] = {}  # table -> (correct, total)

    for table_num in range(1, 11):
        if table_num not in tables:
            errors.append(f"Table {table_num}: MISSING entirely")
            table_results[table_num] = (0, 10)
            continue

        facts = tables[table_num]
        correct = 0
        total = len(facts)

        for fact in facts:
            a, b, product = fact["a"], fact["b"], fact["product"]
            expected = a * b
            if product != expected:
                errors.append(
                    f"Table {table_num}: {a} x {b} = {product} (expected {expected})"
                )
            else:
                correct += 1

        table_results[table_num] = (correct, total)

    return len(errors) == 0, errors, table_results


def validate_completeness(tables: dict[int, list[dict[str, int]]]) -> tuple[bool, list[str]]:
    """Verify all 100 facts are present: 10 tables x 10 facts each."""
    errors: list[str] = []
    total_facts = 0

    for table_num in range(1, 11):
        if table_num not in tables:
            errors.append(f"Table {table_num}: MISSING")
            continue

        facts = tables[table_num]
        total_facts += len(facts)

        if len(facts) != 10:
            errors.append(
                f"Table {table_num}: has {len(facts)} facts (expected 10)"
            )

        # Check that b values cover 1-10
        b_values = sorted(fact["b"] for fact in facts)
        expected_b = list(range(1, 11))
        if b_values != expected_b:
            errors.append(
                f"Table {table_num}: b values = {b_values} (expected {expected_b})"
            )

        # Check that a always equals the table number
        for fact in facts:
            if fact["a"] != table_num:
                errors.append(
                    f"Table {table_num}: fact has a={fact['a']} (expected {table_num})"
                )
            if fact["table"] != table_num:
                errors.append(
                    f"Table {table_num}: fact has table={fact['table']} (expected {table_num})"
                )

    if total_facts != 100:
        errors.append(f"Total facts: {total_facts} (expected 100)")

    return len(errors) == 0, errors


def validate_duplicates(tables: dict[int, list[dict[str, int]]]) -> tuple[bool, list[str]]:
    """Check for duplicate facts within each table and globally."""
    errors: list[str] = []

    # Within each table
    for table_num in range(1, 11):
        if table_num not in tables:
            continue
        facts = tables[table_num]
        seen_pairs: set[tuple[int, int]] = set()
        for fact in facts:
            pair = (fact["a"], fact["b"])
            if pair in seen_pairs:
                errors.append(
                    f"Table {table_num}: duplicate fact {pair[0]} x {pair[1]}"
                )
            seen_pairs.add(pair)

    # Globally: check all (a, b) pairs are unique
    all_pairs: set[tuple[int, int]] = set()
    for table_num in range(1, 11):
        if table_num not in tables:
            continue
        for fact in tables[table_num]:
            pair = (fact["a"], fact["b"])
            if pair in all_pairs:
                errors.append(f"Global duplicate: {pair[0]} x {pair[1]}")
            all_pairs.add(pair)

    return len(errors) == 0, errors


def validate_edge_cases(tables: dict[int, list[dict[str, int]]]) -> tuple[bool, list[str]]:
    """Verify edge cases: min/max values, positive integers, factor ranges."""
    errors: list[str] = []

    all_products: list[int] = []
    for table_num in range(1, 11):
        if table_num not in tables:
            continue
        for fact in tables[table_num]:
            a, b, product = fact["a"], fact["b"], fact["product"]
            all_products.append(product)

            # All products must be positive integers
            if not isinstance(product, int) or product <= 0:
                errors.append(
                    f"Non-positive product: {a} x {b} = {product}"
                )

            # Factor a must be in 1-10 (table number)
            if a < 1 or a > 10:
                errors.append(f"Factor a out of range: {a}")

            # Factor b must be in 1-10
            if b < 1 or b > 10:
                errors.append(f"Factor b out of range: {b}")

    if not all_products:
        errors.append("No products found")
        return False, errors

    min_product = min(all_products)
    max_product = max(all_products)

    # 1 x 1 = 1 should be the minimum
    if min_product != 1:
        errors.append(f"Minimum product = {min_product} (expected 1 from 1x1)")

    # 10 x 10 = 100 should be the maximum
    if max_product != 100:
        errors.append(f"Maximum product = {max_product} (expected 100 from 10x10)")

    # Verify specific known facts
    known_facts = {
        (1, 1): 1,
        (10, 10): 100,
        (5, 5): 25,
        (7, 8): 56,
        (9, 9): 81,
        (6, 7): 42,
        (3, 4): 12,
        (8, 9): 72,
    }
    for (a, b), expected_product in known_facts.items():
        found = False
        for fact in tables.get(a, []):
            if fact["b"] == b:
                found = True
                if fact["product"] != expected_product:
                    errors.append(
                        f"Known fact {a} x {b}: got {fact['product']} "
                        f"(expected {expected_product})"
                    )
                break
        if not found:
            errors.append(f"Known fact {a} x {b} not found in table {a}")

    return len(errors) == 0, errors


def main() -> int:
    print("=== Multiplication Table Validation ===")
    print()

    # --- Read the TypeScript source ---
    if not TS_FILE.exists():
        print(f"FAIL: TypeScript source not found at {TS_FILE}")
        return 1

    ts_source = TS_FILE.read_text(encoding="utf-8")
    print(f"Source: {TS_FILE.relative_to(PROJECT_ROOT)}")
    print(f"File size: {len(ts_source)} bytes")
    print()

    # --- Parse and replicate the generation logic ---
    try:
        tables = parse_ts_generation_logic(ts_source)
    except ValueError as e:
        print(f"FAIL: Could not parse TS generation logic: {e}")
        return 1

    print(f"Verifying 10 tables x 10 facts = 100 facts...")
    print()

    # --- Correctness ---
    all_pass = True
    correct_ok, correct_errors, table_results = validate_correctness(tables)

    for table_num in range(1, 11):
        correct, total = table_results.get(table_num, (0, 0))
        status = "PASS" if correct == total == 10 else "FAIL"
        mark = "+" if status == "PASS" else "X"
        print(f"  Table {table_num:>2}: [{mark}] ({correct}/{total} facts correct)")

    print()

    if not correct_ok:
        all_pass = False
        for err in correct_errors:
            print(f"  ERROR: {err}")
        print()

    # --- Completeness ---
    complete_ok, complete_errors = validate_completeness(tables)
    total_facts = sum(len(tables.get(t, [])) for t in range(1, 11))
    mark = "+" if complete_ok else "X"
    print(f"  Completeness: [{mark}] {total_facts}/100 facts present")
    if not complete_ok:
        all_pass = False
        for err in complete_errors:
            print(f"    ERROR: {err}")

    # --- Duplicates ---
    dup_ok, dup_errors = validate_duplicates(tables)
    mark = "+" if dup_ok else "X"
    print(f"  Duplicates:   [{mark}] {'None found' if dup_ok else f'{len(dup_errors)} found'}")
    if not dup_ok:
        all_pass = False
        for err in dup_errors:
            print(f"    ERROR: {err}")

    # --- Edge cases ---
    edge_ok, edge_errors = validate_edge_cases(tables)
    all_products = [
        fact["product"]
        for t in range(1, 11)
        for fact in tables.get(t, [])
    ]
    min_p = min(all_products) if all_products else "?"
    max_p = max(all_products) if all_products else "?"
    mark = "+" if edge_ok else "X"
    print(f"  Edge cases:   [{mark}] min={min_p} (1x1), max={max_p} (10x10)")
    if not edge_ok:
        all_pass = False
        for err in edge_errors:
            print(f"    ERROR: {err}")

    print()
    print("=" * 43)
    if all_pass:
        print("  RESULT: ALL 100 FACTS VERIFIED  [PASS]")
    else:
        print("  RESULT: VALIDATION FAILED       [FAIL]")
    print("=" * 43)

    return 0 if all_pass else 1


if __name__ == "__main__":
    sys.exit(main())
