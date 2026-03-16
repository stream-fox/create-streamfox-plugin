import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { makePluginFile } from "./scaffold-plugin-template";
import {
  gitIgnore,
  makePackageJson,
  makeReadme,
  makeServerFile,
  makeVitestFile,
  tsConfig,
} from "./scaffold-templates";
import {
  CAPABILITIES,
  DEFAULT_CAPABILITIES,
  DEFAULT_SDK_VERSION,
  type Capability,
  type Language,
} from "./scaffold-types";

export {
  CAPABILITIES,
  DEFAULT_CAPABILITIES,
  DEFAULT_SDK_VERSION,
  type Capability,
  type Language,
} from "./scaffold-types";

export interface ScaffoldOptions {
  targetDir: string;
  projectName: string;
  language: Language;
  capabilities?: Capability[];
  advanced?: boolean;
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

export async function scaffoldProject(options: ScaffoldOptions): Promise<void> {
  const capabilities = options.capabilities
    ? sortedCapabilities(options.capabilities)
    : sortedCapabilities([...DEFAULT_CAPABILITIES]);
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
      makePluginFile(options.projectName, capabilities, advanced),
    );
    await writeFile(path.join(srcDir, "server.ts"), makeServerFile("ts"));
    await writeFile(path.join(testDir, "plugin.test.ts"), makeVitestFile("ts"));
    return;
  }

  await writeFile(
    path.join(srcDir, "plugin.js"),
    makePluginFile(options.projectName, capabilities, advanced),
  );
  await writeFile(path.join(srcDir, "server.js"), makeServerFile("js"));
  await writeFile(path.join(testDir, "plugin.test.js"), makeVitestFile("js"));
}
