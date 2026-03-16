export const CAPABILITIES = [
  "catalog",
  "meta",
  "stream",
  "subtitles",
  "plugin_catalog",
] as const;

export type Capability = (typeof CAPABILITIES)[number];
export type Language = "ts" | "js";

export const DEFAULT_CAPABILITIES: readonly Capability[] = ["meta"];
export const DEFAULT_SDK_VERSION = "^0.7.2";
