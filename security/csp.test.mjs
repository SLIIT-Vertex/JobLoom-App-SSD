import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCsp } from './csp.mjs';

const env = { VITE_API_URL: 'https://api.jobloom.test/api', VITE_JITSI_DOMAIN: 'meet.jit.si' };
const directives = policy =>
  Object.fromEntries(
    policy.split('; ').map(entry => {
      const [name, ...sources] = entry.split(' ');
      return [name, sources];
    })
  );

test('production restricts scripts and preserves required integration origins', () => {
  const policy = directives(createCsp({ env }));
  assert.deepEqual(policy['object-src'], ["'none'"]);
  assert.deepEqual(policy['base-uri'], ["'none'"]);
  assert.deepEqual(policy['script-src-attr'], ["'none'"]);
  for (const source of ["'unsafe-inline'", "'unsafe-eval'", '*', 'data:', 'blob:']) {
    assert.ok(!policy['script-src'].includes(source));
  }
  assert.ok(policy['script-src'].includes('https://meet.jit.si'));
  assert.ok(policy['frame-src'].includes('https://meet.jit.si'));
  assert.ok(policy['connect-src'].includes('https://api.jobloom.test'));
  assert.ok(!createCsp({ env }).includes('https://api.jobloom.test/api'));
  assert.ok(policy['img-src'].includes('blob:'));
  assert.ok(policy['worker-src'].includes("'self'"));
  assert.ok(!createCsp({ env }).includes('localhost'));
});

test('development permits refresh only in development and keeps handler attributes blocked', () => {
  const policy = directives(createCsp({ development: true }));
  assert.ok(policy['script-src'].includes("'unsafe-inline'"));
  assert.ok(policy['connect-src'].includes('ws://localhost:5173'));
  assert.deepEqual(policy['script-src-attr'], ["'none'"]);
});

test('same-origin API and custom Jitsi are supported without broad source schemes', () => {
  const policy = directives(
    createCsp({ env: { VITE_API_URL: '/api', VITE_JITSI_DOMAIN: 'video.jobloom.test:8443' } })
  );
  assert.ok(policy['frame-src'].includes('https://video.jobloom.test:8443'));
  assert.equal(policy['connect-src'].filter(value => value === "'self'").length, 1);
  assert.ok(
    !Object.values(policy)
      .flat()
      .some(value => ['http:', 'https:', '*'].includes(value))
  );
});

test('built-app testing can use an HTTP loopback backend', () => {
  for (const host of ['localhost', '127.0.0.1', '[::1]']) {
    assert.ok(
      createCsp({ env: { VITE_API_URL: `http://${host}:3000/api` } }).includes(
        `http://${host}:3000`
      )
    );
  }
});

test('missing, insecure remote, credentialed, and injected configuration is rejected', () => {
  assert.throws(() => createCsp(), /Set VITE_API_URL/);
  for (const api of [
    'http://api.jobloom.test/api',
    'javascript:alert(1)',
    'https://user:password@api.jobloom.test/api',
    '//api.jobloom.test/api',
  ]) {
    assert.throws(() => createCsp({ env: { VITE_API_URL: api } }));
  }
  for (const domain of [
    'meet.jit.si; script-src *',
    'https://meet.jit.si',
    'meet.jit.si/path',
    'meet.jit.si\nadd_header',
  ]) {
    assert.throws(() => createCsp({ env: { ...env, VITE_JITSI_DOMAIN: domain } }));
  }
});
