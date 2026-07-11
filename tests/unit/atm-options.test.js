import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const indexHtml = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

function readAtmOptions() {
  const declaration = indexHtml.match(/var ATM_OPTIONS=(\{[\s\S]*?\n\});/);
  expect(declaration, 'ATM_OPTIONS declaration must remain in index.html').not.toBeNull();
  return vm.runInNewContext(`(${declaration[1]})`);
}

describe('guided ATM questionnaire options', () => {
  it('keeps all three 10-option groups used by the questionnaire and report', () => {
    const options = readAtmOptions();

    expect(Object.keys(options)).toEqual(['ant', 'tri', 'med']);
    expect(options.ant).toHaveLength(10);
    expect(options.tri).toHaveLength(10);
    expect(options.med).toHaveLength(10);
    expect(indexHtml).toContain('var opts=ATM_OPTIONS[key]||[]');
    expect(indexHtml).toContain('(ATM_OPTIONS[key]||[]).forEach');
  });
});
