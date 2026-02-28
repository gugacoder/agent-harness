import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { ConfigSchema } from "./config.schema.mjs";
import { FeaturesFileSchema, FeatureSchema } from "./features.schema.mjs";
import { RankingSchema, DiscoverySchema } from "./ranking.schema.mjs";
import { LoopStateSchema } from "./loop-state.schema.mjs";
import { validateArtifact } from "./validate.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP_DIR = path.join(__dirname, "..", "..", ".tmp", "test-fixtures");

// --- Fixtures ---

const VALID_CONFIG = {
  session: "test-session",
  slug: "test-slug",
  project: "test-project",
  worktree: ".harness/worktrees/test",
  agent: { profile: "coder" },
  runs_dir: ".harness/runs/test",
  prp_path: ".projeto/4-prps/test.md",
  specs: [".projeto/3-specs/test.md"],
  branch: "harness/test",
  created_at: "2026-01-01T00:00:00Z",
};

const VALID_FEATURE = {
  id: "F-001",
  name: "test feature",
  description: "a test feature",
  status: "passing",
  agent: "coder",
  dependencies: [],
  tests: ["test passes"],
};

const VALID_FEATURES_ARRAY = [
  VALID_FEATURE,
  { ...VALID_FEATURE, id: "F-002", status: "failing" },
];

const VALID_FEATURES_OBJECT = {
  features: VALID_FEATURES_ARRAY,
};

const VALID_RANKING = {
  wave: 1,
  decision: "go",
  discoveries: [
    {
      id: "D-001",
      type: "pain",
      description: "slow startup",
      score: 8,
      discovered_at: 1,
      last_reclassified_at: 1,
    },
    {
      id: "D-002",
      type: "gain",
      description: "easy deployment",
      score: 5,
      discovered_at: 2,
      last_reclassified_at: 2,
      implemented_at: 3,
    },
  ],
};

const VALID_LOOP_STATE = {
  status: "running",
  started_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:01:00Z",
  pid: 1234,
  iteration: 3,
  total: 7,
  done: 2,
  remaining: 5,
  feature_id: "F-003",
  current_feature: "implement tests",
  features_done: ["F-001", "F-002"],
};

// --- Helpers ---

function writeTmpJson(name, data) {
  const filePath = path.join(TMP_DIR, name);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  return filePath;
}

// --- Tests ---

before(() => {
  fs.mkdirSync(TMP_DIR, { recursive: true });
});

after(() => {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
});

// 1. Config schema — valid
describe("ConfigSchema", () => {
  it("validates a valid config without errors", () => {
    const result = ConfigSchema.safeParse(VALID_CONFIG);
    assert.equal(result.success, true);
    assert.equal(result.data.session, "test-session");
    assert.equal(result.data.agent.profile, "coder");
  });

  it("rejects config without required field 'session'", () => {
    const { session, ...noSession } = VALID_CONFIG;
    const result = ConfigSchema.safeParse(noSession);
    assert.equal(result.success, false);
    const paths = result.error.issues.map((i) => i.path.join("."));
    assert.ok(paths.includes("session"));
  });

  it("rejects config with invalid agent profile", () => {
    const bad = { ...VALID_CONFIG, agent: { profile: "hacker" } };
    const result = ConfigSchema.safeParse(bad);
    assert.equal(result.success, false);
  });

  it("allows passthrough of extra fields", () => {
    const extra = { ...VALID_CONFIG, custom_field: "hello" };
    const result = ConfigSchema.safeParse(extra);
    assert.equal(result.success, true);
    assert.equal(result.data.custom_field, "hello");
  });
});

// 2. Features schema — array format
describe("FeaturesFileSchema", () => {
  it("validates features.json in array format", () => {
    const result = FeaturesFileSchema.safeParse(VALID_FEATURES_ARRAY);
    assert.equal(result.success, true);
    assert.equal(result.data.length, 2);
  });

  it("validates features.json in object {features:[...]} format", () => {
    const result = FeaturesFileSchema.safeParse(VALID_FEATURES_OBJECT);
    assert.equal(result.success, true);
    assert.equal(result.data.features.length, 2);
  });

  it("rejects features.json with invalid status", () => {
    const bad = [{ ...VALID_FEATURE, status: "unknown" }];
    const result = FeaturesFileSchema.safeParse(bad);
    assert.equal(result.success, false);
  });

  it("rejects feature with invalid id format", () => {
    const bad = [{ ...VALID_FEATURE, id: "X-001" }];
    const result = FeaturesFileSchema.safeParse(bad);
    assert.equal(result.success, false);
  });

  it("accepts all valid status values", () => {
    const statuses = ["failing", "passing", "skipped", "pending", "in_progress", "blocked"];
    for (const status of statuses) {
      const result = FeaturesFileSchema.safeParse([{ ...VALID_FEATURE, status }]);
      assert.equal(result.success, true, `status '${status}' should be valid`);
    }
  });
});

// 3. Ranking schema
describe("RankingSchema", () => {
  it("validates a valid ranking without errors", () => {
    const result = RankingSchema.safeParse(VALID_RANKING);
    assert.equal(result.success, true);
    assert.equal(result.data.discoveries.length, 2);
  });

  it("rejects ranking with score outside 1-10 (score=0)", () => {
    const bad = {
      ...VALID_RANKING,
      discoveries: [{ ...VALID_RANKING.discoveries[0], score: 0 }],
    };
    const result = RankingSchema.safeParse(bad);
    assert.equal(result.success, false);
  });

  it("rejects ranking with score outside 1-10 (score=11)", () => {
    const bad = {
      ...VALID_RANKING,
      discoveries: [{ ...VALID_RANKING.discoveries[0], score: 11 }],
    };
    const result = RankingSchema.safeParse(bad);
    assert.equal(result.success, false);
  });

  it("rejects discovery with invalid id format", () => {
    const bad = {
      ...VALID_RANKING,
      discoveries: [{ ...VALID_RANKING.discoveries[0], id: "D-1" }],
    };
    const result = RankingSchema.safeParse(bad);
    assert.equal(result.success, false);
  });

  it("rejects invalid decision value", () => {
    const bad = { ...VALID_RANKING, decision: "maybe" };
    const result = RankingSchema.safeParse(bad);
    assert.equal(result.success, false);
  });
});

// 4. LoopState schema
describe("LoopStateSchema", () => {
  it("validates a valid loop-state without errors", () => {
    const result = LoopStateSchema.safeParse(VALID_LOOP_STATE);
    assert.equal(result.success, true);
    assert.equal(result.data.status, "running");
  });

  it("accepts all valid status values", () => {
    const statuses = ["starting", "running", "between", "exited"];
    for (const status of statuses) {
      const minimal = {
        status,
        started_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      };
      const result = LoopStateSchema.safeParse(minimal);
      assert.equal(result.success, true, `status '${status}' should be valid`);
    }
  });

  it("rejects invalid status value", () => {
    const bad = { ...VALID_LOOP_STATE, status: "paused" };
    const result = LoopStateSchema.safeParse(bad);
    assert.equal(result.success, false);
  });

  it("rejects missing required field 'started_at'", () => {
    const { started_at, ...noStarted } = VALID_LOOP_STATE;
    const result = LoopStateSchema.safeParse(noStarted);
    assert.equal(result.success, false);
  });

  it("rejects invalid datetime format", () => {
    const bad = { ...VALID_LOOP_STATE, started_at: "not-a-date" };
    const result = LoopStateSchema.safeParse(bad);
    assert.equal(result.success, false);
  });
});

// 5. validateArtifact API
describe("validateArtifact", () => {
  it("returns success for a valid config file", () => {
    const fp = writeTmpJson("valid-config.json", VALID_CONFIG);
    const result = validateArtifact("config", fp);
    assert.equal(result.success, true);
  });

  it("returns success for a valid features file (array)", () => {
    const fp = writeTmpJson("valid-features.json", VALID_FEATURES_ARRAY);
    const result = validateArtifact("features", fp);
    assert.equal(result.success, true);
  });

  it("returns success for a valid ranking file", () => {
    const fp = writeTmpJson("valid-ranking.json", VALID_RANKING);
    const result = validateArtifact("ranking", fp);
    assert.equal(result.success, true);
  });

  it("returns success for a valid loop-state file", () => {
    const fp = writeTmpJson("valid-loop-state.json", VALID_LOOP_STATE);
    const result = validateArtifact("loop-state", fp);
    assert.equal(result.success, true);
  });

  it("returns error for an invalid config file", () => {
    const fp = writeTmpJson("invalid-config.json", { worktree: "x" });
    const result = validateArtifact("config", fp);
    assert.equal(result.success, false);
    assert.ok(result.error.issues.length > 0);
  });

  it("throws on unknown type", () => {
    const fp = writeTmpJson("dummy.json", {});
    assert.throws(() => validateArtifact("bogus", fp), {
      message: /Unknown type "bogus"/,
    });
  });
});
