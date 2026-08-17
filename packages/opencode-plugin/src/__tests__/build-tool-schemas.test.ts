/// <reference path="../bun-test.d.ts" />

import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ensureAftBridgeDist } from "../../scripts/build-tool-schemas.js";

test("builds missing or stale aft-bridge dist and reuses a fresh build", async () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "aft-tool-schema-build-"));
  const bridgeRoot = join(repoRoot, "packages", "aft-bridge");
  mkdirSync(join(bridgeRoot, "src"), { recursive: true });
  writeFileSync(
    join(bridgeRoot, "package.json"),
    JSON.stringify({ private: true, scripts: { build: "bun run build.ts" } }),
  );
  writeFileSync(
    join(bridgeRoot, "build.ts"),
    'import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"; const count = existsSync("build-count") ? Number(readFileSync("build-count", "utf8")) + 1 : 1; writeFileSync("build-count", String(count)); mkdirSync("dist", { recursive: true }); writeFileSync("dist/index.js", "built");\n',
  );
  const sourcePath = join(bridgeRoot, "src", "index.ts");
  writeFileSync(sourcePath, "export {};\n");

  try {
    await ensureAftBridgeDist(repoRoot);
    expect(readFileSync(join(bridgeRoot, "dist", "index.js"), "utf8")).toBe("built");
    expect(readFileSync(join(bridgeRoot, "build-count"), "utf8")).toBe("1");

    await ensureAftBridgeDist(repoRoot);
    expect(readFileSync(join(bridgeRoot, "build-count"), "utf8")).toBe("1");

    const newer = new Date(Date.now() + 2_000);
    utimesSync(sourcePath, newer, newer);
    await ensureAftBridgeDist(repoRoot);
    expect(readFileSync(join(bridgeRoot, "build-count"), "utf8")).toBe("2");
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
