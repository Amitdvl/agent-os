#!/usr/bin/env python3
"""Run deterministic mechanical checks on a Pandoc Markdown book manuscript."""

from __future__ import annotations

import argparse
import json
import os
import re
import tempfile
import unicodedata
from collections import Counter
from pathlib import Path
from statistics import median
from typing import Any


WORD_RE = re.compile(r"\b[^\W_]+(?:[’'-][^\W_]+)*\b", re.UNICODE)
HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)(?:\s+\{[^{}]*\})?\s*$")
FOOTNOTE_DEF_RE = re.compile(r"^\[\^([^\]]+)\]:\s*(.*)$")
FOOTNOTE_REF_RE = re.compile(r"\[\^([^\]]+)\]")
LINK_RE = re.compile(r"\[[^\]]+\]\(#([^)]+)\)")
UNRESOLVED_RE = re.compile(
    r"\b(?:TODO|TBD|FIXME)\b|\[(?:SOURCE|CITATION\s+NEEDED)\]",
    re.IGNORECASE,
)
BIBLIOGRAPHY_RE = re.compile(
    r"^(?:selected\s+)?(?:bibliography|further reading|bibliography and further reading)$",
    re.I,
)
LANG_RE = re.compile(r"^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$")


def _frontmatter(lines: list[str]) -> tuple[dict[str, str], list[str]]:
    if not lines or lines[0].strip() != "---":
        return {}, lines
    end = next((i for i in range(1, len(lines)) if lines[i].strip() in {"---", "..."}), None)
    if end is None:
        return {}, lines
    metadata: dict[str, str] = {}
    for line in lines[1:end]:
        match = re.match(r"^([A-Za-z][\w-]*):\s*(.*?)\s*$", line)
        if match:
            metadata[match.group(1).lower()] = match.group(2).strip("\"'")
    return metadata, lines[end + 1 :]


def _metadata_file(path: Path | str | None) -> dict[str, str]:
    if path is None:
        return {}
    metadata: dict[str, str] = {}
    for line in Path(path).expanduser().resolve(strict=True).read_text(encoding="utf-8").splitlines():
        match = re.match(r"^([A-Za-z][\w-]*):\s*(.*?)\s*$", line)
        if match:
            metadata[match.group(1).lower()] = match.group(2).strip("\"'")
    return metadata


def _anchor(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text).casefold()
    normalized = re.sub(r"[^\w\s-]", "", normalized, flags=re.UNICODE)
    return re.sub(r"[-\s]+", "-", normalized).strip("-")


def _word_count(text: str) -> int:
    text = re.sub(r"\[\^[^\]]+\]", "", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"[*_`~]", "", text)
    return len(WORD_RE.findall(text))


def _strip_footnote_definitions(lines: list[str]) -> tuple[list[str], list[str]]:
    kept: list[str] = []
    definitions: list[str] = []
    in_definition = False
    for line in lines:
        match = FOOTNOTE_DEF_RE.match(line)
        if match:
            definitions.append(match.group(1))
            in_definition = True
            continue
        if in_definition and (line.startswith("    ") or line.startswith("\t") or not line.strip()):
            continue
        in_definition = False
        kept.append(line)
    return kept, definitions


def _finding(severity: str, code: str, message: str, **details: Any) -> dict[str, Any]:
    return {"severity": severity, "code": code, "message": message, **details}


def check_manuscript(
    manuscript: Path | str,
    *,
    target_min: int = 10_000,
    target_max: int = 30_000,
    repeated_sentence_min_words: int = 10,
    metadata_path: Path | str | None = None,
) -> dict[str, Any]:
    path = Path(manuscript).expanduser().resolve()
    raw = path.read_text(encoding="utf-8")
    embedded_metadata, body_lines = _frontmatter(raw.splitlines())
    metadata = {**embedded_metadata, **_metadata_file(metadata_path)}
    findings: list[dict[str, Any]] = []

    headings: list[tuple[int, str, int]] = []
    for number, line in enumerate(body_lines, start=1):
        match = HEADING_RE.match(line)
        if match:
            headings.append((len(match.group(1)), match.group(2).strip(), number))

    title_present = bool(metadata.get("title"))
    if not title_present:
        findings.append(_finding("error", "missing_title", "Embedded or external YAML metadata must include a title"))
    if "lang" in metadata and not LANG_RE.fullmatch(metadata["lang"]):
        findings.append(_finding("error", "invalid_metadata", f"Invalid language tag: {metadata['lang']}"))
    if metadata and not metadata.get("identifier"):
        findings.append(_finding("warning", "metadata_identifier_missing", "Metadata has no unique identifier"))

    previous_level = 0
    for level, heading, line_number in headings:
        if previous_level and level > previous_level + 1:
            findings.append(_finding(
                "error", "heading_hierarchy", f"Heading level jumps from {previous_level} to {level}",
                heading=heading, line=line_number,
            ))
        previous_level = level
    heading_counts = Counter(heading.casefold() for _, heading, _ in headings)
    for heading, count in heading_counts.items():
        if count > 1:
            findings.append(_finding("error", "duplicate_heading", f"Heading appears {count} times: {heading}"))

    top_level = [(heading, line_number) for level, heading, line_number in headings if level == 1]
    bibliography_index: int | None = None
    for index, line in enumerate(body_lines):
        match = HEADING_RE.match(line)
        if match and BIBLIOGRAPHY_RE.fullmatch(match.group(2).strip()):
            bibliography_index = index
            break
    if bibliography_index is None:
        findings.append(_finding("error", "missing_bibliography", "Bibliography or further-reading section is required"))

    narrative_lines = body_lines[:bibliography_index] if bibliography_index is not None else body_lines
    narrative_without_notes, footnote_definitions = _strip_footnote_definitions(narrative_lines)
    narrative_prose_lines = [line for line in narrative_without_notes if not HEADING_RE.match(line)]
    body_word_count = _word_count("\n".join(narrative_prose_lines))
    if body_word_count < target_min or body_word_count > target_max:
        findings.append(_finding(
            "error", "body_word_count_out_of_range",
            f"Main narrative body has {body_word_count} words; required range is {target_min}–{target_max}",
        ))

    chapters: dict[str, list[str]] = {}
    current: str | None = None
    for index, line in enumerate(narrative_lines):
        match = HEADING_RE.match(line)
        if match and len(match.group(1)) == 1:
            current = match.group(2).strip()
            chapters.setdefault(current, [])
        elif current is not None:
            chapters[current].append(line)
    per_chapter: dict[str, int] = {}
    for heading, lines in chapters.items():
        clean_lines, _ = _strip_footnote_definitions(lines)
        per_chapter[heading] = _word_count("\n".join(line for line in clean_lines if not HEADING_RE.match(line)))
    if not chapters:
        findings.append(_finding("error", "missing_body_chapter", "At least one top-level body chapter is required"))
    nonzero_counts = [count for count in per_chapter.values() if count > 0]
    if len(nonzero_counts) >= 2:
        typical = median(nonzero_counts)
        for heading, count in per_chapter.items():
            if typical and count > typical * 4:
                findings.append(_finding("warning", "chapter_length_imbalance", f"Chapter is more than 4× the median length: {heading}"))

    for idx, (level, heading, line_number) in enumerate(headings):
        start = line_number
        end = headings[idx + 1][2] - 1 if idx + 1 < len(headings) else len(body_lines)
        section = body_lines[start:end]
        meaningful = [
            line for line in section
            if line.strip() and not FOOTNOTE_DEF_RE.match(line) and not HEADING_RE.match(line)
        ]
        if not meaningful:
            findings.append(_finding("error", "empty_section", f"Section is empty: {heading}", line=line_number))

    unresolved = [(i, line.strip()) for i, line in enumerate(body_lines, start=1) if UNRESOLVED_RE.search(line)]
    for line_number, excerpt in unresolved:
        findings.append(_finding("error", "unresolved_marker", f"Unresolved drafting marker: {excerpt}", line=line_number))
    if "<!--" in raw or "-->" in raw:
        findings.append(_finding("error", "drafting_comment", "HTML drafting comments remain in the manuscript"))

    prose_for_duplicates, _ = _strip_footnote_definitions(narrative_lines)
    paragraph_text = "\n".join(prose_for_duplicates)
    paragraphs = [
        re.sub(r"\s+", " ", paragraph.strip())
        for paragraph in re.split(r"\n\s*\n", paragraph_text)
        if paragraph.strip() and not paragraph.lstrip().startswith("#")
    ]
    paragraph_counts = Counter(paragraphs)
    for paragraph, count in paragraph_counts.items():
        if count > 1:
            findings.append(_finding("error", "duplicate_paragraph", f"Exact paragraph appears {count} times", excerpt=paragraph[:160]))

    sentence_counts: Counter[str] = Counter()
    sentence_display: dict[str, str] = {}
    for paragraph in paragraphs:
        for sentence in re.split(r"(?<=[.!?])\s+", paragraph):
            normalized = re.sub(r"\s+", " ", sentence).strip().casefold()
            if _word_count(normalized) >= repeated_sentence_min_words:
                sentence_counts[normalized] += 1
                sentence_display[normalized] = sentence.strip()
    for normalized, count in sentence_counts.items():
        if count > 1:
            findings.append(_finding("warning", "repeated_sentence", f"Sentence appears {count} times", excerpt=sentence_display[normalized][:200]))

    all_definition_ids = [match.group(1) for line in body_lines if (match := FOOTNOTE_DEF_RE.match(line))]
    references = [
        identifier
        for line in body_lines
        if not FOOTNOTE_DEF_RE.match(line)
        for identifier in FOOTNOTE_REF_RE.findall(line)
    ]
    reference_set = set(references)
    definition_set = set(all_definition_ids)
    if not references:
        findings.append(_finding("error", "missing_footnote", "At least one semantic Pandoc footnote is required"))
    for identifier, count in Counter(all_definition_ids).items():
        if count > 1:
            findings.append(_finding("error", "duplicate_footnote_definition", f"Duplicate footnote definition: {identifier}"))
    for identifier in sorted(reference_set - definition_set):
        findings.append(_finding("error", "footnote_reference_missing_definition", f"Footnote reference has no definition: {identifier}"))
    for identifier in sorted(definition_set - reference_set):
        findings.append(_finding("error", "footnote_definition_without_reference", f"Footnote definition is unused: {identifier}"))

    if any(level == 1 and heading.strip().casefold() in {"notes", "endnotes"} for level, heading, _ in headings):
        findings.append(_finding("error", "manual_notes_chapter", "Do not add a manual Notes chapter when using Pandoc footnotes"))

    valid_anchors = {_anchor(heading) for _, heading, _ in headings}
    for target in LINK_RE.findall(raw):
        if target not in valid_anchors:
            findings.append(_finding("error", "invalid_internal_link", f"Internal link target does not exist: #{target}"))

    raw_html_lines = []
    for i, line in enumerate(body_lines, start=1):
        without_autolinks = re.sub(r"<(?:https?://|mailto:)[^>]+>", "", line, flags=re.I)
        if re.search(r"<\/?[A-Za-z][^>]*>", without_autolinks):
            raw_html_lines.append(i)
    if raw_html_lines:
        findings.append(_finding("warning", "raw_html", "Raw HTML may reduce EPUB portability", lines=raw_html_lines))

    errors = sum(item["severity"] == "error" for item in findings)
    warnings = sum(item["severity"] == "warning" for item in findings)
    total_package_word_count = _word_count("\n".join(line for line in body_lines if not HEADING_RE.match(line)))
    return {
        "schema_version": 1,
        "ok": errors == 0,
        "manuscript": str(path),
        "title": metadata.get("title"),
        "body_word_count": body_word_count,
        "total_package_word_count": total_package_word_count,
        "chapter_count": len(chapters),
        "per_chapter_word_count": per_chapter,
        "target_min": target_min,
        "target_max": target_max,
        "summary": {"errors": errors, "warnings": warnings, "info": 0},
        "findings": findings,
    }


def _write_report(path: Path, report: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(report, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.replace(temporary, path)
    except Exception:
        try:
            os.unlink(temporary)
        except FileNotFoundError:
            pass
        raise


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manuscript", required=True)
    parser.add_argument("--metadata", help="optional authoritative external metadata YAML")
    parser.add_argument("--target-min", type=int, default=10_000)
    parser.add_argument("--target-max", type=int, default=30_000)
    parser.add_argument("--repeated-sentence-min-words", type=int, default=10)
    parser.add_argument("--report")
    parser.add_argument("--json", action="store_true")
    return parser


def main() -> int:
    args = _parser().parse_args()
    report = check_manuscript(
        args.manuscript,
        target_min=args.target_min,
        target_max=args.target_max,
        repeated_sentence_min_words=args.repeated_sentence_min_words,
        metadata_path=args.metadata,
    )
    if args.report:
        _write_report(Path(args.report).expanduser().resolve(), report)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["ok"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
