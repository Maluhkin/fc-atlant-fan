/* Проверка вёрстки через Chrome DevTools Protocol.
   Запуск: node tools/cdp-check.js [url]
   Требуется установленный Microsoft Edge. Зависимостей нет. */
'use strict';

const { spawn } = require('child_process');
const http = require('http');
const crypto = require('crypto');
const os = require('os');
const path = require('path');
const fs = require('fs');

const EDGE = process.env.EDGE_PATH ||
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const URL_BASE = process.argv[2] || 'http://localhost:4173/';
const PORT = 9333;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function httpJson(pathname, method) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port: PORT, path: pathname, method: method || 'GET' },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try { resolve(JSON.parse(d)); } catch (e) { reject(new Error('bad json: ' + d.slice(0, 200))); }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

/* ---------- минимальный WebSocket-клиент ---------- */

class WS {
  constructor(socket) {
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this.handlers = new Map();
    this.nextId = 1;
    this.onEvent = null;
    socket.on('data', (chunk) => this._feed(chunk));
  }

  static connect(url) {
    const u = new URL(url);
    return new Promise((resolve, reject) => {
      const key = crypto.randomBytes(16).toString('base64');
      const req = http.request({
        host: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        headers: {
          Connection: 'Upgrade',
          Upgrade: 'websocket',
          'Sec-WebSocket-Key': key,
          'Sec-WebSocket-Version': '13'
        }
      });
      req.on('upgrade', (res, socket) => {
        const accept = crypto
          .createHash('sha1')
          .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
          .digest('base64');
        if (res.headers['sec-websocket-accept'] !== accept) {
          socket.destroy();
          reject(new Error('bad handshake'));
          return;
        }
        resolve(new WS(socket));
      });
      req.on('error', reject);
      req.end();
    });
  }

  _feed(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (true) {
      const b = this.buffer;
      if (b.length < 2) return;
      const opcode = b[0] & 0x0f;
      const masked = (b[1] & 0x80) !== 0;
      let len = b[1] & 0x7f;
      let off = 2;
      if (len === 126) {
        if (b.length < 4) return;
        len = b.readUInt16BE(2);
        off = 4;
      } else if (len === 127) {
        if (b.length < 10) return;
        len = Number(b.readBigUInt64BE(2));
        off = 10;
      }
      let maskKey = null;
      if (masked) {
        if (b.length < off + 4) return;
        maskKey = b.slice(off, off + 4);
        off += 4;
      }
      if (b.length < off + len) return;
      let payload = b.slice(off, off + len);
      if (maskKey) {
        const out = Buffer.alloc(payload.length);
        for (let i = 0; i < payload.length; i++) out[i] = payload[i] ^ maskKey[i % 4];
        payload = out;
      }
      this.buffer = b.slice(off + len);

      if (opcode === 1) {
        let msg;
        try { msg = JSON.parse(payload.toString('utf8')); } catch (e) { continue; }
        if (msg.id && this.handlers.has(msg.id)) {
          const h = this.handlers.get(msg.id);
          this.handlers.delete(msg.id);
          h(msg);
        } else if (msg.method && this.onEvent) {
          this.onEvent(msg);
        }
      } else if (opcode === 8) {
        this.socket.destroy();
        return;
      }
    }
  }

  send(method, params) {
    const id = this.nextId++;
    const data = Buffer.from(JSON.stringify({ id, method, params: params || {} }));
    const len = data.length;
    let header;
    if (len < 126) {
      header = Buffer.from([0x81, 0x80 | len]);
    } else if (len < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 0x80 | 127;
      header.writeBigUInt64BE(BigInt(len), 2);
    }
    const mask = crypto.randomBytes(4);
    const masked = Buffer.alloc(len);
    for (let i = 0; i < len; i++) masked[i] = data[i] ^ mask[i % 4];
    this.socket.write(Buffer.concat([header, mask, masked]));

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.handlers.delete(id);
        reject(new Error('timeout: ' + method));
      }, 15000);
      this.handlers.set(id, (msg) => {
        clearTimeout(timer);
        if (msg.error) reject(new Error(method + ': ' + JSON.stringify(msg.error)));
        else resolve(msg.result);
      });
    });
  }

  close() { this.socket.destroy(); }
}

/* ---------- проверяемые свойства ---------- */

const MEASURE = `(function () {
  var vw = window.innerWidth;
  var out = {
    route: location.hash,
    viewport: vw,
    docScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    overflow: [],
    clipped: [],
    tabs: document.querySelectorAll('.tabbar .tab').length,
    tabLabels: Array.prototype.map.call(document.querySelectorAll('.tabbar .tab span'), function (s) { return s.textContent; }),
    activeTab: (document.querySelector('.tab.is-active span') || {}).textContent || null,
    countdownCells: document.querySelectorAll('.countdown__cell').length,
    countdown: Array.prototype.map.call(document.querySelectorAll('.countdown__cell b'), function (b) { return b.textContent; }),
    heroDate: (document.querySelector('.hero__date') || {}).textContent || null,
    matches: Array.prototype.map.call(document.querySelectorAll('.match__sub'), function (s) { return s.textContent; }),
    title: document.title
  };
  var els = document.querySelectorAll('.app *');
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    var r = el.getBoundingClientRect();
    if (r.width && r.right > vw + 0.5 && out.overflow.length < 6) {
      out.overflow.push({ cls: String(el.className).slice(0, 40), right: Math.round(r.right), text: (el.textContent || '').slice(0, 30) });
    }
    var cs = getComputedStyle(el);
    if ((cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 2 && out.clipped.length < 8) {
      out.clipped.push({ cls: String(el.className).slice(0, 40), scroll: el.scrollWidth, client: el.clientWidth, text: (el.textContent || '').slice(0, 34) });
    }
  }
  return JSON.stringify(out);
})()`;

async function main() {
  const profile = path.join(os.tmpdir(), 'agenthere', 'cdp-' + Date.now());
  fs.mkdirSync(profile, { recursive: true });

  const edge = spawn(EDGE, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + profile,
    '--window-size=390,844',
    'about:blank'
  ], { stdio: 'ignore' });

  // ждём отладочный порт
  let version = null;
  for (let i = 0; i < 60; i++) {
    try { version = await httpJson('/json/version'); break; } catch (e) { await sleep(250); }
  }
  if (!version) { console.error('Edge не поднял отладочный порт'); edge.kill(); process.exit(1); }

  const targets = await httpJson('/json/list');
  const page = targets.find((t) => t.type === 'page');
  if (!page) { console.error('Нет вкладки'); edge.kill(); process.exit(1); }

  const ws = await WS.connect(page.webSocketDebuggerUrl);
  const errors = [];
  ws.onEvent = (msg) => {
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      errors.push('exception: ' + (d.exception && d.exception.description || d.text));
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errors.push('console.error: ' + msg.params.args.map((a) => a.value || a.description).join(' '));
    }
  };

  await ws.send('Runtime.enable');
  await ws.send('Page.enable');
  await ws.send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 1, mobile: true
  });

  const routes = ['#home', '#matches', '#table', '#squad', '#news', '#news/n5', '#tickets'];
  const results = [];

  await ws.send('Page.navigate', { url: URL_BASE + '#home' });
  await sleep(1800);

  for (const route of routes) {
    await ws.send('Runtime.evaluate', { expression: `location.hash = '${route}'` });
    await sleep(500);
    const res = await ws.send('Runtime.evaluate', { expression: MEASURE, returnByValue: true });
    results.push(JSON.parse(res.result.value));
  }

  // узкий экран 360 px
  await ws.send('Emulation.setDeviceMetricsOverride', { width: 360, height: 780, deviceScaleFactor: 1, mobile: true });
  await sleep(300);
  await ws.send('Runtime.evaluate', { expression: "location.hash = '#table'" });
  await sleep(400);
  const narrow = await ws.send('Runtime.evaluate', { expression: MEASURE, returnByValue: true });

  // офлайн-режим: service worker должен отдать приложение из кэша
  await ws.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await ws.send('Network.enable');
  await ws.send('Network.emulateNetworkConditions', {
    offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0
  });
  await ws.send('Page.navigate', { url: URL_BASE + '#home' });
  await sleep(1600);
  const offlineRes = await ws.send('Runtime.evaluate', {
    expression: `JSON.stringify({
      hero: document.querySelectorAll('.hero').length,
      tabs: document.querySelectorAll('.tabbar .tab').length,
      newsCards: document.querySelectorAll('.news-card').length,
      title: document.title,
      navType: (performance.getEntriesByType('navigation')[0] || {}).type || null
    })`,
    returnByValue: true
  });
  await ws.send('Network.emulateNetworkConditions', {
    offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1
  });

  const report = {
    viewport: 390,
    routes: results,
    narrow360: JSON.parse(narrow.result.value),
    offline: JSON.parse(offlineRes.result.value),
    errors
  };

  fs.writeFileSync(path.join(__dirname, '..', 'shots', 'layout-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));

  ws.close();
  edge.kill();
  await sleep(300);
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
}

main().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
