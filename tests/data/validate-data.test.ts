import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('static data validation', () => {
  it('passes the repository data validation script', () => {
    const output = execFileSync('node', ['scripts/validate-data.mjs'], {
      encoding: 'utf8',
    });

    expect(output).toContain('Validated 3 stock fixture(s).');
  });

  it('validates generated data artifacts', () => {
    const output = execFileSync('node', ['scripts/generate-static-data.mjs'], {
      encoding: 'utf8',
    });

    expect(output).toContain('Generated static data check artifacts.');
    expect(existsSync('dist-data-check/stocks.json')).toBe(true);
  });
});
