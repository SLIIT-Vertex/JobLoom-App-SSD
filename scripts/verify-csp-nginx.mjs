import assert from 'node:assert/strict';
import { createCsp } from '../security/csp.mjs';

const origin = process.argv[2];
if (!origin) throw new Error('Provide the frontend Nginx origin');
const expected = createCsp({ env: process.env });
async function check(path, status = 200) {
  const response = await fetch(new URL(path, origin), {
    redirect: 'manual',
    headers: { Accept: 'text/html', 'Cache-Control': 'no-cache' },
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, status, `${path}: status`);
  assert.equal(response.headers.get('content-security-policy'), expected, `${path}: CSP`);
  console.log(`PASS ${response.status} ${path}: reviewed enforcing CSP`);
  return response;
}
const root = await check('/');
const html = await root.text();
assert.match(html, /<title>JobLoom<\/title>/);
for (const path of ['/robots.txt', '/sitemap.xml']) {
  assert.equal(await (await check(path)).text(), html, `${path}: same HTML fallback`);
}
const script = html.match(/src="(\/assets\/[^\"]+\.js)"/);
const style = html.match(/href="(\/assets\/[^\"]+\.css)"/);
assert.ok(script && style, 'Built entry script and stylesheet must exist');
await check(script[1]);
await check(style[1]);
await check('/manifest.webmanifest');
const worker = await check('/sw.js');
assert.equal(worker.headers.get('cache-control'), 'no-cache');
await check('/health');
await check('/assets/csp-proof-missing.js', 404);
