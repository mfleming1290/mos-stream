#!/usr/bin/env python3
"""Build offline artifacts in staging only. Never installs or publishes anything."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import tempfile
import time
import zipfile

ROOT = Path(__file__).resolve().parent.parent
EXCLUDE_PARTS = {".git", "node_modules", "dist", "artifacts", "output", ".playwright-cli", ".playwright", "__pycache__", ".pytest_cache"}
EPOCH = int(os.environ.get("SOURCE_DATE_EPOCH", "1609459200"))


def digest(path, algorithm="sha256"):
    h = hashlib.new(algorithm)
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, sort_keys=True, indent=2) + "\n")


def regular_files(directory):
    for path in sorted(directory.rglob("*")):
        if path.is_symlink():
            raise ValueError(f"Symlinks are not accepted: {path.relative_to(ROOT) if path.is_relative_to(ROOT) else path.name}")
        if path.is_file():
            yield path
        elif not path.is_dir():
            raise ValueError(f"Special files are not accepted: {path.name}")


def copy_tree(source, destination, executable=False):
    for src in regular_files(source):
        target = destination / src.relative_to(source)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, target)
        target.chmod(0o755 if executable else 0o644)


def source_files(output):
    # Prune excluded trees before inspecting files, so npm's .bin links are ignored.
    for directory, dirs, files in os.walk(ROOT, followlinks=False):
        base = Path(directory)
        dirs[:] = sorted(d for d in dirs if d not in EXCLUDE_PARTS and base / d != output)
        for name in dirs:
            if (base / name).is_symlink():
                raise ValueError(f"Source symlink is not accepted: {base / name}")
        for name in sorted(files):
            path = base / name
            if path.is_symlink() or not path.is_file():
                raise ValueError(f"Source must contain regular files: {path}")
            if name.endswith((".pyc", ".deb", ".zip")) or name in {".DS_Store", ".env", "source-manifest.json"} or name.startswith(".env."):
                continue
            yield path


def normalized_zip(path, entries):
    timestamp = time.gmtime(max(EPOCH, 315532800))[:6]
    with zipfile.ZipFile(path, "x", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        seen = set()
        for relative, source in sorted(entries, key=lambda item: item[0]):
            if relative.casefold() in seen:
                raise ValueError(f"Case-colliding ZIP path: {relative}")
            seen.add(relative.casefold())
            info = zipfile.ZipInfo(relative, timestamp)
            info.create_system = 3
            mode = 0o755 if source.stat().st_mode & 0o111 else 0o644
            info.external_attr = (stat.S_IFREG | mode) << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, source.read_bytes())


def metadata():
    # plugin.config.js is trusted project source, not imported plugin metadata.
    raw = subprocess.check_output([
        "node", "--input-type=module", "-e",
        "import config from './page/plugin.config.js'; console.log(JSON.stringify(config));",
    ], cwd=ROOT, text=True)
    config = json.loads(raw)
    name, version = config["name"], config["version"]
    if not re.fullmatch(r"[a-z][a-z0-9]*(?:-[a-z0-9]+)*", name):
        raise ValueError("Plugin name must be a lowercase hyphenated identifier")
    if not re.fullmatch(r"(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)", version):
        raise ValueError("Version must be numeric x.y.z without a v prefix")
    for field in ("displayName", "description", "author", "homepage", "icon"):
        if not isinstance(config.get(field), str) or not config[field] or any(ord(c) < 32 for c in config[field]):
            raise ValueError(f"Invalid one-line metadata: {field}")
    package = f"mos-{name}-plugin"
    pkg = json.loads((ROOT / "page/package.json").read_text())
    lock = json.loads((ROOT / "page/package-lock.json").read_text())
    if pkg["name"] != package or any(v != version for v in (pkg["version"], lock["version"], lock["packages"][""]["version"])):
        raise ValueError("Plugin, package and lockfile identities/versions disagree")
    return config, package


def build(output):
    config, package = metadata()
    name, version = config["name"], config["version"]
    debian_version = f"{version}-1+mos-plugin"
    dist = ROOT / "page/dist" / name
    if not (dist / "remoteEntry.js").is_file():
        raise ValueError("Build first: page/dist/<name>/remoteEntry.js is missing")
    if json.loads((dist / "manifest.json").read_text()) != config:
        raise ValueError("Built manifest is stale; rebuild before packaging")
    deb_name = f"{name}_{debian_version}_all.deb"
    source_name = f"mos-{name}-{version}-source.zip"
    install_name = f"mos-{name}-{version}-install.zip"
    pair_name = f"mos-{name}-{version}-manifest.json"
    names = [deb_name, source_name, install_name, pair_name, "SHA256SUMS"]
    names += [f"{deb_name}.md5", f"{deb_name}.sha256", f"{source_name}.sha256", f"{install_name}.sha256"]
    output = output.resolve()
    # Never package into source folders or system paths: explicit local output only.
    if output == ROOT or ROOT.is_relative_to(output):
        raise ValueError("Output must be a dedicated artifact directory")
    if any((output / filename).exists() for filename in names):
        raise ValueError("An output already exists. Use a new version or a new --output directory; never replace a published build.")
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="mos-stream-build-") as temporary:
        stage = Path(temporary)
        artifacts = stage / "artifacts"
        artifacts.mkdir()
        source_root = stage / "source/mos-stream"
        source_root.mkdir(parents=True)
        source_checksums = {}
        for source in source_files(output):
            relative = source.relative_to(ROOT)
            if any(part in EXCLUDE_PARTS for part in relative.parts) or output == source.parent or output in source.parents:
                continue
            if source.name.endswith((".pyc", ".deb", ".zip")) or source.name in {".DS_Store", ".env"} or source.name.startswith(".env."):
                continue
            target = source_root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)
            target.chmod(0o755 if source.stat().st_mode & 0o111 else 0o644)
            source_checksums[relative.as_posix()] = digest(target)
        write_json(source_root / "source-manifest.json", {
            "schemaVersion": 1, "kind": "source", "name": name, "version": version,
            "files": source_checksums, "license": "AGPL-3.0-only",
        })
        normalized_zip(artifacts / source_name, [(f"mos-stream/{p.relative_to(source_root).as_posix()}", p) for p in regular_files(source_root)])

        deb_root = stage / "deb"
        control = deb_root / "DEBIAN"
        control.mkdir(parents=True)
        copy_tree(dist, deb_root / f"var/www/mos-plugins/{name}")
        docs = deb_root / f"usr/share/doc/{package}"
        docs.mkdir(parents=True)
        for filename in ("LICENSE", "NOTICE", "THIRD-PARTY-NOTICES.md"):
            shutil.copyfile(ROOT / filename, docs / filename)
        if (ROOT / "docs/licenses").is_dir():
            copy_tree(ROOT / "docs/licenses", docs / "licenses")
        helpers = list(regular_files(ROOT / "bin")) if (ROOT / "bin").is_dir() else []
        for helper in helpers:
            if helper.name.endswith((".md", ".txt")):
                continue
            if helper.parent != ROOT / "bin" or helper.name != name or not helper.read_bytes().startswith(b"#!"):
                raise ValueError("Architecture all only accepts an exactly plugin-named interpreted helper; review native architecture explicitly.")
            target = deb_root / "usr/bin/plugins" / helper.name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(helper, target)
            target.chmod(0o755)
        text = f"Package: {package}\nVersion: {debian_version}\nArchitecture: all\nMaintainer: {config['author']}\n"
        if any(p.read_bytes().startswith(b"#!/usr/bin/python3") for p in helpers if not p.name.endswith((".md", ".txt"))):
            text += "Depends: python3\n"
        text += f"Description: {config['description']}\n"
        (control / "control").write_text(text)
        for p in [deb_root, *deb_root.rglob("*")]:
            if p.is_dir():
                p.chmod(0o755)
            os.utime(p, (EPOCH, EPOCH))
        environment = {**os.environ, "SOURCE_DATE_EPOCH": str(EPOCH)}
        subprocess.run(["dpkg-deb", "--root-owner-group", "-Zxz", "-z9", "--build", str(deb_root), str(artifacts / deb_name)], check=True, env=environment)
        for algorithm in ("md5", "sha256"):
            (artifacts / f"{deb_name}.{algorithm}").write_text(f"{digest(artifacts / deb_name, algorithm)}  {deb_name}\n")

        bundle = stage / "install"
        plugin_root = bundle / name
        version_root = plugin_root / version
        version_root.mkdir(parents=True)
        for filename in (deb_name, f"{deb_name}.md5", f"{deb_name}.sha256"):
            shutil.copyfile(artifacts / filename, version_root / filename)
        shutil.copyfile(ROOT / "page/plugin.config.js", version_root / "plugin.config.js")
        if (ROOT / "functions").exists():
            shutil.copyfile(ROOT / "functions", version_root / "functions")
        if (ROOT / "settings.json").exists():
            settings = json.loads((ROOT / "settings.json").read_text())
            if not isinstance(settings, dict):
                raise ValueError("Optional settings.json must be a plain JSON object")
            shutil.copyfile(ROOT / "settings.json", plugin_root / "settings.json")
        if (ROOT / "staticfiles").is_dir():
            copy_tree(ROOT / "staticfiles", plugin_root / "staticfiles")
        write_json(plugin_root / "template.json", {
            **config, "tag": version, "driver": False,
            "settings": (ROOT / "settings.json").exists(),
        })
        manifest = {
            "schemaVersion": 1, "kind": "install", "name": name, "version": version,
            "package": package, "debianVersion": debian_version, "architecture": "all",
            "sourceArchive": {"filename": source_name, "sha256": digest(artifacts / source_name)},
            "files": {p.relative_to(bundle).as_posix(): digest(p) for p in regular_files(bundle)},
        }
        write_json(bundle / "manifest.json", manifest)
        normalized_zip(artifacts / install_name, [(p.relative_to(bundle).as_posix(), p) for p in regular_files(bundle)])
        pair = {k: manifest[k] for k in ("schemaVersion", "name", "version", "package", "debianVersion", "architecture")}
        pair["artifacts"] = {kind: {"filename": filename, "sha256": digest(artifacts / filename)} for kind, filename in (("install", install_name), ("source", source_name), ("deb", deb_name))}
        write_json(artifacts / pair_name, pair)
        for filename in (install_name, source_name):
            (artifacts / f"{filename}.sha256").write_text(f"{digest(artifacts / filename)}  {filename}\n")
        (artifacts / "SHA256SUMS").write_text("".join(f"{digest(p)}  {p.name}\n" for p in sorted(artifacts.iterdir())))
        for path in sorted(artifacts.iterdir()):
            # Exclusive creation prevents silently overwriting a build raced into place.
            with path.open("rb") as source, (output / path.name).open("xb") as target:
                shutil.copyfileobj(source, target)
    print(json.dumps({"output": str(output), "install": install_name, "source": source_name, "manifest": pair_name}, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "artifacts")
    args = parser.parse_args()
    try:
        build(args.output)
    except (ValueError, OSError, subprocess.CalledProcessError, KeyError) as failure:
        parser.exit(1, f"Packaging failed: {failure}\n")
