import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILL = join(ROOT, "skills", "openai-aesthetic-images", "SKILL.md");

test("OpenAI aesthetic guidance defaults editorial assets to an authored composition", async () => {
  const content = await readFile(SKILL, "utf8");
  for (const phrase of [
    "Editorial hero / embed image",
    "The first family is the default for blog hero, card, embed, social-share, and launch-image requests.",
    "Visual thesis:",
    "Anchor:",
    "Frame pressure:",
    "Atmosphere:",
    "confident editorial framing",
    "foreground/background relationship",
  ]) assert.match(content, new RegExp(phrase.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")));
});

test("OpenAI aesthetic guidance keeps bare abstract light fields opt-in", async () => {
  const content = await readFile(SKILL, "utf8");
  assert.match(content, /appropriate only when the user explicitly asks for a background, wallpaper, or deliberately non-representational treatment/i);
  assert.match(content, /A palette-only brief produces generic results/i);
  assert.match(content, /Never compensate by adding more colors, blobs, ribbons, or texture/i);
});
