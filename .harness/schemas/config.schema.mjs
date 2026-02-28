import { z } from "zod";

export const AgentConfigSchema = z.object({
  profile: z.enum(["coder", "researcher", "general"]),
}).passthrough();

export const ConfigSchema = z.object({
  session: z.string(),
  worktree: z.string(),
  agent: AgentConfigSchema,
  runs_dir: z.string(),
  prp: z.string().optional(),
  specs: z.union([z.string(), z.array(z.string())]).optional(),
  slug: z.string().optional(),
  project: z.string().optional(),
  session_name: z.string().optional(),
  prp_path: z.string().optional(),
  parent_workspace: z.string().optional(),
  parent_branch: z.string().optional(),
  branch: z.string().optional(),
  created_at: z.string().optional(),
  notifications: z.any().optional(),
}).passthrough();
