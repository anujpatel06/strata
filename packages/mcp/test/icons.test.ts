/**
 * find_icon. The names come from packages/icons/src, so this test imports the real package and checks the parser
 * against it: a name the tool returns must be a name an agent can import.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SYNONYMS, allIcons, exportedGroups, iconExports, queryWords, wordsOf } from '../src/icons';
import { findRoot } from '../src/root';
import { connect, type Harness } from './helpers';

const root = findRoot();
let real: Set<string>;
let h: Harness;

beforeAll(async () => {
  const mod = (await import(pathToFileURL(join(root, 'packages/icons/src/index.ts')).href)) as Record<string, unknown>;
  real = new Set(Object.keys(mod).filter((k) => /^Icon[A-Z0-9]/.test(k)));
  h = await connect();
});
afterAll(async () => {
  await h.close();
});

/** Every name in a find_icon response, from `icons` and `closest`. */
const namesIn = (json: { icons: Array<{ name: string }>; closest?: string[] }): string[] => [
  ...json.icons.map((i) => i.name),
  ...(json.closest ?? []),
];

describe('reading the icon package', () => {
  it('finds exactly the icons @strata/icons exports', () => {
    const parsed = allIcons(root).map((i) => i.name);
    expect(real.size).toBeGreaterThan(200);
    expect(new Set(parsed)).toEqual(real);
    expect(parsed).toHaveLength(real.size);
  });

  it('gives each icon the file it comes from as its group', () => {
    const groups = new Map(allIcons(root).map((i) => [i.name, i.group]));
    expect(groups.get('IconTrash')).toBe('core');
    expect(groups.get('IconTrophy')).toBe('commerce');
    expect(groups.get('IconSealCheckFilled')).toBe('filled');
  });

  it('reads groups from index.ts and names from createIcon lines only', () => {
    expect(exportedGroups("export { createIcon } from './create-icon';\nexport * from './icons/core';\nexport * from './icons/status.ts';")).toEqual(['core', 'status']);
    const source = [
      "export const IconA = createIcon('a', []);",
      "// export const IconGone = createIcon('gone', []);",
      "const IconHidden = createIcon('hidden', []);",
      "export const IconB: Icon = createIcon('b', []);",
      'export const ICON_SIZE = 24;',
    ].join('\n');
    expect(iconExports(source)).toEqual(['IconA', 'IconB']);
  });

  it('splits names and queries into the same words', () => {
    expect(wordsOf('IconArrowDownLeft')).toEqual(['arrow', 'down', 'left']);
    expect(wordsOf('IconMenu2')).toEqual(['menu', '2']);
    expect(queryWords('IconMailOpened')).toEqual(['mail', 'opened']);
    expect(queryWords('arrow-down  left')).toEqual(['arrow', 'down', 'left']);
    expect(queryWords('Menu2')).toEqual(['menu', '2']);
    expect(queryWords('IconCircleXFilled')).toEqual(wordsOf('IconCircleXFilled'));
    expect(queryWords('icon')).toEqual(['icon']);
    expect(queryWords('!!!')).toEqual([]);
  });
});

describe('synonyms', () => {
  it('point only at real exports', () => {
    for (const [word, targets] of Object.entries(SYNONYMS)) {
      expect(targets.length, word).toBeGreaterThan(0);
      for (const name of targets) expect(real.has(name), `${word} → ${name}`).toBe(true);
    }
  });

  it('are lowercase words a query can produce, with no target listed twice', () => {
    for (const [word, targets] of Object.entries(SYNONYMS)) {
      expect(word, word).toMatch(/^[a-z0-9]+$/);
      expect(new Set(targets).size, word).toBe(targets.length);
    }
  });

  it('add something the names alone would not find', () => {
    // An entry whose every target already has the word in its name is dead weight.
    const icons = allIcons(root);
    for (const [word, targets] of Object.entries(SYNONYMS)) {
      const allNamed = targets.every((t) => icons.find((i) => i.name === t)!.words.includes(word));
      expect(allNamed, word).toBe(false);
    }
  });

  it('leave out "minus": the set has no minus sign, and a wrong icon is worse than none', () => {
    expect(SYNONYMS.minus).toBeUndefined();
  });
});

describe('find_icon', () => {
  it('finds an icon by the word in its name, best first, with its group', async () => {
    const r = await h.call('find_icon', { query: 'trash' });
    expect(r.isError).toBe(false);
    expect(r.json).toEqual({ query: 'trash', icons: [{ name: 'IconTrash', group: 'core' }] });
  });

  it('accepts an export name and ranks the exact name first', async () => {
    const r = await h.call('find_icon', { query: 'IconMail' });
    expect(r.json.icons[0]).toEqual({ name: 'IconMail', group: 'status' });
    expect(r.json.note).toBeUndefined();
  });

  it('ranks the tighter name first', async () => {
    const r = await h.call('find_icon', { query: 'arrow up' });
    expect(r.json.icons.slice(0, 2).map((i: { name: string }) => i.name)).toEqual(['IconArrowUp', 'IconArrowUpRight']);
  });

  it('finds icons through synonyms and says which word led there', async () => {
    const r = await h.call('find_icon', { query: 'award' });
    expect(r.json.icons[0]).toEqual({ name: 'IconTrophy', group: 'commerce', synonymOf: 'award' });
  });

  it('joins two words for a synonym: "sign out"', async () => {
    const r = await h.call('find_icon', { query: 'sign out' });
    expect(r.json.icons[0].name).toBe('IconLogout');
  });

  // The names agents imported in the eval runs, which don't exist (evals/runs/iter-1/INVALID.md, iter-2/NOTES.md).
  const GUESSED: Array<[string, string | null]> = [
    ['IconAward', 'IconTrophy'],
    ['IconMinus', null],
    ['IconContactless', 'IconCreditCard'],
    ['IconMailOpened', 'IconMail'],
    ['IconDeviceTv', 'IconDeviceDesktop'],
    ['IconId', 'IconUser'],
    ['IconClipboardCheck', 'IconCheck'],
    ['IconArrowDown', 'IconArrowDownLeft'],
    ['IconHeartbeat', 'IconHeartPulse'],
    ['IconToolsKitchen2', 'IconShoppingCart'],
    ['IconUserCircle', 'IconUser'],
  ];

  it.each(GUESSED)('says %s is not exported, and offers only real names', async (query, first) => {
    const r = await h.call('find_icon', { query });
    expect(r.isError).toBe(false);
    expect(real.has(query)).toBe(false);
    expect(r.json.note).toContain(`${query} is not exported by @strata/icons`);
    for (const name of namesIn(r.json)) expect(real.has(name), name).toBe(true);
    if (first === null) expect(r.json.icons).toEqual([]);
    else expect(r.json.icons[0].name).toBe(first);
  });

  it('says clearly when nothing matches, and lists the closest real names', async () => {
    const r = await h.call('find_icon', { query: 'minus' });
    expect(r.isError).toBe(false);
    expect(r.json.icons).toEqual([]);
    expect(r.json.note).toMatch(/^No icon matches "minus"\./);
    expect(r.json.note).toContain('use no icon');
    expect(r.json.closest.length).toBeGreaterThan(0);
    for (const name of r.json.closest) expect(real.has(name), name).toBe(true);
  });

  it('says which words matched nothing', async () => {
    const r = await h.call('find_icon', { query: 'mail zebra' });
    expect(r.json.icons[0].name).toBe('IconMail');
    expect(r.json.note).toBe('No icon matches "zebra". These match the other words.');
  });

  it('never returns a name that is not exported', async () => {
    const icons = allIcons(root);
    const queries = [
      ...Object.keys(SYNONYMS),
      ...new Set(icons.flatMap((i) => i.words)),
      ...icons.map((i) => i.name),
      'zzzz', 'qwerty uiop', 'IconNothingHere', 'a', '12', 'Icon2',
    ];
    for (const query of queries) {
      const r = await h.call('find_icon', { query, limit: 30 });
      expect(r.isError, query).toBe(false);
      for (const name of namesIn(r.json)) expect(real.has(name), `${query} → ${name}`).toBe(true);
    }
  });

  it('finds every icon by its own name, first', async () => {
    for (const icon of allIcons(root)) {
      const r = await h.call('find_icon', { query: icon.name });
      expect(r.json.icons[0].name, icon.name).toBe(icon.name);
    }
  });

  it('returns 8 icons by default and respects limit', async () => {
    expect((await h.call('find_icon', { query: 'arrow' })).json.icons).toHaveLength(8);
    expect((await h.call('find_icon', { query: 'arrow', limit: 3 })).json.icons).toHaveLength(3);
  });

  it('refuses a missing, empty, oversized or unreadable query, and a bad limit', async () => {
    expect((await h.call('find_icon', {})).isError).toBe(true);
    expect((await h.call('find_icon', { query: '' })).isError).toBe(true);
    expect((await h.call('find_icon', { query: 'a'.repeat(65) })).isError).toBe(true);
    expect((await h.call('find_icon', { query: 3 })).isError).toBe(true);
    for (const limit of [0, 31, 2.5, '8']) expect((await h.call('find_icon', { query: 'arrow', limit })).isError, String(limit)).toBe(true);
    const r = await h.call('find_icon', { query: '!!!' });
    expect(r.isError).toBe(true);
    expect(r.json.error).toContain('no letters or digits');
  });

  it('treats a path as words, and reads no file outside the icon package', async () => {
    const r = await h.call('find_icon', { query: '../../etc/passwd' });
    expect(r.isError).toBe(false);
    expect(r.text).not.toMatch(/root:/);
    for (const name of namesIn(r.json)) expect(real.has(name)).toBe(true);
  });
});

describe('find_icon in a repo with other icons', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'strata-mcp-icons-'));
  mkdirSync(join(tmp, 'packages/react/meta'), { recursive: true });
  afterAll(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('returns an error, not a crash, when the icon package is missing', async () => {
    const t = await connect({ root: tmp });
    const r = await t.call('find_icon', { query: 'trash' });
    expect(r.isError).toBe(true);
    expect(r.json.error).toContain("don't guess an icon name");
    await t.close();
  });

  it('reads names at request time, so a new icon shows up without a restart', async () => {
    mkdirSync(join(tmp, 'packages/icons/src/icons'), { recursive: true });
    writeFileSync(join(tmp, 'packages/icons/src/index.ts'), "export * from './icons/core';\n");
    writeFileSync(join(tmp, 'packages/icons/src/icons/core.ts'), "export const IconTrash = createIcon('trash', []);\n");
    const t = await connect({ root: tmp });
    expect((await t.call('find_icon', { query: 'minus' })).json.icons).toEqual([]);
    writeFileSync(
      join(tmp, 'packages/icons/src/icons/core.ts'),
      "export const IconTrash = createIcon('trash', []);\nexport const IconMinus = createIcon('minus', []);\n",
    );
    expect((await t.call('find_icon', { query: 'minus' })).json.icons).toEqual([{ name: 'IconMinus', group: 'core' }]);
    await t.close();
  });

  it('skips synonyms whose icons this repo does not have', async () => {
    const t = await connect({ root: tmp });
    const r = await t.call('find_icon', { query: 'award' });
    expect(r.json.icons).toEqual([]);
    await t.close();
  });
});
