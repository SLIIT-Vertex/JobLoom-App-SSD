import { test, expect } from '@playwright/test';
import { loadEnv } from 'vite';
import { createCsp } from '../csp.mjs';

const development = process.env.CSP_PROFILE === 'development';
const env = loadEnv(development ? 'development' : 'production', process.cwd(), 'VITE_');
const expectedPolicy = createCsp({ env, development });

for (const path of ['/', '/robots.txt', '/sitemap.xml']) {
  test(`enforcing CSP on original URL ${path}`, async ({ request }) => {
    const response = await request.get(path, {
      headers: { Accept: 'text/html', 'Cache-Control': 'no-cache' },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    expect(await response.text()).toContain('<title>JobLoom</title>');
    expect(response.headers()['content-security-policy']).toBe(expectedPolicy);
    expect(
      response.headersArray().filter(h => h.name.toLowerCase() === 'content-security-policy')
    ).toHaveLength(1);
  });
}

test('home renders without CSP violations from normal resource loading', async ({ page }) => {
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', e => {
      if (e.disposition === 'enforce')
        window.__cspViolations.push({ uri: e.blockedURI, directive: e.effectiveDirective });
    });
  });
  await page.goto('/');
  await expect(page.locator('#root')).not.toBeEmpty();
  await expect(page.getByRole('navigation').first()).toBeVisible();
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => window.__cspViolations)).toEqual([]);
});

for (const kind of ['inline', 'external']) {
  test(`browser blocks unauthorized ${kind} script`, async ({ page }) => {
    test.skip(development && kind === 'inline', 'Development permits the React refresh preamble');
    await page.goto('/');
    const result = await page.evaluate(
      kind =>
        new Promise((resolve, reject) => {
          window.__cspInlineExecuted = false;
          const script = document.createElement('script');
          const timer = setTimeout(() => {
            cleanup();
            reject(new Error('No enforcing script violation observed'));
          }, 5000);
          function cleanup() {
            clearTimeout(timer);
            document.removeEventListener('securitypolicyviolation', listener);
            script.remove();
          }
          function listener(e) {
            const target =
              kind === 'inline'
                ? e.blockedURI === 'inline'
                : e.blockedURI.startsWith('https://jobloom-csp-blocked.invalid');
            if (
              target &&
              e.disposition === 'enforce' &&
              e.effectiveDirective.startsWith('script-src')
            ) {
              cleanup();
              resolve({ blocked: true, inlineExecuted: window.__cspInlineExecuted });
            }
          }
          document.addEventListener('securitypolicyviolation', listener);
          if (kind === 'inline') script.textContent = 'window.__cspInlineExecuted = true';
          else script.src = 'https://jobloom-csp-blocked.invalid/probe.js';
          document.head.appendChild(script);
        }),
      kind
    );
    expect(result).toEqual({ blocked: true, inlineExecuted: false });
  });
}

test('Nginx preserves CSP on static assets, worker, health and errors', async ({ request }) => {
  test.skip(process.env.CSP_SERVER !== 'nginx', 'Nginx-specific header inheritance');
  const root = await request.get('/');
  const script = (await root.text()).match(/src="(\/assets\/[^\"]+\.js)"/);
  expect(script).not.toBeNull();
  for (const [path, status] of [
    [script[1], 200],
    ['/sw.js', 200],
    ['/health', 200],
    ['/assets/csp-proof-missing.js', 404],
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(status);
    expect(response.headers()['content-security-policy'], path).toBe(expectedPolicy);
    if (path === '/sw.js') expect(response.headers()['cache-control']).toBe('no-cache');
  }
});
