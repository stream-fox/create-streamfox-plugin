# create-streamfox-plugin

CLI scaffolder for StreamFox plugin projects.

Generated projects target the current `@streamfox/plugin-sdk` contract:

- manifest-level safety hints (`safety.adult`, `safety.p2p`)
- first-class manifest configuration schema (`configuration.required`, `configuration.fields`)
- unified stream transport model (`supportedTransports` + `stream.transport`)
- unified filters across `catalog`, `stream`, and `subtitles` using `filters.*` helpers
- richer catalog filters with shared `filterSets` and `sortSets`
- filter UI metadata support via `isRequired`, `index`, `maxSelected`, `optionsLimit`, `dynamicOptions`, and conditions (`visibleWhen`/`enabledWhen`)
- resource-level request guardrails (`idPrefixes`)
- embedded video stream strategy metadata (`embeddedVideoStreamStrategy`)
- catalog discovery metadata (`discovery.mode`, `defaultSort`, `defaultFilters`)
- standardized capability constraints (`accountRequired`, `bandwidth`, geo restrictions)
- plugin quality signals (`providerSuccessRate`, `timeoutRatio`, `freshnessTimestamp`)
- exact-or-range numeric catalog filters such as `year=2024` or `year=2000..2024`
- richer catalog ordering with `sorts.*` helpers
- richer meta/detail models with `logoURL`, `background`, `runtime`, `releasedAt`, `imdbRating`, `sourceRatings`, structured people credits, `behaviorHints`, and `similarItems`
- strong ID helpers (`ids.plugin`, `ids.catalog`, `ids.item`, `ids.video`, `ids.imdb`)
- serve integration URLs (`url`, `installURL`, `launchURL`)

ID semantics:

- media/title IDs identify the title itself, for example `tt1254207`
- video IDs identify the video resource, for example `main` or `tt8599532:1:4`
- strict IMDb IDs use `tt` + digits (`ids.imdb("tt0133093")`)

Recommended episodic video ID format:

- `{parentMediaID}:{season}:{episode}`

## Install

```bash
npm i -g @streamfox/create-streamfox-plugin
```

The installed command stays:

```bash
create-streamfox-plugin
```

## Usage

Interactive:

```bash
npx @streamfox/create-streamfox-plugin
```

Or after global install:

```bash
create-streamfox-plugin
```

Non-interactive:

```bash
create-streamfox-plugin my-plugin --yes
```

## CLI Options

| Option                   | Type          | Default                | Notes                                                                                      |
| ------------------------ | ------------- | ---------------------- | ------------------------------------------------------------------------------------------ |
| `[directory]`            | positional    | `my-media-plugin`      | Output directory.                                                                          |
| `--ts`                   | flag          | `true` (unless `--js`) | Generate TypeScript template.                                                              |
| `--js`                   | flag          | no                     | Generate JavaScript template.                                                              |
| `--preset <preset>`      | enum          | `meta`                 | Legacy/compat primary template hint. Interactive mode now asks for capabilities directly.  |
| `--capabilities <a,b,c>` | csv enum list | `meta`                 | Selected capabilities. One of: `catalog`, `meta`, `stream`, `subtitles`, `plugin_catalog`. |
| `--advanced`             | flag          | `false`                | Generate richer examples (torrent/usenet/archive/trailers/distribution).                   |
| `--sdk-version <range>`  | string        | `^0.6.2`               | Dependency range for `@streamfox/plugin-sdk`.                                              |
| `--yes`                  | flag          | `false`                | Skip prompts and use provided/default values.                                              |
| `-v, --version`          | flag          | no                     | Display the current CLI version.                                                           |

## Examples

Create a subtitles + meta + stream plugin with advanced examples:

```bash
create-streamfox-plugin streamfox-opensubs \
  --ts \
  --capabilities subtitles,meta,stream \
  --advanced \
  --sdk-version ^0.6.2 \
  --yes
```

## What Gets Generated

- `src/plugin.(ts|js)` with selected capabilities and handlers
  - includes `safety`, `configuration`, `capabilityConstraints`, and `qualitySignals`
  - catalog examples use semantic endpoint IDs such as `browse`
  - catalog examples demonstrate shared `filterSets` / `sortSets` and `filters.*` / `sorts.*` helpers
  - stream/subtitles examples include resource-level filters and parsed `request.filters`
- `src/server.(ts|js)` that calls `serve(...)` and prints:
  - manifest URL
  - install deeplink URL
  - launch URL
- `test/plugin.test.(ts|js)` smoke test (`/manifest`, `/studio-config`)
- `README.md`, `package.json`, `.gitignore`, and (for TS) `tsconfig.json`

## Development

```bash
npm install
npm run build
npm test
```

Local manual test:

```bash
npm link
create-streamfox-plugin demo-plugin --yes
```
