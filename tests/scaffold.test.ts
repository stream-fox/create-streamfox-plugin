import { existsSync, mkdtempSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { scaffoldProject } from "../src/scaffold";

describe("scaffoldProject", () => {
  it("creates a TypeScript scaffold with registry sdk dependency", async () => {
    const base = mkdtempSync(path.join(tmpdir(), "create-streamfox-plugin-"));
    const target = path.join(base, "demo-plugin");

    await scaffoldProject({
      targetDir: target,
      projectName: "demo-plugin",
      language: "ts",
      preset: "subtitles",
      extraCapabilities: ["meta"],
      sdkVersion: "^0.1.0",
    });

    expect(existsSync(path.join(target, "package.json"))).toBe(true);
    expect(existsSync(path.join(target, "src", "plugin.ts"))).toBe(true);
    expect(existsSync(path.join(target, "src", "server.ts"))).toBe(true);

    const packageJson = await readFile(path.join(target, "package.json"), "utf8");
    expect(packageJson).toContain("\"@streamfox/plugin-sdk\": \"^0.1.0\"");

    const pluginFile = await readFile(path.join(target, "src", "plugin.ts"), "utf8");
    expect(pluginFile).toContain("definePlugin");
    expect(pluginFile).toContain('from "@streamfox/plugin-sdk"');

    const serverFile = await readFile(path.join(target, "src", "server.ts"), "utf8");
    expect(serverFile).toContain('from "@streamfox/plugin-sdk"');
    expect(serverFile).toContain('url.replace("/manifest", "/")');
    expect(serverFile).not.toContain("manifest.json");

    const testFile = await readFile(path.join(target, "test", "plugin.test.ts"), "utf8");
    expect(testFile).toContain('from "@streamfox/plugin-sdk"');

    const readme = await readFile(path.join(target, "README.md"), "utf8");
    expect(readme).toContain("GET /manifest");
    expect(readme).toContain("GET /studio-config");
    expect(readme).toContain("GET /meta/:mediaType/:itemID");
    expect(readme).toContain("GET /subtitles/:mediaType/:itemID");
  });

  it("uses multiSelect installer settings for subtitles preset", async () => {
    const base = mkdtempSync(path.join(tmpdir(), "create-streamfox-plugin-"));
    const target = path.join(base, "demo-subtitles");

    await scaffoldProject({
      targetDir: target,
      projectName: "demo-subtitles",
      language: "ts",
      preset: "subtitles",
      sdkVersion: "^0.1.0",
    });

    const pluginFile = await readFile(path.join(target, "src", "plugin.ts"), "utf8");
    expect(pluginFile).toContain('settings.multiSelect("languages"');
    expect(pluginFile).toContain("Array.isArray(settings.languages)");
  });
});
