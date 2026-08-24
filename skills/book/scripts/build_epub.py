#!/usr/bin/env python3
"""Build, validate, inspect, and atomically deliver a collision-safe EPUB 3."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import posixpath
import re
import shutil
import subprocess
import tempfile
import unicodedata
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET


class BuildError(RuntimeError):
    """Raised when building, validation, package inspection, or delivery fails."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def slugify_title(title: str) -> str:
    normalized = unicodedata.normalize("NFKC", title).casefold()
    normalized = "".join(ch for ch in normalized if ch >= " " and ch not in "/\\")
    normalized = re.sub(r"[^\w]+", "-", normalized, flags=re.UNICODE).strip("-_")
    return normalized or f"book-{uuid.uuid4().hex[:8]}"


def collision_safe_path(destination: Path | str, slug: str) -> Path:
    directory = Path(destination)
    candidate = directory / f"{slug}.epub"
    suffix = 2
    while candidate.exists():
        candidate = directory / f"{slug}-{suffix}.epub"
        suffix += 1
    return candidate


def normalized_metadata(metadata: dict[str, Any]) -> dict[str, Any]:
    result = {key: value for key, value in metadata.items() if value not in (None, "")}
    title = str(result.get("title", "")).strip()
    if not title:
        raise ValueError("metadata title is required")
    result["title"] = title
    result.setdefault("lang", "en-US")
    result.setdefault("identifier", f"urn:uuid:{uuid.uuid4()}")
    result.setdefault("modified", _now())
    return result


def _parse_scalar(value: str) -> Any:
    stripped = value.strip()
    if len(stripped) >= 2 and stripped[0] == stripped[-1] and stripped[0] in "\"'":
        return stripped[1:-1]
    if stripped.lower() in {"true", "false"}:
        return stripped.lower() == "true"
    return stripped


def read_metadata(path: Path | str) -> dict[str, Any]:
    metadata: dict[str, Any] = {}
    for line_number, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip() or line.lstrip().startswith("#") or line.strip() in {"---", "..."}:
            continue
        match = re.match(r"^([A-Za-z][\w-]*):\s*(.*?)\s*$", line)
        if not match:
            raise ValueError(f"unsupported metadata syntax on line {line_number}")
        metadata[match.group(1)] = _parse_scalar(match.group(2))
    return normalized_metadata(metadata)


def _yaml_quote(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    return json.dumps(str(value), ensure_ascii=False)


def _write_metadata(path: Path, metadata: dict[str, Any]) -> None:
    lines = [f"{key}: {_yaml_quote(value)}" for key, value in metadata.items()]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _without_frontmatter(text: str) -> str:
    lines = text.splitlines(keepends=True)
    if not lines or lines[0].strip() != "---":
        return text
    for index in range(1, len(lines)):
        if lines[index].strip() in {"---", "..."}:
            return "".join(lines[index + 1 :])
    raise ValueError("manuscript YAML frontmatter is not closed")


def _epubcheck_command(path_env: str, jar: Path | str | None = None) -> list[str]:
    executable = shutil.which("epubcheck", path=path_env)
    if executable:
        return [executable]
    configured = Path(jar or os.environ.get("EPUBCHECK_JAR", "")).expanduser()
    java = shutil.which("java", path=path_env)
    if configured.is_file() and java:
        return [java, "-jar", str(configured.resolve())]
    raise BuildError("EPUBCheck is unavailable; install the executable or configure EPUBCHECK_JAR")


def _parse_epubcheck(output: str, returncode: int) -> tuple[int, int]:
    error_match = re.search(r"(?:Messages:\s*\d+\s+fatals?\s*/\s*)?(\d+)\s+errors?", output, re.I)
    warning_match = re.search(r"(\d+)\s+warnings?", output, re.I)
    errors = int(error_match.group(1)) if error_match else len(re.findall(r"^ERROR\b", output, re.M))
    warnings = int(warning_match.group(1)) if warning_match else len(re.findall(r"^WARNING\b", output, re.M))
    if returncode != 0 and errors == 0:
        errors = 1
    return errors, warnings


def _epubcheck_output_recognizable(output: str) -> bool:
    return bool(re.search(
        r"No errors or warnings detected|EPUB(?:Check)?[^\n]*(?:valid|completed)|"
        r"\d+\s+errors?|\d+\s+warnings?|Messages:\s*\d+",
        output,
        re.I,
    ))


def _package_document(archive: zipfile.ZipFile) -> str:
    names = archive.namelist()
    if "META-INF/container.xml" not in names:
        raise BuildError("EPUB package has no container.xml")
    container = ET.fromstring(archive.read("META-INF/container.xml"))
    rootfile = next((item for item in container.iter() if item.tag.endswith("rootfile")), None)
    package_path = rootfile.attrib.get("full-path") if rootfile is not None else None
    if not package_path or package_path not in names:
        raise BuildError("EPUB package document is missing")
    return package_path


def _rewrite_zip_member(epub: Path, member: str, replacement: bytes) -> None:
    temporary = epub.with_name(f".{epub.name}.{uuid.uuid4().hex}.tmp")
    try:
        with zipfile.ZipFile(epub, "r") as source, zipfile.ZipFile(temporary, "w") as target:
            if "mimetype" in source.namelist():
                target.writestr("mimetype", source.read("mimetype"), compress_type=zipfile.ZIP_STORED)
            for info in source.infolist():
                if info.filename == "mimetype":
                    continue
                target.writestr(info, replacement if info.filename == member else source.read(info.filename))
        os.replace(temporary, epub)
    except zipfile.BadZipFile as exc:
        raise BuildError(f"candidate is not a readable EPUB/ZIP package: {exc}") from exc
    finally:
        try:
            temporary.unlink()
        except FileNotFoundError:
            pass


def _ensure_package_metadata(epub: Path, metadata: dict[str, Any]) -> None:
    """Preserve supplied subtitle semantics when Pandoc omits them from OPF metadata."""
    with zipfile.ZipFile(epub) as archive:
        package_path = _package_document(archive)
        package = ET.fromstring(archive.read(package_path))
    metadata_element = next((item for item in package.iter() if item.tag.endswith("metadata")), None)
    if metadata_element is None:
        raise BuildError("EPUB package metadata element is missing")

    subtitle = str(metadata.get("subtitle", "")).strip()
    if subtitle:
        titles = {
            item.attrib.get("id"): (item.text or "").strip()
            for item in metadata_element
            if item.tag.endswith("title")
        }
        subtitle_ids = {
            item.attrib.get("refines", "").removeprefix("#")
            for item in metadata_element
            if item.tag.endswith("meta")
            and item.attrib.get("property") == "title-type"
            and (item.text or "").strip() == "subtitle"
        }
        if not any(titles.get(identifier) == subtitle for identifier in subtitle_ids):
            dc_namespace = "http://purl.org/dc/elements/1.1/"
            existing_ids = {value for value in titles if value}
            subtitle_id = "book-subtitle"
            suffix = 2
            while subtitle_id in existing_ids:
                subtitle_id = f"book-subtitle-{suffix}"
                suffix += 1
            title_element = ET.SubElement(
                metadata_element, f"{{{dc_namespace}}}title", {"id": subtitle_id}
            )
            title_element.text = subtitle
            type_element = ET.SubElement(
                metadata_element,
                "{http://www.idpf.org/2007/opf}meta",
                {"refines": f"#{subtitle_id}", "property": "title-type"},
            )
            type_element.text = "subtitle"
            ET.register_namespace("", "http://www.idpf.org/2007/opf")
            ET.register_namespace("dc", dc_namespace)
            replacement = ET.tostring(package, encoding="utf-8", xml_declaration=True)
            _rewrite_zip_member(epub, package_path, replacement)


def _resolved_internal_target(current: str, href: str) -> tuple[str, str] | None:
    if not href or re.match(r"^[a-z][a-z0-9+.-]*:", href, re.I):
        return None
    path, separator, fragment = href.partition("#")
    if not separator or not fragment:
        return None
    document = posixpath.normpath(posixpath.join(posixpath.dirname(current), path)) if path else current
    return document, fragment


def inspect_epub(path: Path | str, expected_metadata: dict[str, Any] | str) -> dict[str, Any]:
    epub = Path(path)
    expected = {"title": expected_metadata} if isinstance(expected_metadata, str) else expected_metadata
    expected_title = str(expected["title"])
    try:
        with zipfile.ZipFile(epub) as archive:
            names = archive.namelist()
            package_path = _package_document(archive)
            package = ET.fromstring(archive.read(package_path))
            package_dir = Path(package_path).parent
            version = package.attrib.get("version", "")
            title_elements = [element for element in package.iter() if element.tag.endswith("title")]
            title_values = [(element.text or "").strip() for element in title_elements]
            title_by_id = {
                element.attrib.get("id"): (element.text or "").strip()
                for element in title_elements
                if element.attrib.get("id")
            }
            subtitle_values = [
                title_by_id.get(element.attrib.get("refines", "").removeprefix("#"), "")
                for element in package.iter()
                if element.tag.endswith("meta")
                and element.attrib.get("property") == "title-type"
                and (element.text or "").strip() == "subtitle"
            ]
            language_values = [
                (element.text or "").strip()
                for element in package.iter()
                if element.tag.endswith("language")
            ]
            identifier_values = [
                (element.text or "").strip()
                for element in package.iter()
                if element.tag.endswith("identifier")
            ]
            modified_values = [
                (element.text or "").strip()
                for element in package.iter()
                if element.tag.endswith("meta") and element.attrib.get("property") == "dcterms:modified"
            ]
            nav_href: str | None = None
            css_present = False
            remote_resources: list[str] = []
            embedded_fonts = False
            for element in package.iter():
                if not element.tag.endswith("item"):
                    continue
                href = element.attrib.get("href", "")
                properties = element.attrib.get("properties", "").split()
                media_type = element.attrib.get("media-type", "")
                if "nav" in properties:
                    nav_href = href
                if media_type == "text/css" or href.lower().endswith(".css"):
                    css_present = True
                if "font" in media_type or href.lower().endswith((".otf", ".ttf", ".woff", ".woff2")):
                    embedded_fonts = True
                if re.match(r"^[a-z][a-z0-9+.-]*://", href, re.I):
                    remote_resources.append(href)
            nav_path = (package_dir / nav_href).as_posix() if nav_href else None
            nav_text = archive.read(nav_path).decode("utf-8", errors="replace") if nav_path and nav_path in names else ""
            navigation_entries = len(re.findall(r"<a\b", nav_text, re.I))
            documents = {
                name: archive.read(name).decode("utf-8", errors="replace")
                for name in names
                if name.lower().endswith((".xhtml", ".html", ".htm"))
            }
            content_text = "\n".join(documents.values())
            note_reference = bool(re.search(r"(?:epub:type=[\"']noteref|role=[\"']doc-noteref)", content_text, re.I))
            note_backlink = bool(re.search(r"(?:backlink|doc-backlink|footnote-back)", content_text, re.I))
            anchors = {
                (name, identifier)
                for name, text in documents.items()
                for identifier in re.findall(r"\bid=[\"']([^\"']+)[\"']", text, re.I)
            }
            noteref_pairs: list[tuple[tuple[str, str] | None, tuple[str, str] | None]] = []
            for name, text in documents.items():
                for tag in re.findall(r"<a\b[^>]*>", text, re.I):
                    href_match = re.search(r"\bhref=[\"']([^\"']+)[\"']", tag, re.I)
                    href = href_match.group(1) if href_match else ""
                    target = _resolved_internal_target(name, href)
                    if re.search(r"(?:epub:type=[\"']noteref|role=[\"']doc-noteref)", tag, re.I):
                        identifier_match = re.search(r"\bid=[\"']([^\"']+)[\"']", tag, re.I)
                        expected_backlink = (name, identifier_match.group(1)) if identifier_match else None
                        noteref_pairs.append((target, expected_backlink))

            def footnote_has_return_link(
                target: tuple[str, str] | None,
                expected_backlink: tuple[str, str] | None,
            ) -> bool:
                if target not in anchors or expected_backlink not in anchors:
                    return False
                document, footnote_id = target
                text = documents.get(document, "")
                footnote = re.search(
                    rf"<(?P<tag>[a-z][\w:-]*)\b(?=[^>]*\bid=[\"']{re.escape(footnote_id)}[\"'])[^>]*>"
                    rf"(?P<body>.*?)</(?P=tag)>",
                    text,
                    re.I | re.S,
                )
                if not footnote:
                    return False
                for tag in re.findall(r"<a\b[^>]*role=[\"']doc-backlink[\"'][^>]*>", footnote.group("body"), re.I):
                    href_match = re.search(r"\bhref=[\"']([^\"']+)[\"']", tag, re.I)
                    if href_match and _resolved_internal_target(document, href_match.group(1)) == expected_backlink:
                        return True
                return False

            note_links_valid = bool(noteref_pairs) and all(
                footnote_has_return_link(target, expected)
                for target, expected in noteref_pairs
            )
            resource_pattern = re.compile(
                r"<(?:img|audio|video|source|script|iframe|object|embed|link)\b[^>]*"
                r"(?:src|href|data)=[\"']((?:https?:)?//[^\"']+)", re.I,
            )
            for name, text in documents.items():
                remote_resources.extend(f"{name}:{url}" for url in resource_pattern.findall(text))
            for name in names:
                if name.lower().endswith(".css"):
                    css_text = archive.read(name).decode("utf-8", errors="replace")
                    remote_resources.extend(
                        f"{name}:{url}"
                        for url in re.findall(r"url\(\s*[\"']?((?:https?:)?//[^\"')\s]+)", css_text, re.I)
                    )
            scripted_content = bool(
                re.search(r"<script\b|\son[a-z]+\s*=|javascript\s*:", content_text, re.I)
                or any(
                    element.tag.endswith("item") and "scripted" in element.attrib.get("properties", "").split()
                    for element in package.iter()
                )
            )
            fixed_layout = any(
                element.tag.endswith("meta")
                and element.attrib.get("property") == "rendition:layout"
                and (element.text or "").strip() == "pre-paginated"
                for element in package.iter()
            )
            drm_present = "META-INF/encryption.xml" in names or "META-INF/rights.xml" in names
            creators = [
                (element.text or "").strip()
                for element in package.iter()
                if element.tag.endswith("creator") and (element.text or "").strip()
            ]
            return {
                "epub3": version.startswith("3"),
                "package_document": package_path,
                "navigation_document": nav_path if nav_text else None,
                "title_present": expected_title in title_values,
                "titles": title_values,
                "subtitle_present": not expected.get("subtitle") or str(expected["subtitle"]) in subtitle_values,
                "subtitles": subtitle_values,
                "language_present": str(expected.get("lang", "en-US")) in language_values,
                "languages": language_values,
                "identifier_present": str(expected.get("identifier", "")) in identifier_values,
                "identifiers": identifier_values,
                "modified_present": bool(modified_values),
                "creator_values": creators,
                "chapter_navigation_entries": navigation_entries,
                "note_reference_present": note_reference,
                "note_backlink_present": note_backlink,
                "note_links_valid": note_links_valid,
                "css_present": css_present,
                "remote_resources": sorted(set(remote_resources)),
                "scripted_content": scripted_content,
                "embedded_fonts": embedded_fonts,
                "fixed_layout": fixed_layout,
                "drm_present": drm_present,
                "file_count": len(names),
            }
    except zipfile.BadZipFile as exc:
        raise BuildError(f"candidate is not a readable EPUB/ZIP package: {exc}") from exc


def _ensure_footnote_backlinks(epub: Path) -> int:
    """Add semantic return links when current Pandoc omits them."""
    temporary = epub.with_name(f".{epub.name}.{uuid.uuid4().hex}.tmp")
    added = 0
    try:
        with zipfile.ZipFile(epub, "r") as source, zipfile.ZipFile(temporary, "w") as target:
            names = source.namelist()
            if "mimetype" in names:
                target.writestr("mimetype", source.read("mimetype"), compress_type=zipfile.ZIP_STORED)
            for info in source.infolist():
                if info.filename == "mimetype":
                    continue
                data = source.read(info.filename)
                if info.filename.lower().endswith((".xhtml", ".html", ".htm")):
                    text = data.decode("utf-8", errors="strict")
                    references: dict[str, str] = {}
                    for tag in re.findall(r"<a\b[^>]*>", text, re.I):
                        if not re.search(r"(?:epub:type=[\"']noteref|role=[\"']doc-noteref)", tag, re.I):
                            continue
                        href = re.search(r"\bhref=[\"']#([^\"']+)[\"']", tag, re.I)
                        identifier = re.search(r"\bid=[\"']([^\"']+)[\"']", tag, re.I)
                        if href and identifier:
                            references[href.group(1)] = identifier.group(1)

                    footnote_re = re.compile(
                        r"(<aside\b(?=[^>]*\bid=[\"']([^\"']+)[\"'])(?=[^>]*(?:epub:type=[\"']footnote|role=[\"']doc-footnote))[^>]*>)(.*?)(</aside>)",
                        re.I | re.S,
                    )

                    def add_backlink(match: re.Match[str]) -> str:
                        nonlocal added
                        opening, footnote_id, content, closing = match.groups()
                        reference_id = references.get(footnote_id)
                        if not reference_id or re.search(r"role=[\"']doc-backlink", content, re.I):
                            return match.group(0)
                        added += 1
                        backlink = (
                            f'<p class="footnote-back"><a href="#{reference_id}" '
                            'role="doc-backlink" aria-label="Back to text">↩</a></p>'
                        )
                        return f"{opening}{content}{backlink}{closing}"

                    text = footnote_re.sub(add_backlink, text)
                    data = text.encode("utf-8")
                target.writestr(info, data)
        os.replace(temporary, epub)
        return added
    except zipfile.BadZipFile as exc:
        raise BuildError(f"Pandoc output is not a readable EPUB/ZIP package: {exc}") from exc
    finally:
        try:
            temporary.unlink()
        except FileNotFoundError:
            pass


def _atomic_deliver(candidate: Path, destination: Path, slug: str) -> Path:
    destination.mkdir(parents=True, exist_ok=True)
    temporary = destination / f".{slug}.{uuid.uuid4().hex}.tmp"
    try:
        with candidate.open("rb") as source, temporary.open("xb") as target:
            shutil.copyfileobj(source, target)
            target.flush()
            os.fsync(target.fileno())
        while True:
            final = collision_safe_path(destination, slug)
            try:
                os.link(temporary, final)
                break
            except FileExistsError:
                continue
        temporary.unlink()
        return final.resolve()
    finally:
        try:
            temporary.unlink()
        except FileNotFoundError:
            pass


def build_epub(
    manuscript: Path | str,
    metadata: Path | str,
    css: Path | str,
    destination: Path | str,
    *,
    validate: bool = True,
    epubcheck_jar: Path | str | None = None,
    path_env: str | None = None,
    work_dir: Path | str | None = None,
) -> dict[str, Any]:
    if not validate:
        raise BuildError("EPUBCheck validation is mandatory for deliverable EPUBs")
    active_path = path_env if path_env is not None else os.environ.get("PATH", "")
    manuscript_path = Path(manuscript).expanduser().resolve(strict=True)
    metadata_path = Path(metadata).expanduser().resolve(strict=True)
    css_path = Path(css).expanduser().resolve(strict=True)
    destination_path = Path(destination).expanduser().resolve()
    if work_dir is None:
        build_root = Path(tempfile.mkdtemp(prefix="codex-book-build-"))
    else:
        build_root = Path(work_dir).expanduser().resolve()
        build_root.mkdir(parents=True, exist_ok=True)
    candidate = build_root / "candidate.epub"
    validation_log = build_root / "epubcheck.txt"
    build_record = build_root / "build.json"

    normalized = read_metadata(metadata_path)
    generated_metadata = build_root / "metadata.normalized.yaml"
    _write_metadata(generated_metadata, normalized)
    normalized_manuscript = build_root / "manuscript.normalized.md"
    normalized_manuscript.write_text(
        _without_frontmatter(manuscript_path.read_text(encoding="utf-8")),
        encoding="utf-8",
    )

    pandoc = shutil.which("pandoc", path=active_path)
    if not pandoc:
        raise BuildError("Pandoc is unavailable on PATH")
    command = [
        pandoc,
        str(normalized_manuscript),
        "--from=markdown+smart",
        "--to=epub3",
        "--output", str(candidate),
        "--toc",
        "--toc-depth=2",
        "--split-level=1",
        f"--metadata-file={generated_metadata}",
        f"--css={css_path}",
    ]
    completed = subprocess.run(
        command,
        text=True,
        capture_output=True,
        env={**os.environ, "PATH": active_path},
        check=False,
    )
    if completed.returncode != 0 or not candidate.is_file():
        raise BuildError(f"Pandoc failed ({completed.returncode}): {(completed.stderr or completed.stdout).strip()}")

    _ensure_footnote_backlinks(candidate)
    _ensure_package_metadata(candidate, normalized)

    validator = _epubcheck_command(active_path, epubcheck_jar)
    checked = subprocess.run(
        [*validator, str(candidate)],
        text=True,
        capture_output=True,
        env={**os.environ, "PATH": active_path},
        check=False,
    )
    validator_output = ((checked.stdout or "") + (checked.stderr or "")).strip()
    validation_log.write_text(validator_output + "\n", encoding="utf-8")
    if not validator_output or not _epubcheck_output_recognizable(validator_output):
        raise BuildError(f"EPUBCheck returned no recognizable validation result; see {validation_log}")
    epubcheck_errors, epubcheck_warnings = _parse_epubcheck(validator_output, checked.returncode)
    if epubcheck_errors or checked.returncode != 0:
        raise BuildError(
            f"EPUBCheck rejected the candidate with {epubcheck_errors} error(s); see {validation_log}"
        )
    if epubcheck_warnings:
        raise BuildError(
            f"EPUBCheck reported {epubcheck_warnings} warning(s); inspect and resolve them before delivery; see {validation_log}"
        )

    inspection = inspect_epub(candidate, normalized)
    expects_notes = bool(re.search(r"\[\^[^\]]+\]", normalized_manuscript.read_text(encoding="utf-8")))
    required_inspection = (
        inspection["epub3"], inspection["package_document"],
        inspection["navigation_document"], inspection["title_present"],
        inspection["subtitle_present"], inspection["language_present"],
        inspection["identifier_present"], inspection["modified_present"],
        inspection["chapter_navigation_entries"] > 0, inspection["css_present"],
        not inspection["remote_resources"], not inspection["scripted_content"],
        not inspection["embedded_fonts"], not inspection["fixed_layout"],
        not inspection["drm_present"],
        not expects_notes or (
            inspection["note_reference_present"]
            and inspection["note_backlink_present"]
            and inspection["note_links_valid"]
        ),
    )
    if not all(required_inspection):
        raise BuildError(f"EPUB package inspection failed: {inspection}")
    if not any(key in normalized for key in ("author", "creator")) and inspection["creator_values"]:
        raise BuildError("EPUB contains creator metadata that was not supplied")

    slug = slugify_title(str(normalized["title"]))
    final = _atomic_deliver(candidate, destination_path, slug)
    if not final.is_file() or final.stat().st_size <= 0:
        raise BuildError("atomic delivery verification failed")
    delivered_inspection = inspect_epub(final, normalized)
    digest = hashlib.sha256(final.read_bytes()).hexdigest()
    result = {
        "ok": True,
        "title": normalized["title"],
        "final_path": str(final),
        "bytes": final.stat().st_size,
        "sha256": digest,
        "epubcheck_errors": epubcheck_errors,
        "epubcheck_warnings": epubcheck_warnings,
        "epubcheck_log": str(validation_log.resolve()),
        "metadata": normalized,
        "inspection": delivered_inspection,
        "pandoc_command": command,
        "built_at": _now(),
    }
    build_record.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return result


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manuscript", required=True)
    parser.add_argument("--metadata", required=True)
    parser.add_argument("--css", required=True)
    parser.add_argument("--destination", required=True)
    parser.add_argument("--work-dir")
    parser.add_argument("--epubcheck-jar", default=os.environ.get("EPUBCHECK_JAR"))
    parser.add_argument("--validate", action="store_true", default=True, help="required release validation")
    parser.add_argument("--json", action="store_true")
    return parser


def main() -> int:
    args = _parser().parse_args()
    try:
        result = build_epub(
            args.manuscript, args.metadata, args.css, args.destination,
            validate=args.validate, epubcheck_jar=args.epubcheck_jar,
            work_dir=args.work_dir,
        )
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False, indent=2))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
