#!/usr/bin/env python3
"""Offline checks, including archive shape and Debian metadata. No install commands."""
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parent.parent


class PackageTests(unittest.TestCase):
    def test_no_backend_execution_surface(self):
        self.assertFalse((ROOT / "functions").exists())
        self.assertFalse(any(p.is_file() for p in (ROOT / "bin").glob("*")))
        self.assertEqual(json.loads((ROOT / "settings.json").read_text()),
                         {"url": "", "label": "Selkies stream", "autoConnect": True})

    def test_package_and_zip_contract(self):
        with tempfile.TemporaryDirectory() as temporary:
            out = Path(temporary) / "artifacts"
            command = ["python3", str(ROOT / "scripts/package-local.py"), "--output", str(out)]
            subprocess.run(command, check=True)
            pairs = list(out.glob("*-manifest.json"))
            self.assertEqual(len(pairs), 1)
            pair = json.loads(pairs[0].read_text())
            name, version = pair["name"], pair["version"]
            for item in pair["artifacts"].values():
                self.assertEqual(hashlib.sha256((out / item["filename"]).read_bytes()).hexdigest(), item["sha256"])
            deb = out / pair["artifacts"]["deb"]["filename"]
            fields = subprocess.check_output(["dpkg-deb", "--field", str(deb), "Package", "Version", "Architecture"], text=True)
            self.assertIn(f"Package: mos-{name}-plugin", fields)
            self.assertIn(f"Version: {version}-1+mos-plugin", fields)
            self.assertIn("Architecture: all", fields)
            control = Path(temporary) / "control"
            subprocess.run(["dpkg-deb", "--control", str(deb), str(control)], check=True)
            self.assertEqual([p.name for p in control.iterdir()], ["control"])
            data = Path(temporary) / "data"
            subprocess.run(["dpkg-deb", "--extract", str(deb), str(data)], check=True)
            self.assertTrue((data / f"var/www/mos-plugins/{name}/remoteEntry.js").is_file())
            for p in data.rglob("*"):
                self.assertFalse(p.is_symlink())
                if p.is_file():
                    relative = p.relative_to(data).as_posix()
                    self.assertTrue(relative.startswith((f"var/www/mos-plugins/{name}/", f"usr/share/doc/mos-{name}-plugin/", f"usr/bin/plugins/{name}")), relative)
            with zipfile.ZipFile(out / pair["artifacts"]["install"]["filename"]) as z:
                members = z.namelist()
                self.assertIn(f"{name}/template.json", members)
                self.assertIn(f"{name}/{version}/plugin.config.js", members)
                self.assertIn(f"{name}/{version}/{deb.name}.sha256", members)
                self.assertIn("manifest.json", members)
                self.assertNotIn(f"{name}/manifest.json", members)
                manifest = json.loads(z.read("manifest.json"))
                for path, sha in manifest["files"].items():
                    self.assertEqual(hashlib.sha256(z.read(path)).hexdigest(), sha)
            with zipfile.ZipFile(out / pair["artifacts"]["source"]["filename"]) as z:
                for filename in ("AGENTS.md", "page/src/Plugin.vue", "page/package-lock.json", "scripts/build-local.sh", ".github/workflows/build-plugin.yml", "docs/API-REFERENCE.md"):
                    self.assertIn(f"mos-stream/{filename}", z.namelist())
                self.assertFalse(any("/node_modules/" in p or "/dist/" in p or p.endswith(".deb") for p in z.namelist()))
                manifest = json.loads(z.read("mos-stream/source-manifest.json"))
                self.assertNotIn("source-manifest.json", manifest["files"])
                for path, sha in manifest["files"].items():
                    self.assertEqual(hashlib.sha256(z.read(f"mos-stream/{path}")).hexdigest(), sha)
            duplicate = subprocess.run(command, capture_output=True, text=True)
            self.assertNotEqual(duplicate.returncode, 0)
            self.assertIn("already exists", duplicate.stderr)
            second = Path(temporary) / "second"
            subprocess.run([*command[:-1], str(second)], check=True)
            for path in out.iterdir():
                self.assertEqual(path.read_bytes(), (second / path.name).read_bytes(), path.name)


if __name__ == "__main__":
    unittest.main(verbosity=2)
