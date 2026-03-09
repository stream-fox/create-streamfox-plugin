# create-streamfox-plugin

Standalone CLI for scaffolding StreamFox plugin projects.

## Global install

```bash
npm i -g create-streamfox-plugin
```

## Usage

```bash
create-streamfox-plugin
```

Or non-interactive:

```bash
create-streamfox-plugin my-plugin --yes
```

## Options

- `--ts` or `--js`
- `--preset <preset>` (`catalog|meta|stream|subtitles|plugin_catalog`, default: `meta`)
- `--capabilities <comma,separated,list>`
- `--sdk-version <range>` (default: `^0.1.0`)
- `--yes`

Example:

```bash
create-streamfox-plugin streamfox-opensubs \
  --ts \
  --preset meta \
  --capabilities stream \
  --sdk-version ^0.1.0 \
  --yes
```

## Local development

```bash
npm install
npm run build
npm test
```

To test globally from local source:

```bash
npm link
create-streamfox-plugin demo-plugin --yes
```
