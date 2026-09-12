#!/usr/bin/env python3
"""Build a validated Markdown/PDF pair into a staging or delivery directory."""
from __future__ import annotations

import argparse
import html
import json
import os
from pathlib import Path
import re
import shutil
import tempfile
from urllib.parse import urlsplit

import reportlab
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph


def inline(value: str) -> tuple[str, str]:
    """Parse a deliberately small Markdown subset without silently losing markup."""
    rendered, plain = [], []
    i = 0
    while i < len(value):
        if value[i] == '[':
            match = re.match(r'\[([^\[\]\n]+)\]\((https?://[^\s()]+)\)', value[i:])
            if not match or not urlsplit(match[2]).netloc:
                raise ValueError('Only inline HTTP(S) links are supported')
            label, text = inline(match[1])
            rendered.append(f'<link href="{html.escape(match[2], quote=True)}" color="#245887">{label}</link>')
            plain.append(text)
            i += len(match[0])
        elif value[i] in '*`':
            marker = '**' if value.startswith('**', i) else value[i]
            end = value.find(marker, i + len(marker))
            if end < 0 or end == i + len(marker):
                raise ValueError('Unmatched or empty emphasis/code delimiter')
            content = value[i + len(marker):end]
            if marker == '`':
                rendered.append('<font name="Pamphlet">' + html.escape(content) + '</font>')
                plain.append(content)
            else:
                body, text = inline(content)
                tag = 'b' if marker == '**' else 'i'
                rendered.append(f'<{tag}>{body}</{tag}>')
                plain.append(text)
            i = end + len(marker)
        else:
            tail = value[i:]
            if (value[i] == '\\' or tail.startswith(('![', '~~'))
                    or re.match(r'_[^_\s].*?_(?:\W|$)', tail)
                    or re.match(r'</?[A-Za-z!]', tail) or ord(value[i]) < 32):
                raise ValueError(f'Unsupported Markdown character: {value[i]!r}')
            rendered.append(html.escape(value[i]))
            plain.append(value[i])
            i += 1
    return ''.join(rendered), ''.join(plain)


def parse(markdown: str) -> tuple[list[tuple[str, str, str]], int]:
    lines = markdown.strip().splitlines()
    if not lines or not lines[0].startswith('# '):
        raise ValueError('Manuscript must begin with exactly one # title')
    blocks = []
    body = []
    sources = False
    pending = []

    def add(kind, value):
        rich, plain = inline(value)
        blocks.append((kind, rich, plain))
        if kind != 'title' and not sources:
            body.append(plain)

    def flush():
        if pending:
            add('body', ' '.join(pending))
            pending.clear()

    for index, line in enumerate(lines):
        if line != line.lstrip() or line.endswith('  '):
            raise ValueError('Indented blocks and hard line breaks are unsupported')
        if not line:
            flush()
            continue
        heading = re.fullmatch(r'(#{1,3}) (.+)', line)
        if heading:
            flush()
            level, value = len(heading[1]), heading[2]
            if level == 1 and index != 0:
                raise ValueError('Only the first heading can be level 1')
            if level == 2 and value.casefold() in {'sources', 'references'}:
                if sources:
                    raise ValueError('Use only one terminal Sources or References section')
                sources = True
            elif sources:
                raise ValueError('Sources/References must be the terminal section without subheadings')
            add('title' if level == 1 else f'h{level}', value)
        elif re.match(r'([-+*] |\d+\. )', line):
            flush()
            match = re.match(r'([-+*]|\d+\.) (.+)', line)
            if not match:
                raise ValueError('Empty list item')
            add('ordered:' + match[1] if match[1][0].isdigit() else 'list', match[2])
        elif line.startswith(('#', '>', '|', '---', '```', '~~~')) or re.fullmatch(r'=+', line) or re.fullmatch(r':?-{3,}:?(?:\s*\|\s*:?-{3,}:?)+\s*', line):
            raise ValueError('Unsupported Markdown block')
        else:
            pending.append(line)
    flush()
    count = len(re.findall(r"\b\w+(?:[’'-]\w+)*\b", ' '.join(body)))
    if not 300 <= count <= 1000:
        raise ValueError(f'Explanatory body has {count} words; required range is 300–1,000')
    return blocks, count


def render_pdf(path: Path, blocks):
    font_dir = Path(reportlab.__file__).parent / 'fonts'
    for name, file in [('Pamphlet', 'Vera.ttf'), ('Pamphlet-Bold', 'VeraBd.ttf'), ('Pamphlet-Italic', 'VeraIt.ttf'), ('Pamphlet-BoldItalic', 'VeraBI.ttf')]:
        if name not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont(name, str(font_dir / file)))
    pdfmetrics.registerFontFamily('Pamphlet', normal='Pamphlet', bold='Pamphlet-Bold', italic='Pamphlet-Italic', boldItalic='Pamphlet-BoldItalic')
    supported = pdfmetrics.getFont('Pamphlet').face.charToGlyph
    for _, _, plain in blocks:
        missing = {char for char in plain if ord(char) not in supported}
        if missing:
            raise ValueError(f'Bundled font does not support characters: {sorted(missing)!r}')
    base = ParagraphStyle('body', fontName='Pamphlet', fontSize=10.5, leading=16, textColor=colors.HexColor('#20242A'), spaceAfter=9, alignment=TA_LEFT)
    styles = {'body': base, 'list': ParagraphStyle('list', parent=base, leftIndent=13, bulletIndent=0),
              'title': ParagraphStyle('title', parent=base, fontName='Pamphlet-Bold', fontSize=23, leading=29, spaceAfter=20),
              'h2': ParagraphStyle('h2', parent=base, fontName='Pamphlet-Bold', fontSize=13, leading=19, spaceBefore=12, keepWithNext=True),
              'h3': ParagraphStyle('h3', parent=base, fontName='Pamphlet-Bold', fontSize=11, leading=17, spaceBefore=8, keepWithNext=True)}
    flow = [Paragraph(rich, styles['list' if kind.startswith('ordered:') else kind],
                      bulletText=kind.split(':', 1)[1] if kind.startswith('ordered:') else '•' if kind == 'list' else None)
            for kind, rich, _ in blocks]
    SimpleDocTemplate(str(path), pagesize=(432, 612), rightMargin=42, leftMargin=42, topMargin=40, bottomMargin=40,
                      title=blocks[0][2], author='', invariant=1).build(flow)
    validate_pdf(path, blocks)


def validate_pdf(path: Path, blocks):
    reader = PdfReader(str(path), strict=True)
    if not reader.pages:
        raise ValueError('PDF has no pages')
    text = re.sub(r'\s+', '', '\n'.join(page.extract_text() or '' for page in reader.pages))
    position = 0
    for _, _, plain in blocks:
        expected = re.sub(r'\s+', '', plain)
        found = text.find(expected, position)
        if found < 0:
            raise ValueError(f'PDF text verification failed for: {plain[:60]}')
        position = found + len(expected)


def build(source: Path, output_dir: Path, stem: str | None = None, publish=False):
    markdown = source.read_text(encoding='utf-8')
    blocks, count = parse(markdown)
    stem = stem or re.sub(r'[^a-z0-9]+', '-', blocks[0][2].lower()).strip('-') or 'pamphlet'
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]{0,99}', stem):
        raise ValueError('Stem must be 1–100 ASCII letters, numbers, underscores or hyphens')
    output_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.pamphlet-', dir=output_dir) as temporary:
        work = Path(temporary)
        md, pdf = work / 'manuscript.md', work / 'pamphlet.pdf'
        if publish:
            shutil.copyfile(source, md)
        else:
            md.write_text(markdown.rstrip() + '\n', encoding='utf-8')
        if publish:
            # Publish the exact visually inspected PDF, including across filesystems.
            shutil.copyfile(source.with_suffix('.pdf'), pdf)
            validate_pdf(pdf, blocks)
        else:
            render_pdf(pdf, blocks)
        for suffix in range(1, 10001):
            name = stem if suffix == 1 else f'{stem}-{suffix}'
            targets = [output_dir / f'{name}.md', output_dir / f'{name}.pdf']
            created = []
            try:
                # Hard links provide exclusive publication without clobbering existing files.
                for candidate, target in zip((md, pdf), targets):
                    os.link(candidate, target)
                    created.append(target)
                validate_pdf(targets[1], blocks)
                if targets[0].read_bytes() != md.read_bytes():
                    raise ValueError('Delivered Markdown verification failed')
                return {'markdown': str(targets[0].resolve()), 'pdf': str(targets[1].resolve()), 'body_words': count}
            except FileExistsError:
                for target in created:
                    target.unlink()
            except BaseException:
                for target in created:
                    target.unlink()
                raise
        raise ValueError('No available filename after 10,000 collision attempts')


def main():
    parser = argparse.ArgumentParser(description='Validate 300–1,000 body words and build a collision-safe Markdown/PDF pair. Use a temporary --output-dir for visual QA before delivery, then --publish with the staged .md to copy its verified sibling PDF without rerendering. Requires reportlab and pypdf. Title and terminal ## Sources/References are excluded from the count; all other headings and list text count. Supports headings 1–3, paragraphs, flat lists, *italic*, **bold**, `code`, and [label](https://url) links. Other Markdown is rejected. Links cannot contain spaces or parentheses. Rendering uses bundled Bitstream Vera: unsupported characters/languages fail explicitly; no transliteration. Handled publication failures roll back both files; abrupt process termination is not transactionally recoverable.')
    parser.add_argument('source', type=Path, help='UTF-8 Markdown manuscript')
    parser.add_argument('--output-dir', required=True, type=Path, help='Staging or final artifact directory')
    parser.add_argument('--stem', help='Optional ASCII filename stem; collisions receive -2, -3, etc.')
    parser.add_argument('--publish', action='store_true', help='Copy SOURCE.md and its sibling SOURCE.pdf exactly after visual QA; verify the delivered pair, without rerendering')
    args = parser.parse_args()
    try:
        print(json.dumps(build(args.source, args.output_dir, args.stem, publish=args.publish), indent=2))
    except (ValueError, OSError) as error:
        parser.exit(1, f'Error: {error}\n')


if __name__ == '__main__':
    main()
