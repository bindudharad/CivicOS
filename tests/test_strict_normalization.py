"""
CivicOS V3.1.3 Strict Data Normalization & Geospatial Integrity Verification Suite
Covers the 12 strict normalization requirements:
1. Complete valid incident parsing
2. Missing latitude -> null
3. Missing longitude -> null
4. Invalid coordinates (out-of-bounds, NaN) -> null
5. Missing timestamp -> null (never fabricated)
6. Invalid timestamp string -> null
7. Missing severity -> null (never converted to 0)
8. Severity exactly zero -> preserved as 0
9. Missing population -> null; population 0 -> preserved as 0
10. Missing hotspot metrics -> null & has_valid_location=False
11. Missing work-order metadata -> explicit null
12. Empty API response -> safe handling without crash or fabrication
"""
import subprocess
import sys
from pathlib import Path

def test_all_12_strict_normalization_cases():
    """Execute the Node-based TypeScript test suite for frontend normalizers."""
    frontend_dir = Path(__file__).resolve().parent.parent / "frontend"
    test_file = frontend_dir / "tests" / "strict_normalization.test.ts"
    assert test_file.exists(), f"Test file {test_file} must exist"

    cmd = ["node", "--experimental-strip-types", "--test", "tests/strict_normalization.test.ts"]
    proc = subprocess.run(
        cmd,
        cwd=str(frontend_dir),
        capture_output=True,
        text=True,
    )
    print("STDOUT:", proc.stdout)
    print("STDERR:", proc.stderr)
    assert proc.returncode == 0, f"Frontend normalization tests failed: {proc.stderr}\n{proc.stdout}"
    assert "pass 12" in proc.stdout, "All 12 normalization cases must pass"
