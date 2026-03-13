import path from "node:path";
import { Command, InvalidArgumentError } from "commander";
import prompts from "prompts";
import {
  CAPABILITIES,
  DEFAULT_PRESET,
  DEFAULT_SDK_VERSION,
  scaffoldProject,
  type Capability,
  type Language,
  type Preset,
} from "./scaffold";

function capabilitiesLabel(): string {
  return CAPABILITIES.join(", ");
}

function parsePreset(input: string): Preset {
  if (CAPABILITIES.includes(input as Capability)) {
    return input as Preset;
  }
  throw new InvalidArgumentError(
    `Invalid preset '${input}'. Use one of: ${capabilitiesLabel()}`,
  );
}

function parseCapabilitiesList(input: string): Capability[] {
  const parsed = input
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0) as Capability[];

  for (const capability of parsed) {
    if (!CAPABILITIES.includes(capability)) {
      throw new InvalidArgumentError(
        `Invalid capability '${capability}'. Use one of: ${capabilitiesLabel()}`,
      );
    }
  }

  return Array.from(new Set(parsed));
}

const program = new Command();

program
  .name("create-streamfox-plugin")
  .description("Scaffold StreamFox plugin projects with modern JS/TS presets")
  .showHelpAfterError()
  .argument("[directory]", "output directory")
  .option("--ts", "use TypeScript template")
  .option("--js", "use JavaScript template")
  .option(
    "--preset <preset>",
    `plugin preset: ${capabilitiesLabel()}`,
    parsePreset,
  )
  .option(
    "--capabilities <capabilities>",
    "extra capabilities as comma-separated list",
    parseCapabilitiesList,
  )
  .option("--advanced", "generate advanced capability examples")
  .option(
    "--sdk-version <range>",
    "@streamfox/plugin-sdk version/range",
    DEFAULT_SDK_VERSION,
  )
  .option("--yes", "skip prompts and use defaults")
  .action(
    async (
      directoryArg: string | undefined,
      options: {
        ts?: boolean;
        js?: boolean;
        yes?: boolean;
        preset?: Preset;
        capabilities?: Capability[];
        advanced?: boolean;
        sdkVersion?: string;
      },
    ) => {
      if (options.ts && options.js) {
        throw new InvalidArgumentError("Choose either --ts or --js, not both.");
      }

      const promptDefaults = {
        directory: directoryArg ?? "my-media-plugin",
        language: options.ts ? "ts" : options.js ? "js" : "ts",
        preset: options.preset ?? DEFAULT_PRESET,
        extraCapabilities: options.capabilities ?? [],
        advanced: options.advanced ?? false,
        sdkVersion: options.sdkVersion ?? DEFAULT_SDK_VERSION,
      };

      const shouldPrompt = !options.yes;

      let directory = promptDefaults.directory;
      let language = promptDefaults.language as Language;
      let preset = promptDefaults.preset;
      let extraCapabilities = promptDefaults.extraCapabilities;
      let advanced = promptDefaults.advanced;
      let sdkVersion = promptDefaults.sdkVersion;

      if (shouldPrompt) {
        const answers = await prompts(
          [
            {
              type: "text",
              name: "directory",
              message: "Project directory",
              initial: directory,
            },
            {
              type: "select",
              name: "language",
              message: "Template language",
              choices: [
                { title: "TypeScript", value: "ts" },
                { title: "JavaScript", value: "js" },
              ],
              initial: language === "ts" ? 0 : 1,
            },
            {
              type: "select",
              name: "preset",
              message: "Plugin preset",
              choices: CAPABILITIES.map((capability) => ({
                title: capability,
                value: capability,
              })),
              initial: CAPABILITIES.indexOf(preset),
            },
            {
              type: "multiselect",
              name: "extraCapabilities",
              message: "Extra capabilities (optional)",
              choices: CAPABILITIES.map((capability) => ({
                title: capability,
                value: capability,
              })),
              instructions: false,
              min: 0,
              hint: "Space to select",
            },
            {
              type: "confirm",
              name: "advanced",
              message: "Generate advanced capability examples?",
              initial: advanced,
            },
            {
              type: "text",
              name: "sdkVersion",
              message: "SDK dependency version/range",
              initial: sdkVersion,
            },
          ],
          {
            onCancel: () => {
              process.exit(1);
            },
          },
        );

        directory = answers.directory;
        language = answers.language;
        preset = (answers.preset ?? promptDefaults.preset) as Preset;
        extraCapabilities = (answers.extraCapabilities ?? []) as Capability[];
        advanced = Boolean(answers.advanced ?? promptDefaults.advanced);
        sdkVersion = answers.sdkVersion ?? promptDefaults.sdkVersion;
      }

      const targetDir = path.resolve(process.cwd(), directory);
      const projectName = path.basename(targetDir);

      await scaffoldProject({
        targetDir,
        projectName,
        language,
        preset,
        extraCapabilities,
        advanced,
        sdkVersion,
      });

      console.log(`Created ${projectName} at ${targetDir}`);
      console.log("Next steps:");
      console.log(`  cd ${directory}`);
      console.log("  npm install");
      console.log("  npm run dev");
    },
  );

void program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exit(1);
});
