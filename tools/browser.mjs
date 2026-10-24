// Headless Chrome / Edge over the DevTools protocol, shared by the browser checks (domcompare, consistency-check,
// walk-state-check, mockup/*check). Needs Node 22+ (fetch, WebSocket) and Chrome or Edge (CHROME env var, or the usual
// Windows install paths).
//   const { send, close } = await startBrowser({ profilePrefix, flags, onEvent, onDisconnect });
//   send(method, params, sessionId) -> Promise of the whole reply message ({ id, result } or { id, error })
//   flags       extra Chrome switches (the common ones are always passed)
//   onEvent     called with every protocol event (a message with a method), e.g. Runtime.exceptionThrown
//   onDisconnect called with a reason if Chrome exits or the connection closes before close()
//   close()     closes the connection, stops Chrome and removes its profile
// Scenario code (targets, sessions, evaluation, navigation waits) stays in each check.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function startBrowser({ profilePrefix = 'browser-', flags = [], onEvent, onDisconnect } = {}) {
  const exe = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
  if (!exe) throw new Error('Chrome or Edge required');
  const profile = mkdtempSync(join(tmpdir(), profilePrefix));
  const chrome = spawn(exe, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    '--allow-file-access-from-files', ...flags, 'about:blank'], { stdio: 'ignore' });
  let closing = false, socket, sequence = 0;
  const pending = new Map();
  const lost = reason => { if (!closing) onDisconnect?.(reason); };
  chrome.on('exit', code => lost('Chrome exited ' + code));
  const close = async () => {
    closing = true;
    socket?.close();
    if (chrome.exitCode === null) { const gone = new Promise(r => chrome.once('exit', r)); chrome.kill(); await Promise.race([gone, sleep(3000)]); }
    for (let i = 0; i < 10; i++) { try { rmSync(profile, { recursive: true, force: true }); return; } catch { await sleep(300); } }
  };
  for (let attempt = 0; attempt < 100 && !socket; attempt++) {
    try {
      const port = readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0];
      const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
      const connection = new WebSocket(version.webSocketDebuggerUrl);
      await new Promise((done, fail) => { connection.onopen = done; connection.onerror = fail; });
      socket = connection;
    } catch { await sleep(100); }
  }
  if (!socket) { await close(); throw new Error('no Chrome'); }
  socket.onclose = () => lost('Chrome connection closed: aborting');
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
    else if (message.method) onEvent?.(message);
  };
  const send = (method, params = {}, sessionId) => new Promise(done => {
    const id = ++sequence;
    pending.set(id, done);
    socket.send(JSON.stringify({ id, method, params, sessionId }));
  });
  return { send, close };
}
