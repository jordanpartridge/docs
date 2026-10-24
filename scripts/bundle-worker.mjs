// Fallback deploy without wrangler login: bundle the built site into one self-contained
// Worker module (.worker/worker.js) that can be uploaded through the Cloudflare API
// (PUT /accounts/:id/workers/scripts/docs). The normal path is `npx wrangler deploy`.
import fs from 'node:fs'
import path from 'node:path'

const dist = path.resolve(import.meta.dirname, '..', 'src', '.vitepress', 'dist')
const types = { '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' }
const files = {}
for (const f of fs.readdirSync(dist, { recursive: true })) {
  const p = path.join(dist, f)
  if (!fs.statSync(p).isFile()) continue
  files['/' + f.split(path.sep).join('/')] = [types[path.extname(f)] ?? 'application/octet-stream', fs.readFileSync(p).toString('base64')]
}
const worker = `const FILES = ${JSON.stringify(files)};
const cache = new Map();
function body(p) { let b = cache.get(p); if (!b) { const s = atob(FILES[p][1]); b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); cache.set(p, b); } return b; }
function serve(p, status = 200) {
  const h = { 'content-type': FILES[p][0], 'x-content-type-options': 'nosniff' };
  h['cache-control'] = p.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=300';
  if (p === '/llms.txt' || p === '/llms-full.txt' || p === '/hire.json') h['access-control-allow-origin'] = '*';
  return new Response(body(p), { status, headers: h });
}
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
    const p = decodeURIComponent(url.pathname);
    if (p === '/') return serve('/index.html');
    if (p.endsWith('/index.html')) return Response.redirect(url.origin + p.slice(0, -10) + url.search, 301);
    if (p.endsWith('.html') && FILES[p]) return Response.redirect(url.origin + p.slice(0, -5) + url.search, 301);
    if (p.length > 1 && p.endsWith('/')) { const q = p.slice(0, -1); if (FILES[q + '.html'] || FILES[q + '/index.html']) return Response.redirect(url.origin + q + url.search, 301); }
    if (FILES[p]) return serve(p);
    if (FILES[p + '.html']) return serve(p + '.html');
    if (FILES[p + '/index.html']) return serve(p + '/index.html');
    return serve('/404.html', 404);
  }
};
`
fs.mkdirSync(path.resolve(import.meta.dirname, '..', '.worker'), { recursive: true })
fs.writeFileSync(path.resolve(import.meta.dirname, '..', '.worker', 'worker.js'), worker)
console.log(`.worker/worker.js: ${Object.keys(files).length} files, ${(worker.length / 1024).toFixed(0)} KiB`)
