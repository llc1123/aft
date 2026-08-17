/// <reference path="../bun-test.d.ts" />

import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildAftBridgeDist } from "../../scripts/build-tool-schemas.js";

test("builds aft-bridge before loading tool schema modules", async () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "aft-tool-schema-build-"));
  const bridgeRoot = join(repoRoot, "packages", "aft-bridge");
  mkdirSync(bridgeRoot, { recursive: true });
  writeFileSync(
    join(bridgeRoot, "package.json"),
    JSON.stringify({ private: true, scripts: { build: "bun run build.ts" } }),
  );
  writeFileSync(
    join(bridgeRoot, "build.ts"),
    'import { mkdirSync, writeFileSync } from "node:fs"; mkdirSync("dist", { recursive: true }); writeFileSync("dist/index.js", "built");\n',
  );

  try {
    await buildAftBridgeDist(repoRoot);
    expect(readFileSync(join(bridgeRoot, "dist", "index.js"), "utf8")).toBe("built");
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
