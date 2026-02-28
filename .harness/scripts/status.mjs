#!/usr/bin/env node
// =============================================================================
// Harness Status — Visual dashboard para sessions do agent harness
//
// Uso:
//   node .harness/scripts/status.mjs              # todas as sessions
//   node .harness/scripts/status.mjs <session>    # session especifica
//   node .harness/scripts/status.mjs --watch      # refresh a cada 3s
//   node .harness/scripts/status.mjs <session> -w # watch session especifica
// =============================================================================

import { readFile, readdir, access, stat, open } from 'node:fs/promises';
import { join, resolve } from 'node:path';

// --- Cores ANSI ---
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  cyan:    '\x1b[36m',
  white:   '\x1b[37m',
  bgRed:   '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow:'\x1b[43m',
  bgBlue:  '\x1b[44m',
  bgCyan:  '\x1b[46m',
  bgWhite: '\x1b[47m',
};

// --- Icones e labels por status ---
const STATUS_DISPLAY = {
  passing:     { icon: '✔', color: C.green,  bar: '█', label: 'PASS'    },
  failing:     { icon: '✘', color: C.red,    bar: '░', label: 'FAIL'    },
  in_progress: { icon: '⟳', color: C.yellow, bar: '▓', label: 'RUN'     },
  pending:     { icon: '○', color: C.dim,    bar: '░', label: 'PEND'    },
  blocked:     { icon: '⊘', color: C.magenta,bar: '░', label: 'BLOCK'   },
  skipped:     { icon: '⊘', color: C.cyan,   bar: '░', label: 'SKIP'    },
};

const LOOP_STATUS_DISPLAY = {
  running:  { icon: '▶', color: C.green  },
  between:  { icon: '⏸', color: C.yellow },
  exited:   { icon: '■', color: C.dim    },
  starting: { icon: '⏳', color: C.cyan   },
};

// --- Utilidades ---
async function fileExists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function readJson(p) {
  try {
    const raw = await readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch { return null; }
}

function pad(s, n) {
  return String(s).padEnd(n);
}

function padStart(s, n) {
  return String(s).padStart(n);
}

function truncate(s, max) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function relativeTime(isoStr) {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h${mins % 60}m atrás`;
  return `${Math.floor(hrs / 24)}d atrás`;
}

// --- Progress bar ---
function progressBar(done, total, width = 30) {
  const pct = total === 0 ? 0 : done / total;
  const filled = Math.round(pct * width);
  const empty = width - filled;
  const bar = C.green + '█'.repeat(filled) + C.dim + '░'.repeat(empty) + C.reset;
  const label = `${done}/${total}`;
  const pctStr = `${Math.round(pct * 100)}%`;
  return `${bar} ${C.bold}${pctStr}${C.reset} ${C.dim}(${label})${C.reset}`;
}

// --- Ler ultimas mensagens do JSONL mais recente ---
async function getLatestMessages(runsSubdir, count = 3) {
  let jsonlFiles;
  try {
    const entries = await readdir(runsSubdir);
    jsonlFiles = entries.filter(f => f.endsWith('.jsonl'));
  } catch { return []; }

  if (jsonlFiles.length === 0) return [];

  // Encontrar o mais recente por mtime
  let latest = null;
  let latestMtime = 0;
  for (const f of jsonlFiles) {
    const fp = join(runsSubdir, f);
    try {
      const s = await stat(fp);
      if (s.mtimeMs > latestMtime) {
        latestMtime = s.mtimeMs;
        latest = fp;
      }
    } catch {}
  }
  if (!latest) return [];

  // Ler o tail do arquivo (ultimo 64KB e suficiente)
  const TAIL_BYTES = 64 * 1024;
  let tail;
  try {
    const s = await stat(latest);
    const size = s.size;
    if (size === 0) return [];
    const start = Math.max(0, size - TAIL_BYTES);
    const fh = await open(latest, 'r');
    const buf = Buffer.alloc(Math.min(TAIL_BYTES, size));
    await fh.read(buf, 0, buf.length, start);
    await fh.close();
    tail = buf.toString('utf8');
  } catch { return []; }

  // Extrair mensagens de texto do assistant
  const lines = tail.split('\n').filter(l => l.trim());
  const messages = [];

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.type !== 'assistant') continue;
      const content = entry.message?.content;
      if (!Array.isArray(content)) continue;
      for (const block of content) {
        if (block.type === 'text' && block.text?.trim()) {
          // Primeira linha nao-vazia como resumo
          const text = block.text.trim();
          messages.push(text);
        }
      }
    } catch {}
  }

  // Retornar as ultimas N
  return messages.slice(-count);
}

function wrapText(text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    if (current.length + word.length + 1 > maxWidth) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// --- Listar sessions ---
async function listSessions(runsDir) {
  try {
    const entries = await readdir(runsDir, { withFileTypes: true });
    return entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort();
  } catch {
    return [];
  }
}

// --- Renderizar uma session ---
async function renderSession(runsDir, session) {
  const sessionDir = join(runsDir, session);
  const lines = [];

  // Config
  const config = await readJson(join(sessionDir, 'config.json'));
  if (!config) {
    lines.push(`  ${C.dim}(sem config.json)${C.reset}`);
    return lines;
  }

  // Features
  const featuresRaw = await readJson(join(sessionDir, 'features.json'));
  const features = featuresRaw
    ? (Array.isArray(featuresRaw) ? featuresRaw : featuresRaw.features || [])
    : [];

  // Loop state
  const loop = await readJson(join(sessionDir, 'loop.json'));

  // Contagem
  const counts = { passing: 0, failing: 0, in_progress: 0, pending: 0, blocked: 0, skipped: 0 };
  for (const f of features) {
    counts[f.status] = (counts[f.status] || 0) + 1;
  }
  const done = counts.passing + counts.skipped;
  const total = features.length;

  // Header
  const slug = config.slug || session.replace(/--cc$/, '');
  lines.push(`${C.bold}${C.cyan}┌─ ${slug}${C.reset}`);

  // Info line
  const agent = config.agent?.profile || '?';
  const branch = config.branch || '?';
  lines.push(`${C.cyan}│${C.reset}  ${C.dim}agent:${C.reset} ${agent}  ${C.dim}branch:${C.reset} ${branch}`);

  // Loop state
  if (loop) {
    const ls = LOOP_STATUS_DISPLAY[loop.status] || { icon: '?', color: C.dim };
    const feat = loop.current_feature || loop.feature_id || '';
    const updated = relativeTime(loop.updated_at);
    lines.push(`${C.cyan}│${C.reset}  ${C.dim}loop:${C.reset} ${ls.color}${ls.icon} ${loop.status}${C.reset}${feat ? ` → ${C.bold}${feat}${C.reset}` : ''}${updated ? `  ${C.dim}(${updated})${C.reset}` : ''}`);
    if (loop.exit_reason) {
      lines.push(`${C.cyan}│${C.reset}  ${C.dim}exit:${C.reset} ${loop.exit_reason}`);
    }
  } else {
    lines.push(`${C.cyan}│${C.reset}  ${C.dim}loop:${C.reset} ${C.dim}— não iniciado${C.reset}`);
  }

  // Progress bar
  lines.push(`${C.cyan}│${C.reset}`);
  lines.push(`${C.cyan}│${C.reset}  ${progressBar(done, total)}`);

  // Status summary
  const parts = [];
  if (counts.passing)     parts.push(`${C.green}${counts.passing} pass${C.reset}`);
  if (counts.in_progress) parts.push(`${C.yellow}${counts.in_progress} run${C.reset}`);
  if (counts.failing)     parts.push(`${C.red}${counts.failing} fail${C.reset}`);
  if (counts.blocked)     parts.push(`${C.magenta}${counts.blocked} block${C.reset}`);
  if (counts.pending)     parts.push(`${C.dim}${counts.pending} pend${C.reset}`);
  if (counts.skipped)     parts.push(`${C.cyan}${counts.skipped} skip${C.reset}`);
  lines.push(`${C.cyan}│${C.reset}  ${parts.join('  ')}`);

  // Feature list
  lines.push(`${C.cyan}│${C.reset}`);

  const idWidth = 6;
  const nameWidth = 45;

  for (const f of features) {
    const sd = STATUS_DISPLAY[f.status] || STATUS_DISPLAY.pending;
    const icon = `${sd.color}${sd.icon}${C.reset}`;
    const id = pad(f.id, idWidth);
    const name = truncate(f.name, nameWidth);
    const agentTag = f.agent ? `${C.dim}[${f.agent}]${C.reset}` : '';
    const deps = f.dependencies?.length
      ? `${C.dim}← ${f.dependencies.join(',')}${C.reset}`
      : '';

    lines.push(`${C.cyan}│${C.reset}  ${icon} ${C.bold}${id}${C.reset} ${pad(name, nameWidth)} ${agentTag} ${deps}`);
  }

  // Runs dir info + ultimas mensagens do agente
  const runsSubdir = join(sessionDir, 'runs');
  let runFiles = [];
  try {
    runFiles = (await readdir(runsSubdir)).filter(f => f.endsWith('.jsonl'));
  } catch {}

  if (runFiles.length > 0) {
    lines.push(`${C.cyan}│${C.reset}`);

    // Ultimas 3 mensagens do JSONL em andamento
    const msgs = await getLatestMessages(runsSubdir, 3);
    if (msgs.length > 0) {
      lines.push(`${C.cyan}│${C.reset}  ${C.dim}── últimas mensagens do agente ──${C.reset}`);
      const maxW = 56;
      for (let i = 0; i < msgs.length; i++) {
        const isNewest = i === msgs.length - 1;
        // Primeira linha do texto, truncada
        const firstLine = msgs[i].split('\n')[0];
        const wrapped = wrapText(firstLine, maxW);
        for (let j = 0; j < wrapped.length; j++) {
          const prefix = j === 0 ? (isNewest ? `${C.white}▸${C.reset}` : `${C.dim}▸${C.reset}`) : ' ';
          const style = isNewest ? `${C.bold}${C.white}` : C.dim;
          lines.push(`${C.cyan}│${C.reset}  ${prefix} ${style}${wrapped[j]}${C.reset}`);
        }
      }
    }
  }

  lines.push(`${C.cyan}└${'─'.repeat(60)}${C.reset}`);
  return lines;
}

// --- Main ---
async function main() {
  const args = process.argv.slice(2);
  const watch = args.includes('--watch') || args.includes('-w');
  const sessionArg = args.find(a => !a.startsWith('-'));

  const runsDir = join(resolve('.'), '.harness', 'runs');

  const render = async () => {
    const sessions = sessionArg
      ? [sessionArg]
      : await listSessions(runsDir);

    if (sessions.length === 0) {
      console.log(`${C.dim}Nenhuma session encontrada em .harness/runs/${C.reset}`);
      return;
    }

    const output = [];
    output.push('');
    output.push(`${C.bold}${C.white}  ⚡ HARNESS STATUS${C.reset}  ${C.dim}${new Date().toLocaleTimeString()}${C.reset}`);
    output.push('');

    for (const session of sessions) {
      const configExists = await fileExists(join(runsDir, session, 'config.json'));
      if (!configExists) continue;

      const lines = await renderSession(runsDir, session);
      output.push(...lines);
      output.push('');
    }

    if (watch) {
      console.clear();
    }
    console.log(output.join('\n'));
  };

  if (watch) {
    const interval = parseInt(process.env.STATUS_INTERVAL || '3', 10) * 1000;
    await render();
    setInterval(render, interval);
  } else {
    await render();
  }
}

main().catch(err => {
  console.error(`${C.red}Erro: ${err.message}${C.reset}`);
  process.exit(1);
});
