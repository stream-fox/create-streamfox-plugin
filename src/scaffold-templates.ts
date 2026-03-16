import type { Capability, Language } from "./scaffold-types";

function assertNeverCapability(value: never): never {
  throw new Error(`Unsupported capability '${String(value)}'`);
}

export function makePackageJson(
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

export function makeServerFile(language: Language): string {
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

export function makeVitestFile(language: Language): string {
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

export const tsConfig = `{
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

export const gitIgnore = `dist
node_modules
.DS_Store
.env
.env.*
coverage
`;

export function makeReadme(
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
