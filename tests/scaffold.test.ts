import { existsSync, mkdtempSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { scaffoldProject } from "../src/scaffold";

describe("scaffoldProject", () => {
  it("creates a TypeScript scaffold with registry sdk dependency", async () => {
    const base = mkdtempSync(path.join(tmpdir(), "create-media-plugin-"));
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
    expect(packageJson).toContain("\"@streamhub/media-plugin-sdk\": \"^0.1.0\"");

    const pluginFile = await readFile(path.join(target, "src", "plugin.ts"), "utf8");
    expect(pluginFile).toContain("definePlugin");
  });

  it("uses multiSelect installer settings for subtitles preset", async () => {
    const base = mkdtempSync(path.join(tmpdir(), "create-media-plugin-"));
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
