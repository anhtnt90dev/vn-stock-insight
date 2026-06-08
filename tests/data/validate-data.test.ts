import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('static data validation', () => {
  it('passes the repository data validation script', () => {
    const output = execFileSync('node', ['scripts/validate-data.mjs'], {
      encoding: 'utf8',
    });

    expect(output).toContain('Validated 3 stock fixture(s).');
  });
});
