# create-streamfox-plugin

CLI scaffolder for StreamFox plugin projects.

Generated projects target the current `@streamfox/plugin-sdk` contract:

- unified stream transport model (`supportedTransports` + `stream.transport`)
- optional installer config with `configurationRequired`
- serve integration URLs (`url`, `installURL`, `launchURL`)

## Install

```bash
npm i -g create-streamfox-plugin
```

## Usage

Interactive:

```bash
create-streamfox-plugin
```

Non-interactive:

```bash
create-streamfox-plugin my-plugin --yes
```

## CLI Options

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `[directory]` | positional | `my-media-plugin` | Output directory. |
| `--ts` | flag | `true` (unless `--js`) | Generate TypeScript template. |
| `--js` | flag | no | Generate JavaScript template. |
| `--preset <preset>` | enum | `meta` | One of: `catalog`, `meta`, `stream`, `subtitles`, `plugin_catalog`. |
| `--capabilities <a,b,c>` | csv enum list | none | Adds extra capabilities on top of preset. |
| `--advanced` | flag | `false` | Generate richer examples (torrent/usenet/archive/trailers/distribution). |
| `--sdk-version <range>` | string | `^0.1.0` | Dependency range for `@streamfox/plugin-sdk`. |
| `--yes` | flag | `false` | Skip prompts and use provided/default values. |

## Examples

Create subtitles preset with advanced examples:

```bash
create-streamfox-plugin streamfox-opensubs \
  --ts \
  --preset subtitles \
  --capabilities meta,stream \
  --advanced \
  --sdk-version ^0.1.0 \
  --yes
```

## What Gets Generated

- `src/plugin.(ts|js)` with selected capabilities and handlers
- `src/server.(ts|js)` that calls `serve(...)` and prints:
  - manifest URL
  - install deeplink URL
  - launch URL
- `test/plugin.test.(ts|js)` smoke test (`/manifest`, `/studio-config`)
- `README.md`, `package.json`, `.prettierrc.json`, `.prettierignore`, and (for TS) `tsconfig.json`

## Development

```bash
npm install
npm run format
npm run build
npm test
```

Local manual test:

```bash
npm link
create-streamfox-plugin demo-plugin --yes
```
