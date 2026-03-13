# create-streamfox-plugin

CLI scaffolder for StreamFox plugin projects.

Generated projects target the current `@streamfox/plugin-sdk` contract:

- unified stream transport model (`supportedTransports` + `stream.transport`)
- richer catalog filters with shared `filterSets` and `filters.*` helpers
- optional installer config with `configurationRequired`
- serve integration URLs (`url`, `installURL`, `launchURL`)

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

| Option                   | Type          | Default                | Notes                                                                    |
| ------------------------ | ------------- | ---------------------- | ------------------------------------------------------------------------ |
| `[directory]`            | positional    | `my-media-plugin`      | Output directory.                                                        |
| `--ts`                   | flag          | `true` (unless `--js`) | Generate TypeScript template.                                            |
| `--js`                   | flag          | no                     | Generate JavaScript template.                                            |
| `--preset <preset>`      | enum          | `meta`                 | Legacy/compat primary template hint. Interactive mode now asks for capabilities directly. |
| `--capabilities <a,b,c>` | csv enum list | `meta`                 | Selected capabilities. One of: `catalog`, `meta`, `stream`, `subtitles`, `plugin_catalog`. |
| `--advanced`             | flag          | `false`                | Generate richer examples (torrent/usenet/archive/trailers/distribution). |
| `--sdk-version <range>`  | string        | `^0.3.0`               | Dependency range for `@streamfox/plugin-sdk`.                            |
| `--yes`                  | flag          | `false`                | Skip prompts and use provided/default values.                            |
| `-v, --version`          | flag          | no                     | Display the current CLI version.                                         |

## Examples

Create a subtitles + meta + stream plugin with advanced examples:

```bash
create-streamfox-plugin streamfox-opensubs \
  --ts \
  --capabilities subtitles,meta,stream \
  --advanced \
  --sdk-version ^0.3.0 \
  --yes
```

## What Gets Generated

- `src/plugin.(ts|js)` with selected capabilities and handlers
  - catalog examples use semantic endpoint IDs such as `discover`
  - catalog examples demonstrate shared `filterSets` and `filters.*` helpers
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
