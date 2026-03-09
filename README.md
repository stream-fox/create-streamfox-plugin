# create-media-plugin

Standalone CLI for scaffolding StreamHub plugin projects.

## Global install

```bash
npm i -g create-media-plugin
```

## Usage

```bash
create-media-plugin
```

Or non-interactive:

```bash
create-media-plugin my-plugin --yes
```

## Options

- `--ts` or `--js`
- `--preset <preset>` (`catalog|meta|stream|subtitles|plugin_catalog`, default: `meta`)
- `--capabilities <comma,separated,list>`
- `--sdk-version <range>` (default: `^0.1.0`)
- `--yes`

Example:

```bash
create-media-plugin streamhub-opensubs \
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
create-media-plugin demo-plugin --yes
```
