import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const CAPABILITIES = [
  "catalog",
  "meta",
  "stream",
  "subtitles",
  "plugin_catalog",
] as const;
export type Capability = (typeof CAPABILITIES)[number];
export type Language = "ts" | "js";
export const DEFAULT_CAPABILITIES: readonly Capability[] = ["meta"];
export const DEFAULT_SDK_VERSION = "^0.7.1";

export interface ScaffoldOptions {
  targetDir: string;
  projectName: string;
  language: Language;
  capabilities?: Capability[];
  advanced?: boolean;
  sdkVersion?: string;
}

function assertNeverCapability(value: never): never {
  throw new Error(`Unsupported capability '${String(value)}'`);
}

function sortedCapabilities(values: Capability[]): Capability[] {
  const unique = Array.from(new Set(values));
  return CAPABILITIES.filter((capability) => unique.includes(capability));
}

async function ensureTargetDoesNotExist(targetDir: string): Promise<void> {
  try {
    await access(targetDir);
    throw new Error(`Target directory already exists: ${targetDir}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }
    throw error;
  }
}

function makePackageJson(
  name: string,
  language: Language,
  sdkVersion: string,
): string {
  const scripts =
    language === "ts"
      ? {
          dev: "tsx watch src/server.ts",
          build: "tsc -p tsconfig.json",
          start: "node dist/server.js",
          test: "vitest run",
          typecheck: "tsc --noEmit",
        }
      : {
          dev: "node --watch src/server.js",
          build: 'echo "No build step for JavaScript template"',
          start: "node src/server.js",
          test: "vitest run",
        };

  const normalizedScripts = {
    ...scripts,
    check:
      language === "ts"
        ? "npm run typecheck && npm test && npm run build"
        : "npm test && npm run build",
  };

  const packageJson = {
    name,
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: normalizedScripts,
    dependencies: {
      "@streamfox/plugin-sdk": sdkVersion,
    },
    devDependencies:
      language === "ts"
        ? {
            "@types/node": "^24.6.0",
            tsx: "^4.20.5",
            typescript: "^5.9.2",
            vitest: "^2.1.9",
          }
        : {
            vitest: "^2.1.9",
          },
  };

  return `${JSON.stringify(packageJson, null, 2)}\n`;
}

function resourceBlock(capability: Capability, advanced: boolean): string {
  switch (capability) {
    case "catalog":
      if (!advanced) {
        return `catalog: {
      endpoints: [
        {
          id: ids.catalog("browse"),
          mediaType: "movie",
        },
      ],
      handler: async () => ({
        items: [],
      }),
    },`;
      }
      return `catalog: {
      filterSets: {
        commonCatalogFilters: [
          filters.multiSelect("genre", {
            label: "Genre",
            index: 0,
            isRequired: true,
            maxSelected: 3,
            optionsLimit: 50,
            dynamicOptions: {
              source: "provider:genres",
              cacheTTLSeconds: 86400,
              fallbackToLastKnown: true,
            },
            options: [
              { label: "Action", value: "action", aliases: ["Action"] },
              { label: "Drama", value: "drama" },
            ],
          }),
${
  advanced
    ? `          filters.select("language", {
            label: "Language",
            group: "regional",
            index: 1,
            options: [
              { label: "Japanese", value: "ja", aliases: ["Japanese (ja)"] },
              { label: "English", value: "en", aliases: ["English (en)"] },
            ],
          }),
`
    : ""
}        ],
      },
      sortSets: {
        browseSorts: [
          sorts.desc("popularity", {
            label: "Popular",
            aliases: ["popular"],
          }),
${
  advanced
    ? `          sorts.desc("year", {
            label: "Latest",
            aliases: ["latest"],
          }),
          sorts.choice("rating", {
            label: "Top Rated",
            aliases: ["top-rated"],
            directions: ["descending", "ascending"],
            defaultDirection: "descending",
          }),
`
    : ""
}        ],
      },
      endpoints: [
        {
          id: ids.catalog("browse"),
          name: "Browse",
          mediaTypes: ["movie"],
          filterSetRefs: ["commonCatalogFilters"],
          sortSetRefs: ["browseSorts"],
          filters: [filters.intOrRange("year", { index: 2 })],
          paging: { defaultPageSize: 20, maxPageSize: 50 },
          discovery: {
            mode: "curated",
            defaultSort: { key: "popularity", direction: "descending" },
            defaultFilters: { genre: "action" },
          },
        },
        {
          id: ids.catalog("episodes"),
          name: "Episodes",
          mediaTypes: ["series"],
          filters: [
            filters.number("season", {
              label: "Season",
              group: "episodes",
              index: 0,
              visibleWhen: {
                key: "mediaType",
                equalsAny: ["series"],
              },
            }),
          ],
          paging: { defaultPageSize: 50, maxPageSize: 200 },
        },
      ],
      handler: async () => ({
        items: [],
      }),
    },`;
    case "meta":
      if (!advanced) {
        return `meta: {
      mediaType: "movie",
      handler: async () => ({
        item: null,
      }),
    },`;
      }
      return `meta: {
      mediaTypes: ["movie"],
      embeddedVideoStreamStrategy: "merge",
      includes: [
        "videos",
        "links",
        "cast",
        "directors",
        "writers",
        "trailers",
        "awards",
        "popularity",
        "behaviorHints",
        "similarItems",
      ],
      handler: async () => ({
        item: ${
          advanced
            ? `{
          summary: {
            id: ids.imdb("tt1254207"),
            mediaType: "movie",
            title: "Big Buck Bunny",
            yearLabel: "2008",
            background: "https://images.example.com/big-buck-bunny-background.png",
            logoURL: "https://images.example.com/big-buck-bunny-logo.png",
            releasedAt: "2008-05-30T00:00:00.000Z",
            runtime: "10 min",
            slug: "movie/big-buck-bunny-1254207",
            imdbRating: 6.4,
            popularity: 0.91,
            sourceRatings: [
              { provider: "imdb", rating: 6.4 },
              { provider: "streamfox", rating: 6.8 },
            ],
            links: [],
          },
          background: "https://images.example.com/big-buck-bunny-background.png",
          releasedAt: "2008-05-30T00:00:00.000Z",
          dvdReleaseAt: "2008-06-15T00:00:00.000Z",
          logoURL: "https://images.example.com/big-buck-bunny-logo.png",
          runtime: "10 min",
          language: "English",
          country: "Netherlands",
          awards: "Open Movie project showcase",
          slug: "movie/big-buck-bunny-1254207",
          imdbRating: 6.4,
          popularity: 0.91,
          popularityBySource: {
            streamfox: 0.91,
            imdb: 0.78,
          },
          sourceRatings: [
            { provider: "imdb", rating: 6.4 },
            { provider: "streamfox", rating: 6.8 },
          ],
          cast: [
            { name: "Big Buck Bunny", character: "Hero" },
          ],
          directors: [
            { name: "Sacha Goedegebure" },
          ],
          writers: [
            { name: "Sacha Goedegebure" },
          ],
          defaultVideoID: ids.video("main"),
          behaviorHints: {
            defaultVideoId: ids.video("main"),
            hasScheduledVideos: false,
          },
          trailers: [{ transport: { kind: "youtube", id: "aqz-KE-bpKQ" } }],
          similarItems: [
            {
              id: ids.imdb("tt0472033"),
              mediaType: "movie",
              title: "Big Buck Bunny Short",
            },
          ],
          videos: [
            {
              id: ids.video("main"),
              title: "Main",
              releasedAt: "2008-05-30T00:00:00.000Z",
              firstAiredAt: "2008-05-30T00:00:00.000Z",
              rating: 6.4,
              streams: [{ transport: { kind: "http", url: "https://example.com/video.mp4" } }],
            },
          ],
        }`
            : "null"
        },
      }),
    },`;
    case "stream":
      if (!advanced) {
        return `stream: {
      mediaType: "movie",
      handler: async () => ({
        streams: [
          {
            transport: { kind: "http", url: "https://example.com/video.mp4", mode: "stream" },
          },
        ],
      }),
    },`;
      }
      return `stream: {
      mediaTypes: ["movie"],
      supportedTransports: ${advanced ? `["http", "torrent", "usenet", "archive", "youtube"]` : `["http"]`},
      filters: [
        filters.select("quality", {
          label: "Quality",
          index: 0,
          isRequired: true,
          options: [
            { label: "1080p", value: "1080p" },
            { label: "720p", value: "720p" },
          ],
        }),
        filters.toggle("hevc", {
          label: "HEVC",
          index: 1,
          defaultValue: false,
        }),
        filters.toggle("regionAware", {
          label: "Region Aware",
          index: 2,
          defaultValue: false,
        }),
        filters.select("providerRegion", {
          label: "Provider Region",
          index: 3,
          options: [
            { label: "United States", value: "US" },
            { label: "Greece", value: "GR" },
          ],
          enabledWhen: {
            key: "regionAware",
            equalsAny: [true],
          },
        }),
      ],
      handler: async (request) => {
        const qualityFilter = request.filters?.find((filter) => filter.key === "quality");
        const requestedQuality = qualityFilter?.value.kind === "string"
          ? qualityFilter.value.string
          : undefined;

        void requestedQuality;

        return {
          streams: [
            {
              transport: { kind: "http", url: "https://example.com/video.mp4", mode: "stream" },
              hints: {
                notWebReady: true,
                proxyHeaders: { request: { "User-Agent": "StreamFox" } },
              },
            },
${
  advanced
    ? `          {
            transport: { kind: "torrent", infoHash: "abcdef", peerDiscovery: ["tracker:udp://tracker.example.com:80"] },
            selection: { fileIndex: 0 },
          },
          {
            transport: { kind: "usenet", nzbURL: "https://example.com/file.nzb", servers: ["nntps://user:pass@news.example.com:563/4"] },
          },
          {
            transport: {
              kind: "archive",
              format: "zip",
              files: [{ url: "https://example.com/archive.zip", bytes: 1024 }],
            },
            selection: { fileMustInclude: "movie.mkv" },
          },
`
    : ""
}          ],
        };
      },
    },`;
    case "subtitles":
      if (!advanced) {
        return `subtitles: {
      handler: async () => ({
        subtitles: [],
      }),
    },`;
      }
      return `subtitles: {
      mediaTypes: ["movie", "episode"],
      defaultLanguages: ["en"],
      filters: [
        filters.select("source", {
          label: "Source",
          index: 0,
          isRequired: true,
          options: [
            { label: "OpenSubtitles", value: "opensubtitles" },
            { label: "SubDL", value: "subdl" },
          ],
        }),
        filters.toggle("hearingImpaired", {
          label: "Hearing Impaired",
          index: 1,
          defaultValue: false,
        }),
      ],
      handler: async (request, { settings }) => {
        const configuredLanguages = Array.isArray(settings?.languages)
          ? settings.languages
          : [];
        const languagePreferences =
          configuredLanguages.length > 0 ? configuredLanguages : (request.languagePreferences ?? []);
        const sourceFilter = request.filters?.find((filter) => filter.key === "source");
        const selectedSource = sourceFilter?.value.kind === "string"
          ? sourceFilter.value.string
          : undefined;

        void languagePreferences;
        void selectedSource;
        void settings?.includeHI;

        return {
          subtitles: [],
        };
      },
    },`;
    case "plugin_catalog":
      if (!advanced) {
        return `pluginCatalog: {
      endpoints: [
        {
          id: ids.catalog("featured"),
          name: "Featured",
          pluginKinds: ["catalog"],
        },
      ],
      handler: async () => ({
        plugins: [],
      }),
    },`;
      }
      return `pluginCatalog: {
      endpoints: [
        {
          id: ids.catalog("featured"),
          name: "Featured",
          pluginKinds: ["catalog", "meta", "stream", "subtitles"],
          tags: ["official"],
        },
      ],
      handler: async () => ({
        plugins: [
          {
            id: ids.plugin("com.example.recommended"),
            name: "Recommended",
            version: "1.0.0",
            pluginKinds: ["catalog", "meta"],
            distribution: {
              transport: "https",
              manifestURL: "https://plugins.example.com/recommended/manifest",
            },
            manifestSnapshot: {
              plugin: { id: ids.plugin("com.example.recommended") },
            },
          },
        ],
      }),
    },`;
  }

  return assertNeverCapability(capability);
}

function makeConfigurationBlock(capabilities: Capability[]): string {
  const subtitlesFields = capabilities.includes("subtitles")
    ? `      settings.multiSelect("languages", {
        label: "Languages",
        options: [
          { label: "English", value: "en" },
          { label: "Greek", value: "el" },
          { label: "Spanish", value: "es" },
        ],
        defaultValue: ["en"],
        maxSelected: 3,
      }),
      settings.checkbox("includeHI", {
        label: "Include hearing impaired",
        defaultValue: true,
      }),
`
    : "";

  return `  configuration: {
    required: true,
    fields: [
      settings.password("apiKey", {
        label: "API Key",
        required: true,
      }),
      settings.select("quality", {
        label: "Quality",
        options: [
          { label: "1080p", value: "1080p" },
          { label: "720p", value: "720p" },
        ],
        defaultValue: "1080p",
      }),
      settings.number("maxResults", {
        label: "Max Results",
        min: 1,
        max: 100,
        defaultValue: 20,
      }),
${subtitlesFields}    ],
  },
`;
}

function makePluginFile(
  name: string,
  capabilities: Capability[],
  advanced: boolean,
): string {
  const resources = capabilities
    .map((capability) => resourceBlock(capability, advanced))
    .join("\n    ");
  const configuration = makeConfigurationBlock(capabilities);
  const importSpec = [
    "definePlugin",
    advanced &&
    capabilities.some(
      (capability) =>
        capability === "catalog" ||
        capability === "stream" ||
        capability === "subtitles",
    )
      ? "filters"
      : undefined,
    advanced && capabilities.includes("catalog") ? "sorts" : undefined,
    "ids",
    advanced ? "settings" : undefined,
  ]
    .filter((value): value is string => Boolean(value))
    .join(", ");

  const advancedManifestBlocks = advanced
    ? `  safety: {
    adult: false,
    p2p: ${capabilities.includes("stream") ? "true" : "false"},
  },
  capabilityConstraints: {
    accountRequired: true,
    bandwidth: "${capabilities.includes("stream") ? "high" : "medium"}",
    geo: {
      allowedRegions: ["US", "GR"],
    },
  },
  qualitySignals: {
    providerSuccessRate: 0.98,
    timeoutRatio: 0.02,
    freshnessTimestamp: "2026-03-15T00:00:00.000Z",
  },
${configuration}`
    : "";

  return `import { ${importSpec} } from "@streamfox/plugin-sdk";

export const plugin = definePlugin({
  plugin: {
    id: ids.plugin("com.example.${name}"),
    name: "${name}",
    version: "0.1.0",
    description: "Generated StreamFox plugin scaffold",
  },
${advancedManifestBlocks}  resources: {
    ${resources}
  },
});
`;
}

function makeServerFile(language: Language): string {
  const pluginImport = language === "ts" ? "./plugin" : "./plugin.js";
  return `import { serve } from "@streamfox/plugin-sdk";
import { plugin } from "${pluginImport}";

const { url, installURL, launchURL } = await serve(plugin, {
  port: Number(process.env.PORT ?? 7000),
  integration: {
    installScheme: "streamfox",
    launchBaseURL: "https://streamfox.app/#",
    autoOpen: "none",
  },
});

console.log("Plugin manifest:", url);
console.log("Plugin installer deeplink:", installURL);
console.log("Plugin launch URL:", launchURL);
`;
}

function makeVitestFile(language: Language): string {
  const pluginImport = language === "ts" ? "../src/plugin" : "../src/plugin.js";
  return `import { describe, expect, it } from "vitest";
import { createServer } from "@streamfox/plugin-sdk";
import { plugin } from "${pluginImport}";

describe("scaffold smoke", () => {
  it("serves manifest and studio config", async () => {
    const app = createServer(plugin, { frontend: false });

    const manifestResponse = await app.request("/manifest");
    expect(manifestResponse.status).toBe(200);

    const studioResponse = await app.request("/studio-config");
    expect(studioResponse.status).toBe(200);
  });
});
`;
}

const tsConfig = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src"]
}
`;

const gitIgnore = `dist
node_modules
.DS_Store
.env
.env.*
coverage
`;

function makeReadme(
  projectName: string,
  capabilities: Capability[],
  advanced: boolean,
): string {
  const capabilitiesList = capabilities
    .map((capability) => `- ${capability}`)
    .join("\n");

  const endpointForCapability = (capability: Capability): string => {
    switch (capability) {
      case "catalog":
        return "/catalog/:mediaType/:catalogID";
      case "meta":
        return "/meta/:mediaType/:itemID";
      case "stream":
        return "/stream/:mediaType/:itemID";
      case "subtitles":
        return "/subtitles/:mediaType/:itemID";
      case "plugin_catalog":
        return "/plugin_catalog/:catalogID/:pluginKind";
    }

    return assertNeverCapability(capability);
  };

  const endpointLines = [
    "- GET /manifest",
    "- GET /studio-config",
    ...capabilities.map(
      (capability) => `- GET ${endpointForCapability(capability)}`,
    ),
  ].join("\n");

  if (!advanced) {
    return `# ${projectName}

Generated with create-streamfox-plugin.

Capabilities: \`${capabilities.join(", ")}\`
Template mode: \`simple\`

## Scripts

- npm run dev
- npm run build
- npm run start
- npm run test
- npm run check

## Notes

- Uses progressive \`definePlugin\` shorthand where appropriate
- IDs are IMDb-only: use \`ids.imdb("tt0133093")\` for media identifiers
- Keep handlers minimal first, then enable richer fields as needed

## Endpoints

${endpointLines}
`;
  }

  return `# ${projectName}

Generated with create-streamfox-plugin.

Capabilities: \`${capabilities.join(", ")}\`
Advanced template: \`${advanced ? "enabled" : "disabled"}\`

## Scripts

- npm run dev
- npm run build
- npm run start
- npm run test
- npm run check

## Implemented Capabilities

${capabilitiesList}

## Manifest Safety + Constraints

- \`safety.adult\` and \`safety.p2p\` for install-time trust badges
- \`capabilityConstraints.accountRequired\`, \`bandwidth\`, and geo region restrictions
- \`qualitySignals\` for reliability-aware plugin ranking

## Configuration Schema

- First-class manifest \`configuration\` schema (no legacy installer field shims)
- Typed fields for \`apiKey\`, \`quality\`, and \`maxResults\`
- Configuration required gate via \`configuration.required\`
- Runtime settings parsing stays typed in handler context (\`context.settings\`)

## Stream Model

- Unified transport model via \`stream.transport\`
- Capability declaration via \`resources.stream.supportedTransports\`
- Optional selection controls via \`stream.selection\`

## Rich Meta Model

- Browse summaries stay lean and can expose \`logoURL\`, \`releasedAt\`, \`slug\`, and \`popularity\`
- Browse summaries can also expose \`background\`, \`runtime\`, \`yearLabel\`, \`imdbRating\`, and \`sourceRatings\`
- Detail responses can expose \`country\`, \`language\`, \`awards\`, \`cast\`, \`directors\`, \`writers\`, \`behaviorHints\`, \`similarItems\`, \`imdbRating\`, and \`sourceRatings\`
- Video entries support both \`releasedAt\` and \`firstAiredAt\` plus optional \`rating\`
- Use \`trailers\` only; there is no separate \`trailerStreams\` field
- Use typed ID helpers: \`ids.plugin(...)\`, \`ids.catalog(...)\`, \`ids.item(...)\`, \`ids.video(...)\`
- Use \`ids.imdb(...)\` for strict IMDb IDs (\`tt\` + digits)
- Media/title IDs identify the title itself, for example \`tt1254207\`
- Video IDs identify the video resource, for example \`main\` or \`tt8599532:1:4\`
- Recommended episodic video ID format: \`{parentMediaID}:{season}:{episode}\`

## Unified Filters

- Prefer semantic catalog IDs such as \`discover\`, \`popular\`, and \`search\`
- Keep variable filters in the query string, for example:
  - \`GET /catalog/movie/browse?genre=action&language=ja\`
  - \`GET /catalog/movie/browse?genre=action&year=2024\`
  - \`GET /catalog/movie/browse?genre=action&year=2000..2024\`
  - \`GET /catalog/movie/browse?genre=action&query=matrix\`
  - \`GET /catalog/movie/browse?genre=action&orderBy=popular\`
  - \`GET /catalog/series/episodes?season=1\`
  - \`GET /catalog/series/episodes\` to return all episodes when no season is provided
  - \`GET /stream/movie/tt0133093?quality=1080p&hevc=false\`
  - \`GET /subtitles/movie/tt0133093?source=opensubtitles&hearingImpaired=true\`
- Use shared \`filterSets\`, \`sortSets\`, \`filters.*\`, and \`sorts.*\` helpers when defining controls
- Use \`isRequired\` for always-present filters and \`index\` for deterministic filter ordering
- Use \`maxSelected\` for multi-select request guardrails and \`optionsLimit\` for bounded option sets
- Use \`dynamicOptions\` for provider-fetched options with cache and fallback controls
- Use \`visibleWhen\` / \`enabledWhen\` conditions for context-aware filter UX
- Query values normalize to canonical option values when aliases are declared

## Endpoints

${endpointLines}
`;
}

export async function scaffoldProject(options: ScaffoldOptions): Promise<void> {
  const capabilities = options.capabilities
    ? sortedCapabilities(options.capabilities)
    : sortedCapabilities([...DEFAULT_CAPABILITIES]);
  const sdkVersion =
    (options.sdkVersion ?? DEFAULT_SDK_VERSION).trim() || DEFAULT_SDK_VERSION;
  const advanced = options.advanced ?? false;

  await ensureTargetDoesNotExist(options.targetDir);

  const srcDir = path.join(options.targetDir, "src");
  const testDir = path.join(options.targetDir, "test");

  await mkdir(srcDir, { recursive: true });
  await mkdir(testDir, { recursive: true });

  await writeFile(
    path.join(options.targetDir, "package.json"),
    makePackageJson(options.projectName, options.language, sdkVersion),
  );
  await writeFile(path.join(options.targetDir, ".gitignore"), gitIgnore);
  await writeFile(
    path.join(options.targetDir, "README.md"),
    makeReadme(options.projectName, capabilities, advanced),
  );

  if (options.language === "ts") {
    await writeFile(path.join(options.targetDir, "tsconfig.json"), tsConfig);
    await writeFile(
      path.join(srcDir, "plugin.ts"),
      makePluginFile(options.projectName, capabilities, advanced),
    );
    await writeFile(path.join(srcDir, "server.ts"), makeServerFile("ts"));
    await writeFile(path.join(testDir, "plugin.test.ts"), makeVitestFile("ts"));
  } else {
    await writeFile(
      path.join(srcDir, "plugin.js"),
      makePluginFile(options.projectName, capabilities, advanced),
    );
    await writeFile(path.join(srcDir, "server.js"), makeServerFile("js"));
    await writeFile(path.join(testDir, "plugin.test.js"), makeVitestFile("js"));
  }
}
