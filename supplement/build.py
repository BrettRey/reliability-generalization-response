"""Assemble the deterministic, self-contained offline supplement (stdlib only)."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parent
source = ROOT / "src"
template = (source / "page.html").read_text()
for marker, filename in [("/* STYLE */", "style.css"), ("/* CORE */", "core.js"), ("/* APP */", "app.js")]:
    assert template.count(marker) == 1, marker
    template = template.replace(marker, (source / filename).read_text())
out = ROOT / "dist"
out.mkdir(exist_ok=True)
(out / "index.html").write_text(template)
manifest = {"version": "1.0.0", "sha256": hashlib.sha256(template.encode()).hexdigest(),
            "sources": {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
                        for p in sorted(source.iterdir()) if p.is_file()}}
(out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(f"Built {out / 'index.html'} ({len(template.encode()):,} bytes); version 1.0.0")
