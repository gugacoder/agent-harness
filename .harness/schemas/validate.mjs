import fs from "fs";
import { ConfigSchema } from "./config.schema.mjs";
import { FeaturesFileSchema } from "./features.schema.mjs";
import { RankingSchema } from "./ranking.schema.mjs";
import { LoopStateSchema } from "./loop-state.schema.mjs";

const SCHEMAS = {
  config: ConfigSchema,
  features: FeaturesFileSchema,
  ranking: RankingSchema,
  "loop-state": LoopStateSchema,
};

/**
 * Validates a JSON artifact against the corresponding Zod schema.
 * @param {string} type - One of: config, features, ranking, loop-state
 * @param {string} filePath - Path to the JSON file
 * @returns {{ success: boolean, data?: any, error?: import("zod").ZodError }} Validation result
 */
export function validateArtifact(type, filePath) {
  const schema = SCHEMAS[type];
  if (!schema) {
    throw new Error(
      `Unknown type "${type}". Supported: ${Object.keys(SCHEMAS).join(", ")}`
    );
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const json = JSON.parse(raw);
  return schema.safeParse(json);
}

// CLI entry point
const isCLI =
  process.argv[1] &&
  (process.argv[1].endsWith("validate.mjs") ||
    process.argv[1].endsWith("validate"));

if (isCLI && process.argv.length >= 4) {
  const [, , type, filePath] = process.argv;

  if (!SCHEMAS[type]) {
    console.error(
      `Error: Unknown type "${type}". Supported: ${Object.keys(SCHEMAS).join(", ")}`
    );
    process.exit(1);
  }

  try {
    const result = validateArtifact(type, filePath);

    if (result.success) {
      console.log(`OK: ${filePath} valido`);
      process.exit(0);
    } else {
      console.error(`Validation errors in ${filePath}:\n`);
      for (const issue of result.error.issues) {
        const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
        console.error(`  - ${path}: ${issue.message}`);
      }
      process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
} else if (isCLI) {
  console.error(
    "Usage: node validate.mjs <type> <file>\nTypes: config, features, ranking, loop-state"
  );
  process.exit(1);
}
