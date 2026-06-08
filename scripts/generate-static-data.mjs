import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dataRoot = join(root, 'public', 'data');
const generatedRoot = join(root, 'dist-data-check');

if (!existsSync(dataRoot)) {
  throw new Error('Missing public/data source directory.');
}

rmSync(generatedRoot, { recursive: true, force: true });
cpSync(dataRoot, generatedRoot, { recursive: true });

execFileSync(process.execPath, ['scripts/validate-data.mjs', '--data-root', generatedRoot], { stdio: 'inherit' });

console.log('Generated static data check artifacts.');
