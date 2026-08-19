import test from "node:test";
import assert from "node:assert/strict";

import { validateLinkRecord } from "../commands/ground/scripts/validate-link-record.mjs";

const external = {
  id: "video",
  kind: "external",
  placement: "metadata",
  label: "Source: Watch the original video ↗",
  target: "https://example.com/watch?v=123",
  verification: { status: "resolved", resolved_target: "https://example.com/watch?v=123" },
};

function recordFor(sources = [external]) {
  const metadata = sources.filter((source) => source.placement === "metadata");
  const supporting = sources.filter((source) => source.placement === "supporting");
  return {
    expected_sources: sources,
    record: {
      blocks: [
        ...metadata.map((source) => ({ id: `metadata-${source.id}`, type: "paragraph", plain_text: "Status: Grounded", rich_text: [{ plain_text: source.label, href: source.target, source_id: source.id }] })),
        { id: "value-card", type: "heading_2", plain_text: "Value card", rich_text: [{ plain_text: "Value card", href: null }] },
        ...(supporting.length > 0 ? [{ id: "supporting-heading", type: "heading_2", plain_text: "Supporting research", rich_text: [{ plain_text: "Supporting research", href: null }] }] : []),
        ...supporting.map((source) => ({ id: `supporting-${source.id}`, type: "bulleted_list_item", plain_text: source.label, rich_text: [{ plain_text: source.label, href: source.target, source_id: source.id }] })),
      ],
    },
  };
}

test("accepts a resolved titled external source", () => {
  assert.equal(validateLinkRecord(recordFor()).ok, true);
});

test("accepts a bijection of multiple external sources", () => {
  const second = { ...external, id: "article", placement: "supporting", label: "Source: Read the article ↗", target: "https://example.org/article", verification: { status: "resolved", resolved_target: "https://example.org/article" } };
  assert.equal(validateLinkRecord(recordFor([external, second])).ok, true);
});

test("accepts a resolved internal Notion page and block", () => {
  const page = { id: "page", kind: "notion_page", placement: "metadata", label: "Source: Open the Notion page ↗", target: "https://notion.so/p/abc", object_id: "abc", verification: { status: "resolved", resolved_target: "https://notion.so/p/abc", object: "page", id: "abc", archived: false } };
  const block = { id: "block", kind: "notion_block", placement: "supporting", label: "Source: Open the source block ↗", target: "https://notion.so/p/abc#def", object_id: "def", verification: { status: "resolved", resolved_target: "https://notion.so/p/abc#def", object: "block", id: "def", archived: false } };
  assert.equal(validateLinkRecord(recordFor([page, block])).ok, true);
});

test("rejects a mismatched or trashed internal Notion target", () => {
  const page = { id: "page", kind: "notion_page", placement: "metadata", label: "Source: Open the Notion page ↗", target: "https://notion.so/p/abc", object_id: "abc", verification: { status: "resolved", resolved_target: "https://notion.so/p/abc", object: "page", id: "wrong", in_trash: true } };
  const result = validateLinkRecord(recordFor([page]));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === "wrong_notion_id"));
  assert.ok(result.errors.some((error) => error.code === "archived_target"));
});

test("accepts a resolved uploaded file link and clean file block", () => {
  const file = { id: "file", kind: "file", placement: "metadata", label: "Source: Open original file ↗", target: "https://notion.so/p/abc#file-block", block_id: "file-block", file_name: "Founder Advice.md", verification: { status: "resolved", resolved_target: "https://notion.so/p/abc#file-block" } };
  const input = recordFor([file]);
  input.record.blocks.push({ id: "file-block", type: "file", plain_text: "Founder Advice.md", rich_text: [], file: { name: "Founder Advice.md", caption: [] }, archived: false });
  assert.equal(validateLinkRecord(input).ok, true);
});

const failures = [
  ["bare URL", (input) => input.record.blocks[0].rich_text.push({ plain_text: "https://example.net", href: null })],
  ["URL-shaped label", (input) => { input.expected_sources[0].label = "https://example.com/watch?v=123"; input.record.blocks[0].rich_text[0].plain_text = input.expected_sources[0].label; }],
  ["missing href", (input) => { input.record.blocks[0].rich_text[0].href = null; }],
  ["mismatched href", (input) => { input.record.blocks[0].rich_text[0].href = "https://wrong.example"; }],
  ["unresolved target", (input) => { input.expected_sources[0].verification.status = "unverified"; }],
  ["wrong resolved target", (input) => { input.expected_sources[0].verification.resolved_target = "https://wrong.example"; }],
  ["missing multi-source member", (input) => { input.expected_sources.push({ ...external, id: "two", label: "Source: Two ↗", target: "https://example.org/two", verification: { status: "resolved", resolved_target: "https://example.org/two" } }); }],
  ["duplicate represented source", (input) => { input.record.blocks[0].rich_text.push({ ...input.record.blocks[0].rich_text[0] }); }],
  ["missing source placement", (input) => { delete input.expected_sources[0].placement; }],
  ["primary source below Value card", (input) => { input.record.blocks.reverse(); }],
  ["local path", (input) => { input.record.blocks[0].rich_text.push({ plain_text: "/tmp/upload/source.md", href: null }); }],
  ["signed URL", (input) => { input.record.blocks[0].rich_text.push({ plain_text: "Temporary", href: "https://example.com/file?X-Amz-Signature=secret" }); }],
  ["redundant Source heading", (input) => { input.record.blocks.push({ id: "source", type: "heading_2", plain_text: "Source", rich_text: [] }); }],
  ["source metadata dump", (input) => { input.record.blocks[0].rich_text.push({ plain_text: "Evidence pointers: 00:10–00:20", href: null }); }],
];

for (const [name, mutate] of failures) {
  test(`rejects ${name}`, () => {
    const input = structuredClone(recordFor());
    mutate(input);
    assert.equal(validateLinkRecord(input).ok, false);
  });
}

test("rejects wrong and missing file blocks", () => {
  const file = { id: "file", kind: "file", placement: "metadata", label: "Source: Open original file ↗", target: "https://notion.so/p/abc#file-block", block_id: "file-block", file_name: "Founder Advice.md", verification: { status: "resolved", resolved_target: "https://notion.so/p/abc#file-block" } };
  const missing = recordFor([file]);
  assert.equal(validateLinkRecord(missing).ok, false);
  const wrong = recordFor([file]);
  wrong.record.blocks.push({ id: "file-block", type: "file", rich_text: [], file: { name: "transport-name.md", caption: ["duplicate"] } });
  assert.equal(validateLinkRecord(wrong).ok, false);
});
