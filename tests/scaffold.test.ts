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
      sdkVersion: "^0.6.2",
    });

    expect(existsSync(path.join(target, "package.json"))).toBe(true);
    expect(existsSync(path.join(target, "src", "plugin.ts"))).toBe(true);
    expect(existsSync(path.join(target, "src", "server.ts"))).toBe(true);
    expect(existsSync(path.join(target, ".gitignore"))).toBe(true);

    const packageJson = await readFile(
      path.join(target, "package.json"),
      "utf8",
    );
    expect(packageJson).toContain('"@streamfox/plugin-sdk": "^0.6.2"');
    expect(packageJson).not.toContain("prettier");
    expect(packageJson).not.toContain('"format"');
    expect(packageJson).not.toContain('"format:check"');

    const pluginFile = await readFile(
      path.join(target, "src", "plugin.ts"),
      "utf8",
    );
    expect(pluginFile).toContain("definePlugin");
    expect(pluginFile).toContain('from "@streamfox/plugin-sdk"');
    expect(pluginFile).toContain("includes: [");
    expect(pluginFile).toContain('"cast"');
    expect(pluginFile).toContain('"directors"');
    expect(pluginFile).toContain('"writers"');
    expect(pluginFile).toContain('"behaviorHints"');
    expect(pluginFile).toContain("similarItems:");
    expect(pluginFile).toContain('id: ids.imdb("tt1254207")');
    expect(pluginFile).toContain('id: ids.imdb("tt0472033")');
    expect(pluginFile).toContain('id: ids.video("main")');
    expect(pluginFile).toContain("logoURL:");
    expect(pluginFile).toContain("background:");
    expect(pluginFile).toContain("dvdReleaseAt:");
    expect(pluginFile).toContain("runtime:");
    expect(pluginFile).toContain("yearLabel:");
    expect(pluginFile).toContain("imdbRating:");
    expect(pluginFile).toContain("sourceRatings:");
    expect(pluginFile).toContain("popularityBySource:");
    expect(pluginFile).toContain("firstAiredAt:");
    expect(pluginFile).toContain("rating:");

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
    expect(readme).toContain("Rich Meta Model");
    expect(readme).toContain("behaviorHints");
    expect(readme).toContain("firstAiredAt");
    expect(readme).toContain("imdbRating");
    expect(readme).toContain("sourceRatings");
    expect(readme).toContain("typed ID helpers");
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
      sdkVersion: "^0.6.2",
    });

    const pluginFile = await readFile(
      path.join(target, "src", "plugin.ts"),
      "utf8",
    );
    expect(pluginFile).toContain("definePlugin, filters, ids, settings");
    expect(pluginFile).toContain('settings.multiSelect("languages"');
    expect(pluginFile).toContain('filters.select("source"');
    expect(pluginFile).toContain('filters.toggle("hearingImpaired"');
    expect(pluginFile).toContain("isRequired: true");
    expect(pluginFile).toContain("request.filters?.find");
    expect(pluginFile).toContain("Array.isArray(settings?.languages)");
    expect(pluginFile).toContain("void settings?.includeHI");
    expect(pluginFile).toContain("configuration: {");
    expect(pluginFile).toContain("required: true");
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
      sdkVersion: "^0.6.2",
    });

    const pluginFile = await readFile(
      path.join(target, "src", "plugin.ts"),
      "utf8",
    );

    expect(pluginFile).toContain("definePlugin, filters, sorts, ids, settings");
    expect(pluginFile).toContain("sorts");
    expect(pluginFile).toContain("filterSets:");
    expect(pluginFile).toContain("sortSets:");
    expect(pluginFile).toContain("commonCatalogFilters");
    expect(pluginFile).toContain('id: ids.catalog("browse")');
    expect(pluginFile).toContain('id: ids.catalog("episodes")');
    expect(pluginFile).toContain('filters.select("language"');
    expect(pluginFile).toContain("isRequired: true");
    expect(pluginFile).toContain('filters.intOrRange("year", { index: 2 })');
    expect(pluginFile).toContain('filters.number("season"');
    expect(pluginFile).toContain('sorts.desc("popularity"');
    expect(pluginFile).toContain('sortSetRefs: ["browseSorts"]');

    const readme = await readFile(path.join(target, "README.md"), "utf8");
    expect(readme).toContain(
      "GET /catalog/movie/browse?genre=action&language=ja",
    );
    expect(readme).toContain(
      "GET /catalog/movie/browse?genre=action&year=2024",
    );
    expect(readme).toContain(
      "GET /catalog/movie/browse?genre=action&year=2000..2024",
    );
    expect(readme).toContain(
      "GET /catalog/movie/browse?genre=action&orderBy=popular",
    );
    expect(readme).toContain("GET /catalog/series/episodes?season=1");
    expect(readme).toContain(
      "GET /catalog/series/episodes` to return all episodes when no season is provided",
    );
    expect(readme).toContain("isRequired");
    expect(readme).toContain("index");
    expect(readme).toContain("GET /stream/movie/tt0133093?quality=1080p");
    expect(readme).toContain(
      "GET /subtitles/movie/tt0133093?source=opensubtitles",
    );
    expect(readme).toContain("filterSets");
    expect(readme).toContain("filters.*");
    expect(readme).toContain("sortSets");
    expect(readme).toContain("sorts.*");
  });

  it("generates minimal stream scaffold when advanced mode is disabled", async () => {
    const base = mkdtempSync(path.join(tmpdir(), "create-streamfox-plugin-"));
    const target = path.join(base, "demo-stream");

    await scaffoldProject({
      targetDir: target,
      projectName: "demo-stream",
      language: "ts",
      capabilities: ["stream"],
      advanced: false,
      sdkVersion: "^0.6.2",
    });

    const pluginFile = await readFile(
      path.join(target, "src", "plugin.ts"),
      "utf8",
    );

    expect(pluginFile).toContain('import { definePlugin, ids } from "@streamfox/plugin-sdk"');
    expect(pluginFile).toContain("mediaType: \"movie\"");
    expect(pluginFile).toContain("transport: { kind: \"http\"");
    expect(pluginFile).not.toContain("supportedTransports");
    expect(pluginFile).not.toContain("settings.");
    expect(pluginFile).not.toContain("filters.");
  });
});
