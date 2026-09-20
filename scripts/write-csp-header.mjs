import { writeFileSync } from 'node:fs';
import { loadEnv } from 'vite';
import { createCsp } from '../security/csp.mjs';

const output = process.argv[2];
const mode = process.argv[3] || 'production';
if (!output) throw new Error('Provide the output .conf path');
const env = loadEnv(mode, process.cwd(), 'VITE_');
const policy = createCsp({ env, development: false });
// Guard the Nginx quoted value if the builder is later extended.
if (/["\\\r\n$]/.test(policy)) throw new Error('Unsafe Nginx policy value');
const lines = [
  'add_header X-Frame-Options "SAMEORIGIN" always;',
  'add_header X-Content-Type-Options "nosniff" always;',
  'add_header X-XSS-Protection "1; mode=block" always;',
  'add_header Referrer-Policy "no-referrer-when-downgrade" always;',
  `add_header Content-Security-Policy "${policy}" always;`,
];
writeFileSync(output, `${lines.join('\n')}\n`);
