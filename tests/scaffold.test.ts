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
      capabilities: ["subtitles", "meta"],
      advanced: true,
      sdkVersion: "^0.4.0",
    });

    expect(existsSync(path.join(target, "package.json"))).toBe(true);
    expect(existsSync(path.join(target, "src", "plugin.ts"))).toBe(true);
    expect(existsSync(path.join(target, "src", "server.ts"))).toBe(true);
    expect(existsSync(path.join(target, ".gitignore"))).toBe(true);

    const packageJson = await readFile(
      path.join(target, "package.json"),
      "utf8",
    );
    expect(packageJson).toContain('"@streamfox/plugin-sdk": "^0.4.0"');
    expect(packageJson).not.toContain("prettier");
    expect(packageJson).not.toContain('"format"');
    expect(packageJson).not.toContain('"format:check"');

    const pluginFile = await readFile(
      path.join(target, "src", "plugin.ts"),
      "utf8",
    );
    expect(pluginFile).toContain("definePlugin");
    expect(pluginFile).toContain('from "@streamfox/plugin-sdk"');

    const serverFile = await readFile(
      path.join(target, "src", "server.ts"),
      "utf8",
    );
    expect(serverFile).toContain('from "@streamfox/plugin-sdk"');
    expect(serverFile).toContain("installURL");
    expect(serverFile).toContain("launchURL");
    expect(serverFile).not.toContain("manifest.json");

    const testFile = await readFile(
      path.join(target, "test", "plugin.test.ts"),
      "utf8",
    );
    expect(testFile).toContain('from "@streamfox/plugin-sdk"');

    const readme = await readFile(path.join(target, "README.md"), "utf8");
    expect(readme).toContain("GET /manifest");
    expect(readme).toContain("GET /studio-config");
    expect(readme).toContain("GET /meta/:mediaType/:itemID");
    expect(readme).toContain("GET /subtitles/:mediaType/:itemID");
    expect(readme).toContain("Capabilities: `meta, subtitles`");
    expect(readme).toContain("supportedTransports");
    expect(readme).toContain("Advanced template: `enabled`");
    expect(readme).toContain("npm run check");
    expect(readme).not.toContain("npm run format");
  });

  it("uses multiSelect installer settings when subtitles capability is selected", async () => {
    const base = mkdtempSync(path.join(tmpdir(), "create-streamfox-plugin-"));
    const target = path.join(base, "demo-subtitles");

    await scaffoldProject({
      targetDir: target,
      projectName: "demo-subtitles",
      language: "ts",
      capabilities: ["meta", "subtitles"],
      advanced: true,
      sdkVersion: "^0.4.0",
    });

    const pluginFile = await readFile(
      path.join(target, "src", "plugin.ts"),
      "utf8",
    );
    expect(pluginFile).toContain('settings.multiSelect("languages"');
    expect(pluginFile).toContain("Array.isArray(settings?.languages)");
    expect(pluginFile).toContain("void settings?.includeHI");
    expect(pluginFile).toContain("configurationRequired: true");
  });

  it("generates catalog scaffolds with shared filter sets and helper builders", async () => {
    const base = mkdtempSync(path.join(tmpdir(), "create-streamfox-plugin-"));
    const target = path.join(base, "demo-catalog");

    await scaffoldProject({
      targetDir: target,
      projectName: "demo-catalog",
      language: "ts",
      capabilities: ["catalog"],
      advanced: true,
      sdkVersion: "^0.4.0",
    });

    const pluginFile = await readFile(
      path.join(target, "src", "plugin.ts"),
      "utf8",
    );

    expect(pluginFile).toContain("definePlugin, filters");
    expect(pluginFile).toContain("sorts");
    expect(pluginFile).toContain("filterSets:");
    expect(pluginFile).toContain("sortSets:");
    expect(pluginFile).toContain("commonCatalogFilters");
    expect(pluginFile).toContain('id: "browse"');
    expect(pluginFile).toContain('filters.select("language"');
    expect(pluginFile).toContain('filters.range("year")');
    expect(pluginFile).toContain('sorts.desc("popularity"');
    expect(pluginFile).toContain('sortSetRefs: ["browseSorts"]');

    const readme = await readFile(path.join(target, "README.md"), "utf8");
    expect(readme).toContain("GET /catalog/movie/browse?language=ja");
    expect(readme).toContain("GET /catalog/movie/browse?year=2024");
    expect(readme).toContain("GET /catalog/movie/browse?orderBy=popular");
    expect(readme).toContain("filterSets");
    expect(readme).toContain("filters.*");
    expect(readme).toContain("sortSets");
    expect(readme).toContain("sorts.*");
  });
});
