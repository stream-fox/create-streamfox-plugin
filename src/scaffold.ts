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
export type Preset = Capability;
export type Language = "ts" | "js";
export const DEFAULT_PRESET: Preset = "meta";
export const DEFAULT_SDK_VERSION = "^0.2.0";

export interface ScaffoldOptions {
  targetDir: string;
  projectName: string;
  language: Language;
  preset?: Preset;
  capabilities?: Capability[];
  advanced?: boolean;
  extraCapabilities?: Capability[];
  sdkVersion?: string;
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
      return `catalog: {
      endpoints: [
        {
          id: "top",
          name: "Top",
          mediaTypes: ["movie"],
          filters: [{ key: "genre", valueType: "string" }],
        },
      ],
      handler: async () => ({
        items: [],
      }),
    },`;
    case "meta":
      return `meta: {
      mediaTypes: ["movie"],
      includes: ["videos", "links"],
      handler: async () => ({
        item: ${
          advanced
            ? `{
          summary: {
            id: { namespace: "imdb", value: "tt1254207" },
            mediaType: "movie",
            title: "Big Buck Bunny",
            links: [],
          },
          defaultVideoID: "main",
          trailers: [{ transport: { kind: "youtube", id: "aqz-KE-bpKQ" } }],
          videos: [
            {
              id: "main",
              title: "Main",
              streams: [{ transport: { kind: "http", url: "https://example.com/video.mp4" } }],
            },
          ],
        }`
            : "null"
        },
      }),
    },`;
    case "stream":
      return `stream: {
      mediaTypes: ["movie"],
      supportedTransports: ${advanced ? `["http", "torrent", "usenet", "archive", "youtube"]` : `["http"]`},
      handler: async () => ({
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
}        ],
      }),
    },`;
    case "subtitles":
      return `subtitles: {
      mediaTypes: ["movie", "episode"],
      defaultLanguages: ["en"],
      handler: async (request, { settings }) => {
        const configuredLanguages = Array.isArray(settings.languages)
          ? settings.languages
          : [];
        const languagePreferences =
          configuredLanguages.length > 0 ? configuredLanguages : (request.languagePreferences ?? []);

        void languagePreferences;
        void settings.includeHI;

        return {
          subtitles: [],
        };
      },
    },`;
    case "plugin_catalog":
      return `pluginCatalog: {
      endpoints: [
        {
          id: "featured",
          name: "Featured",
          pluginKinds: ["catalog", "meta", "stream", "subtitles"],
          tags: ["official"],
        },
      ],
      handler: async () => ({
        plugins: [
          {
            id: "com.example.recommended",
            name: "Recommended",
            version: "1.0.0",
            pluginKinds: ["catalog", "meta"],
            distribution: {
              transport: "https",
              manifestURL: "https://plugins.example.com/recommended/manifest",
            },
            manifestSnapshot: {
              plugin: { id: "com.example.recommended" },
            },
          },
        ],
      }),
    },`;
    default:
      return "";
  }
}

function makeInstallBlock(capabilities: Capability[]): string {
  if (!capabilities.includes("subtitles")) {
    return "";
  }

  return `  install: {
    configurationRequired: true,
    title: "Subtitle Settings",
    description: "Configure subtitle defaults before installing this plugin.",
    fields: [
      settings.multiSelect("languages", {
        label: "Languages",
        options: [
          { label: "English", value: "en" },
          { label: "Greek", value: "el" },
          { label: "Spanish", value: "es" },
        ],
        defaultValue: ["en"],
      }),
      settings.checkbox("includeHI", {
        label: "Include hearing impaired",
        defaultValue: true,
      }),
    ],
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
  const install = makeInstallBlock(capabilities);
  const importSpec =
    install.length > 0 ? "definePlugin, settings" : "definePlugin";
  const installBlock = install.length > 0 ? `${install}` : "";

  return `import { ${importSpec} } from "@streamfox/plugin-sdk";

export const plugin = definePlugin({
  plugin: {
    id: "com.example.${name}",
    name: "${name}",
    version: "0.1.0",
    description: "Generated StreamFox plugin scaffold",
  },
${installBlock}  resources: {
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
      default:
        return `/${capability}`;
    }
  };

  const endpointLines = [
    "- GET /manifest",
    "- GET /studio-config",
    ...capabilities.map(
      (capability) => `- GET ${endpointForCapability(capability)}`,
    ),
  ].join("\n");

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

## Stream Model

- Unified transport model via \`stream.transport\`
- Capability declaration via \`resources.stream.supportedTransports\`
- Optional selection controls via \`stream.selection\`

## Endpoints

${endpointLines}
`;
}

export async function scaffoldProject(options: ScaffoldOptions): Promise<void> {
  const capabilities = options.capabilities
    ? sortedCapabilities(options.capabilities)
    : sortedCapabilities([
        options.preset ?? DEFAULT_PRESET,
        ...(options.extraCapabilities ?? []),
      ]);
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
      makePluginFile(
        options.projectName,
        capabilities,
        advanced,
      ),
    );
    await writeFile(path.join(srcDir, "server.ts"), makeServerFile("ts"));
    await writeFile(path.join(testDir, "plugin.test.ts"), makeVitestFile("ts"));
  } else {
    await writeFile(
      path.join(srcDir, "plugin.js"),
      makePluginFile(
        options.projectName,
        capabilities,
        advanced,
      ),
    );
    await writeFile(path.join(srcDir, "server.js"), makeServerFile("js"));
    await writeFile(path.join(testDir, "plugin.test.js"), makeVitestFile("js"));
  }
}
