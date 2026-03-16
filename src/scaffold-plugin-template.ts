import type { Capability } from "./scaffold-types";

function assertNeverCapability(value: never): never {
  throw new Error(`Unsupported capability '${String(value)}'`);
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
        item: {
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

export function makePluginFile(
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
