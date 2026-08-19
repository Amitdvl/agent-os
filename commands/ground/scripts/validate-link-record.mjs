import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const URL_SHAPED = /(?:https?:\/\/|www\.)/i;
const LOCAL_PATH = /(?:^|[\s("'])(?:\/tmp\/|\/private\/|[^\s]*remote-attachments\/|[^\s]*codex-remote-attachments\/)/i;
const SIGNED_URL = /(?:x-amz-signature|x-amz-credential|x-amz-expires|[?&](?:signature|expires|token)=)/i;

function normalizeTarget(value) {
  if (typeof value !== "string" || value.length === 0) return "";
  try {
    const url = new URL(value);
    url.hostname = url.hostname.toLowerCase();
    if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return value.trim();
  }
}

function normalizeId(value) {
  return String(value ?? "").toLowerCase().replaceAll("-", "");
}

function push(errors, code, message, sourceId, blockId) {
  errors.push({ code, message, ...(sourceId ? { source_id: sourceId } : {}), ...(blockId ? { block_id: blockId } : {}) });
}

export function validateLinkRecord(input) {
  const errors = [];
  const expected = Array.isArray(input?.expected_sources) ? input.expected_sources : [];
  const blocks = Array.isArray(input?.record?.blocks) ? input.record.blocks : [];
  const segments = blocks.flatMap((block) =>
    (Array.isArray(block.rich_text) ? block.rich_text : []).map((segment) => ({ ...segment, block })),
  );
  const represented = segments.filter((segment) => typeof segment.source_id === "string" && segment.source_id.length > 0);
  const expectedIds = new Set(expected.map((source) => source.id));
  const valueCardIndex = blocks.findIndex((block) => /^value card$/i.test(String(block.plain_text ?? "").trim()));

  if (expected.length === 0) push(errors, "missing_manifest", "Expected-source manifest is empty.");
  if (expectedIds.size !== expected.length) push(errors, "duplicate_manifest_id", "Expected-source IDs must be unique.");
  if (represented.length !== expected.length) {
    push(errors, "source_count_mismatch", `Expected ${expected.length} source links but found ${represented.length}.`);
  }
  const representedBlockIds = represented.map((segment) => segment.block.id);
  if (new Set(representedBlockIds).size !== representedBlockIds.length) {
    push(errors, "shared_source_block", "Each represented source must occupy its own block.");
  }

  for (const segment of represented) {
    if (!expectedIds.has(segment.source_id)) {
      push(errors, "unexpected_source_link", `Unexpected source link ${segment.source_id}.`, segment.source_id, segment.block.id);
    }
  }

  for (const source of expected) {
    if (!['metadata', 'supporting'].includes(source.placement)) {
      push(errors, "missing_source_placement", `Source ${source.id} must declare metadata or supporting placement.`, source.id);
    }
    const matches = represented.filter((segment) => segment.source_id === source.id);
    if (matches.length !== 1) {
      push(errors, "source_bijection_failed", `Source ${source.id} must have exactly one represented link; found ${matches.length}.`, source.id);
      continue;
    }
    const segment = matches[0];
    const blockIndex = blocks.findIndex((block) => block.id === segment.block.id);
    if (source.placement === "metadata" && (valueCardIndex < 0 || blockIndex >= valueCardIndex)) {
      push(errors, "metadata_link_placement", `Primary source ${source.id} must appear above the Value card.`, source.id, segment.block.id);
    }
    if (source.placement === "supporting" && valueCardIndex >= 0 && blockIndex <= valueCardIndex) {
      push(errors, "supporting_link_placement", `Supporting source ${source.id} must appear after the Value card.`, source.id, segment.block.id);
    }
    const label = String(segment.plain_text ?? "");
    const href = String(segment.href ?? "");
    if (label !== source.label) push(errors, "label_mismatch", `Saved label does not match ${source.id}.`, source.id, segment.block.id);
    if (URL_SHAPED.test(label)) push(errors, "url_shaped_label", `Source ${source.id} uses a URL-shaped visible label.`, source.id, segment.block.id);
    if (!href) push(errors, "missing_href", `Source ${source.id} has no saved href.`, source.id, segment.block.id);
    if (normalizeTarget(href) !== normalizeTarget(source.target)) {
      push(errors, "target_mismatch", `Saved href does not match the expected target for ${source.id}.`, source.id, segment.block.id);
    }
    if (source.verification?.status !== "resolved") {
      push(errors, "target_unresolved", `Source ${source.id} was not resolved successfully.`, source.id, segment.block.id);
    } else {
      const accepted = (source.accepted_resolved_targets ?? [source.target]).map(normalizeTarget);
      if (!accepted.includes(normalizeTarget(source.verification.resolved_target))) {
        push(errors, "resolved_target_mismatch", `Resolved target is not an accepted identity for ${source.id}.`, source.id, segment.block.id);
      }
    }

    if (source.kind === "notion_page" || source.kind === "notion_block") {
      if (source.verification?.object !== source.kind.replace("notion_", "")) {
        push(errors, "wrong_notion_object", `Resolved Notion object kind is wrong for ${source.id}.`, source.id, segment.block.id);
      }
      if (normalizeId(source.verification?.id) !== normalizeId(source.object_id)) {
        push(errors, "wrong_notion_id", `Resolved Notion object ID is wrong for ${source.id}.`, source.id, segment.block.id);
      }
      if (source.verification?.archived === true || source.verification?.in_trash === true) {
        push(errors, "archived_target", `Notion target is archived or in trash for ${source.id}.`, source.id, segment.block.id);
      }
    }

    if (source.kind === "file") {
      const files = blocks.filter((block) => block.type === "file" && normalizeId(block.id) === normalizeId(source.block_id));
      if (files.length !== 1) {
        push(errors, "file_block_missing", `Expected exactly one file block for ${source.id}; found ${files.length}.`, source.id);
      } else {
        const file = files[0];
        if (file.archived === true || file.in_trash === true) push(errors, "archived_file", `File block is archived for ${source.id}.`, source.id, file.id);
        if (file.file?.name !== source.file_name) push(errors, "file_name_mismatch", `File-block name is wrong for ${source.id}.`, source.id, file.id);
        if (Array.isArray(file.file?.caption) && file.file.caption.length > 0) push(errors, "duplicate_file_caption", `File block has a redundant caption for ${source.id}.`, source.id, file.id);
        const fragment = href.includes("#") ? href.split("#").at(-1) : "";
        if (normalizeId(fragment) !== normalizeId(source.block_id)) push(errors, "wrong_file_anchor", `File metadata link targets the wrong block for ${source.id}.`, source.id, segment.block.id);
      }
      if (SIGNED_URL.test(href)) push(errors, "signed_file_url", `File source ${source.id} uses an expiring signed URL.`, source.id, segment.block.id);
    }
  }

  for (const block of blocks) {
    const headingText = String(block.plain_text ?? "").trim().toLowerCase();
    if (/^heading_\d$/.test(block.type) && headingText === "source") {
      push(errors, "redundant_source_heading", "Record contains a redundant Source heading.", undefined, block.id);
    }
    for (const segment of Array.isArray(block.rich_text) ? block.rich_text : []) {
      const text = String(segment.plain_text ?? "");
      const href = String(segment.href ?? "");
      if (segment.code !== true && URL_SHAPED.test(text) && !href) push(errors, "bare_url", "URL-shaped text has no href.", segment.source_id, block.id);
      if (href && URL_SHAPED.test(text)) push(errors, "url_shaped_label", "Visible link label is URL-shaped.", segment.source_id, block.id);
      if (LOCAL_PATH.test(text) || LOCAL_PATH.test(href)) push(errors, "local_path", "Record exposes a local or transport path.", segment.source_id, block.id);
      if (SIGNED_URL.test(href)) push(errors, "signed_url", "Record contains an expiring signed URL.", segment.source_id, block.id);
      if (/Evidence pointers:/i.test(text)) push(errors, "source_metadata_dump", "Source line contains evidence-pointer metadata filler.", segment.source_id, block.id);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    stats: { expected_sources: expected.length, represented_source_links: represented.length, blocks: blocks.length },
  };
}

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error("Usage: node validate-link-record.mjs <record.json>");
  const input = JSON.parse(await readFile(path, "utf8"));
  const result = validateLinkRecord(input);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
