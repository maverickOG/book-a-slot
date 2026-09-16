import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

HASHICORP_SECRET_PATTERNS = (
    re.compile(r"\bhcp_[A-Za-z0-9]{20,}\b"),
    re.compile(r"\bhvs\.[A-Za-z0-9]{20,}\b"),
    re.compile(r"\batlasv1\.[A-Za-z0-9._-]{20,}\b"),
    re.compile(
        r"\bTF_TOKEN_[A-Za-z0-9_]+\s*[:=]\s*[\"']?[A-Za-z0-9._-]{20,}",
        re.IGNORECASE,
    ),
)


def test_repository_has_no_hashicorp_secret_patterns() -> None:
    files = subprocess.run(
        ["git", "ls-files"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    ).stdout.splitlines()

    matches: list[str] = []
    for relative_path in files:
        file_path = ROOT / relative_path
        text = file_path.read_text(encoding="utf-8", errors="ignore")
        for pattern in HASHICORP_SECRET_PATTERNS:
            if pattern.search(text):
                matches.append(f"{relative_path}: {pattern.pattern}")

    assert not matches, f"Potential HashiCorp/Terraform secrets found: {matches}"
