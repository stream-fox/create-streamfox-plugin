# create-streamfox-plugin

CLI for scaffolding StreamFox plugin projects.

## Install

```bash
npm i -g create-streamfox-plugin
```

## Usage

```bash
create-streamfox-plugin
```

Non-interactive:

```bash
create-streamfox-plugin my-plugin --yes
```

Example:

```bash
create-streamfox-plugin streamfox-opensubs \
  --ts \
  --preset subtitles \
  --capabilities meta \
  --sdk-version ^0.1.0 \
  --yes
```

## Options

- `--ts` or `--js`
- `--preset <preset>` (`catalog|meta|stream|subtitles|plugin_catalog`, default: `meta`)
- `--capabilities <comma,separated,list>`
- `--sdk-version <range>` (default: `^0.1.0`)
- `--yes`

The generated project depends on `@streamfox/plugin-sdk`.

## Development

```bash
npm install
npm run build
npm test
```

To test the CLI from local source:

```bash
npm link
create-streamfox-plugin demo-plugin --yes
```
