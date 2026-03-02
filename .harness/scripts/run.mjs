#!/usr/bin/env node
// =============================================================================
// Claude Code — Agent Runner
// Spawna o agente Claude Code para implementar uma feature.
// Exporta spawnAgent() para uso pelo loop.mjs compartilhado.
// =============================================================================

import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { access } from 'node:fs/promises';

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parseia frontmatter YAML simples de um arquivo markdown.
 * Extrai bloco entre --- delimiters, parseia key/value line-by-line.
 *
 * @param {string} content - conteúdo do arquivo
 * @returns {{ frontmatter: Record<string, string>, body: string }}
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const fm = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key) fm[key] = val;
  }
  return { frontmatter: fm, body: match[2] };
}

/**
 * Resolve o agent profile para uma feature.
 *
 * Fallback chain:
 *   1. feature.agent → override por feature
 *   2. config.agent.profile → profile da session
 *   3. "coder" → fallback default
 *   4. .harness/agents/{profile}.md
 *
 * @param {object} config - config.json da session
 * @param {string} harnessDir - path do .harness/ root
 * @param {object} [feature] - feature object (pode ter .agent)
 * @returns {Promise<string>} path do agent file
 */
async function resolveAgent(config, harnessDir, feature) {
  const profile = feature?.agent || config.agent?.profile || 'coder';

  const agentPath = join(harnessDir, 'agents', `${profile}.md`);
  if (await fileExists(agentPath)) return agentPath;

  throw new Error(`Agent profile não encontrado: ${agentPath}`);
}

/**
 * Spawna o agente Claude Code para uma feature.
 *
 * @param {object} params
 * @param {object} params.config - config.json da session
 * @param {string} params.featureId - ID da feature (ex: F-001)
 * @param {string} params.sessionDir - path da session (.harness/runs/{session}/)
 * @param {string} params.runsDir - path para runs (.harness/runs/{session}/runs/)
 * @param {string} params.harnessDir - path do .harness/ root
 * @param {Array} params.features - array de features de features.json
 * @param {string} params.workspace - path do workspace root
 * @param {string} params.session - nome da session
 * @returns {Promise<{code: number, pid: number}>}
 */
export async function spawnAgent({ config, featureId, sessionDir, runsDir, harnessDir, features, workspace, session, timeoutMs }) {
  // Encontrar feature pelo ID para resolver agent profile
  const feature = Array.isArray(features) ? features.find(f => f.id === featureId) : undefined;

  // Resolver agent profile
  const agentPath = await resolveAgent(config, harnessDir, feature);

  // Ler e parsear agent file
  const rawContent = await readFile(agentPath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(rawContent);

  // allowedTools do frontmatter, ou fallback hardcoded
  const allowedTools = frontmatter.allowedTools || 'Edit,Write,Bash,Read,Glob,Grep';

  // max_turns: env > frontmatter > config > 0
  const maxTurns = process.env.MAX_TURNS
    ? parseInt(process.env.MAX_TURNS, 10)
    : (frontmatter.max_turns ? parseInt(frontmatter.max_turns, 10) : (config.agent?.max_turns || 0));
  const model = process.env.MODEL || config.agent?.model || '';

  const args = [
    '-p', '-',
    '--verbose',
    '--output-format', 'stream-json',
    '--allowedTools', allowedTools,
  ];
  if (maxTurns > 0) {
    args.push('--max-turns', String(maxTurns));
  }
  if (model) {
    args.push('--model', model);
  }

  const outputPath = join(runsDir, `${featureId}.jsonl`);
  const outputStream = createWriteStream(outputPath, { flags: 'a' });

  // Inactivity timeout: env > param > config > default 2min
  const inactivityMs = parseInt(process.env.AGENT_TIMEOUT_MS || '0', 10)
    || timeoutMs
    || (config.agent?.timeout_minutes ? config.agent.timeout_minutes * 60_000 : 0)
    || 2 * 60_000;

  return new Promise((resolvePromise, reject) => {
    const proc = spawn('claude', args, {
      cwd: resolve(workspace),
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    let timedOut = false;
    let settled = false;

    // Inactivity timer — resets on every chunk of output
    let timer = null;
    function resetTimer() {
      if (settled) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (settled) return;
        timedOut = true;
        const msg = `[TIMEOUT] Agent killed after ${Math.round(inactivityMs / 1000)}s inactivity for ${featureId}\n`;
        outputStream.write(msg);
        try { proc.kill('SIGTERM'); } catch {}
        setTimeout(() => { try { proc.kill('SIGKILL'); } catch {} }, 10_000);
      }, inactivityMs);
    }
    resetTimer(); // start initial timer

    // Substituir placeholders e enviar prompt via stdin
    let prompt = body;
    if (session) prompt = prompt.replace(/\{session\}/g, session);
    if (sessionDir) prompt = prompt.replace(/\{runs_dir\}/g, sessionDir.replace(/\\/g, '/'));
    proc.stdin.write(prompt);
    proc.stdin.end();

    // Capturar output — reset timer on every data chunk
    proc.stdout.on('data', (chunk) => { outputStream.write(chunk); resetTimer(); });
    proc.stderr.on('data', (chunk) => { outputStream.write(chunk); resetTimer(); });

    proc.on('close', (code) => {
      settled = true;
      if (timer) clearTimeout(timer);
      outputStream.end();
      resolvePromise({ code: timedOut ? 124 : code, pid: proc.pid, timedOut });
    });

    proc.on('error', (err) => {
      settled = true;
      if (timer) clearTimeout(timer);
      outputStream.end();
      reject(err);
    });
  });
}
