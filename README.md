# create-streamfox-plugin

CLI scaffolder for StreamFox plugin projects.

Generated projects target the current `@streamfox/plugin-sdk` contract.

Default output is now **simple/minimal**:

- progressive `definePlugin(...)` authoring style
- IMDb-only IDs (`tt...`) with `ids.imdb(...)`
- minimal handlers and resource declarations
- serve integration URLs (`url`, `installURL`, `launchURL`)

Optional `--advanced` output includes richer examples:

- manifest safety/configuration/constraints/quality sections
- shared catalog `filterSets`/`sortSets` helpers
- advanced transport/filter metadata and richer detail fields

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
| `--capabilities <a,b,c>` | csv enum list | `meta`                 | Selected capabilities. One of: `catalog`, `meta`, `stream`, `subtitles`, `plugin_catalog`. |
| `--advanced`             | flag          | `false`                | Generate richer examples (advanced metadata/filters/transports).                            |
| `--sdk-version <range>`  | string        | `^0.7.0`               | Dependency range for `@streamfox/plugin-sdk`.                                               |
| `--yes`                  | flag          | `false`                | Skip prompts and use provided/default values.                                              |
| `-v, --version`          | flag          | no                     | Display the current CLI version.                                                           |

## Examples

Create a subtitles + meta + stream plugin with advanced examples:

```bash
create-streamfox-plugin streamfox-opensubs \
  --ts \
  --capabilities subtitles,meta,stream \
  --advanced \
  --sdk-version ^0.7.0 \
  --yes
```

## What Gets Generated

- `src/plugin.(ts|js)` with selected capabilities and handlers
  - default template is minimal and IMDb-focused
  - `--advanced` adds richer manifest/capability examples
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
