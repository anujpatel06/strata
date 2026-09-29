/**
 * Icons, read from packages/icons/src when a tool is called. index.ts says which files are exported; in each file,
 * the exported icon lines give the names. Most icons are a `createIcon(` call; the duotone layer composes its
 * outline twin instead, with `duotone(` or `untinted(` (ADR-036). The group of an icon is the file it lives in.
 *
 * The only hand-kept data is SYNONYMS: product words an agent types that aren't words in any icon name. Every
 * target there is an export name, and test/icons.test.ts checks each one against the real package.
 */
import { existsSync } from 'node:fs';
import { cachedFile } from './cache';
import { closest } from './components';
import { ToolError, inside, isSafeName } from './root';

const ICONS_SRC = 'packages/icons/src';

export interface IconEntry {
  /** The export name, e.g. "IconArrowDownLeft". */
  name: string;
  /** The file it comes from, e.g. "navigation". */
  group: string;
  /** Lowercase words of the name, e.g. ["arrow", "down", "left"]. */
  words: string[];
}

/**
 * Product words → icons that show them, best first. Only words that no icon name contains, or where the name alone
 * would miss the usual meaning. An empty result is better than a wrong icon, so a word with no fitting icon
 * ("minus") is left out on purpose.
 */
export const SYNONYMS: Readonly<Record<string, readonly string[]>> = {
  // Rewards
  award: ['IconTrophy', 'IconStar', 'IconSealCheckFilled'],
  achievement: ['IconTrophy', 'IconStar'],
  medal: ['IconTrophy', 'IconSealCheckFilled'],
  prize: ['IconTrophy', 'IconGift'],
  reward: ['IconGift', 'IconTrophy', 'IconStar'],
  loyalty: ['IconStar', 'IconGift', 'IconCoins'],
  points: ['IconCoins', 'IconStar'],
  favourite: ['IconStar', 'IconHeart'],
  favorite: ['IconStar', 'IconHeart'],
  like: ['IconThumbUp', 'IconHeart'],
  verified: ['IconSealCheckFilled', 'IconShieldCheck', 'IconCircleCheck'],
  // Money
  contactless: ['IconCreditCard', 'IconBroadcast'],
  nfc: ['IconCreditCard', 'IconBroadcast'],
  payment: ['IconCreditCard', 'IconCash', 'IconWallet'],
  pay: ['IconCreditCard', 'IconCash', 'IconWallet'],
  money: ['IconCash', 'IconCoins', 'IconWallet'],
  balance: ['IconWallet', 'IconScale'],
  transfer: ['IconArrowsExchange', 'IconSend'],
  savings: ['IconPiggyBank', 'IconCoins'],
  bill: ['IconFileInvoice', 'IconReceipt'],
  spending: ['IconChartPie', 'IconReceipt'],
  expense: ['IconReceipt', 'IconChartPie'],
  income: ['IconTrendingUp', 'IconCash'],
  investment: ['IconTrendingUp', 'IconChartLine'],
  tax: ['IconCalculator', 'IconReceipt'],
  promo: ['IconDiscount', 'IconTag', 'IconPercentage'],
  coupon: ['IconDiscount', 'IconTicket'],
  offer: ['IconDiscount', 'IconTag'],
  sale: ['IconDiscount', 'IconTag', 'IconPercentage'],
  // Shopping
  basket: ['IconShoppingCart', 'IconShoppingBag'],
  order: ['IconPackage', 'IconShoppingBag'],
  delivery: ['IconTruck', 'IconPackage'],
  shipping: ['IconTruck', 'IconPackage'],
  food: ['IconShoppingCart', 'IconApple'],
  grocery: ['IconShoppingCart', 'IconApple'],
  groceries: ['IconShoppingCart', 'IconApple'],
  kitchen: ['IconShoppingCart', 'IconApple'],
  restaurant: ['IconBuildingStore'],
  shop: ['IconBuildingStore', 'IconShoppingBag'],
  scan: ['IconQrcode', 'IconBarcode'],
  qr: ['IconQrcode'],
  // Mail and messages
  email: ['IconMail', 'IconAt', 'IconInbox'],
  envelope: ['IconMail'],
  opened: ['IconMail', 'IconInbox'],
  unread: ['IconMail', 'IconBell'],
  notification: ['IconBell', 'IconInbox'],
  notifications: ['IconBell', 'IconInbox'],
  chat: ['IconMessage', 'IconMessageDots'],
  comment: ['IconMessage', 'IconMessageDots'],
  support: ['IconHelpCircle', 'IconMessageDots', 'IconHeadphones'],
  call: ['IconPhoneCall', 'IconPhone'],
  attachment: ['IconPaperclip'],
  // Devices and media
  tv: ['IconDeviceDesktop', 'IconMovie'],
  television: ['IconDeviceDesktop', 'IconMovie'],
  streaming: ['IconMovie', 'IconPlayerPlay'],
  entertainment: ['IconMovie', 'IconMusic'],
  mobile: ['IconDeviceMobile', 'IconPhone'],
  laptop: ['IconDeviceDesktop'],
  computer: ['IconDeviceDesktop'],
  image: ['IconPhoto'],
  picture: ['IconPhoto'],
  // People and identity
  id: ['IconUser', 'IconFingerprint', 'IconFileText'],
  identity: ['IconUser', 'IconFingerprint', 'IconShieldCheck'],
  kyc: ['IconUser', 'IconFileText', 'IconShieldCheck'],
  passport: ['IconFileText', 'IconWorld'],
  profile: ['IconUser'],
  account: ['IconUser', 'IconBuildingBank'],
  avatar: ['IconUser'],
  person: ['IconUser'],
  people: ['IconUsers'],
  team: ['IconUsers'],
  members: ['IconUsers'],
  invite: ['IconUserPlus'],
  // Security
  password: ['IconLock', 'IconKey'],
  security: ['IconShieldLock', 'IconLock', 'IconShieldCheck'],
  secure: ['IconShieldLock', 'IconLock'],
  otp: ['IconShieldCheck', 'IconDeviceMobile', 'IconKey'],
  '2fa': ['IconShieldCheck', 'IconDeviceMobile', 'IconKey'],
  unlock: ['IconLockOpen'],
  show: ['IconEye'],
  hide: ['IconEyeOff'],
  visibility: ['IconEye', 'IconEyeOff'],
  // Documents and tasks
  clipboard: ['IconCopy', 'IconFileText'],
  checklist: ['IconLayoutList', 'IconCircleCheck'],
  task: ['IconCircleCheck', 'IconLayoutList'],
  todo: ['IconCircleCheck', 'IconLayoutList'],
  document: ['IconFileText', 'IconFile'],
  statement: ['IconFileText', 'IconReceipt'],
  policy: ['IconShieldCheck', 'IconFileText'],
  claim: ['IconFileText', 'IconReceipt'],
  report: ['IconChartBar', 'IconFileText'],
  // Status
  success: ['IconCircleCheck', 'IconCircleCheckFilled', 'IconCheck'],
  done: ['IconCircleCheck', 'IconCheck'],
  complete: ['IconCircleCheck', 'IconCheck'],
  approved: ['IconCircleCheck', 'IconSealCheckFilled'],
  error: ['IconCircleX', 'IconAlertCircle'],
  failed: ['IconCircleX', 'IconAlertCircle'],
  warning: ['IconAlertTriangle', 'IconAlertTriangleFilled'],
  danger: ['IconAlertTriangle', 'IconAlertCircle'],
  pending: ['IconClock', 'IconHourglass'],
  information: ['IconInfoCircle'],
  question: ['IconHelpCircle'],
  faq: ['IconHelpCircle'],
  time: ['IconClock'],
  recent: ['IconHistory', 'IconClock'],
  schedule: ['IconCalendarEvent', 'IconCalendar'],
  date: ['IconCalendar'],
  due: ['IconCalendarEvent', 'IconAlarm'],
  reminder: ['IconAlarm', 'IconBell'],
  // Actions
  add: ['IconPlus'],
  new: ['IconPlus'],
  create: ['IconPlus'],
  increase: ['IconPlus', 'IconTrendingUp'],
  remove: ['IconX', 'IconTrash'],
  delete: ['IconTrash'],
  bin: ['IconTrash'],
  close: ['IconX'],
  dismiss: ['IconX'],
  cancel: ['IconX', 'IconCircleX'],
  edit: ['IconPencil'],
  pen: ['IconPencil'],
  rename: ['IconPencil'],
  gear: ['IconSettings'],
  preferences: ['IconSettings', 'IconAdjustmentsHorizontal'],
  options: ['IconDotsVertical', 'IconAdjustmentsHorizontal'],
  more: ['IconDotsVertical', 'IconDots'],
  kebab: ['IconDotsVertical'],
  ellipsis: ['IconDots'],
  hamburger: ['IconMenu2'],
  navigation: ['IconMenu2'],
  retry: ['IconRefresh'],
  reload: ['IconRefresh'],
  sync: ['IconRefresh'],
  undo: ['IconRotate', 'IconHistory'],
  open: ['IconExternalLink'],
  back: ['IconArrowLeft', 'IconChevronLeft'],
  previous: ['IconChevronLeft', 'IconArrowLeft'],
  next: ['IconChevronRight', 'IconArrowRight'],
  forward: ['IconArrowRight', 'IconChevronRight'],
  expand: ['IconChevronDown'],
  collapse: ['IconChevronDown'],
  signout: ['IconLogout'],
  exit: ['IconLogout'],
  find: ['IconSearch'],
  magnifier: ['IconSearch'],
  // Direction
  growth: ['IconTrendingUp', 'IconArrowUpRight'],
  rise: ['IconTrendingUp', 'IconArrowUpRight'],
  drop: ['IconTrendingDown', 'IconArrowDownRight'],
  fall: ['IconTrendingDown', 'IconArrowDownRight'],
  decline: ['IconTrendingDown', 'IconArrowDownRight'],
  incoming: ['IconArrowDownLeft'],
  received: ['IconArrowDownLeft'],
  outgoing: ['IconArrowUpRight'],
  sent: ['IconArrowUpRight', 'IconSend'],
  // Places and travel
  location: ['IconMapPin'],
  address: ['IconMapPin', 'IconHome'],
  flight: ['IconPlane'],
  travel: ['IconPlane', 'IconLuggage'],
  language: ['IconWorld'],
  globe: ['IconWorld'],
  international: ['IconWorld'],
  dashboard: ['IconLayoutDashboard', 'IconHome'],
  // Health
  health: ['IconHeartPulse', 'IconStethoscope'],
  heartbeat: ['IconHeartPulse'],
  medical: ['IconStethoscope', 'IconFirstAidKit'],
  insurance: ['IconShieldCheck', 'IconUmbrella'],
  doctor: ['IconStethoscope'],
  medicine: ['IconPill', 'IconCapsule'],
  fitness: ['IconDumbbell', 'IconWalk'],
  // Utilities and system
  electricity: ['IconBolt', 'IconPlug'],
  utility: ['IconBolt', 'IconDroplet'],
  water: ['IconDroplet'],
  instant: ['IconBolt'],
  fast: ['IconBolt'],
  ai: ['IconSparkles', 'IconWand'],
  magic: ['IconWand', 'IconSparkles'],
  theme: ['IconSun', 'IconMoon'],
  dark: ['IconMoon'],
  light: ['IconSun'],
};

/** "IconArrowDownLeft" → ["arrow", "down", "left"]; "IconMenu2" → ["menu", "2"]. */
export function wordsOf(name: string): string[] {
  return (name.replace(/^Icon/, '').match(/[A-Z][a-z]*|[0-9]+/g) ?? []).map((w) => w.toLowerCase());
}

/** Files index.ts re-exports from ./icons/, in order: the groups. */
export function exportedGroups(indexSource: string): string[] {
  const groups: string[] = [];
  for (const m of indexSource.matchAll(/^\s*export\s*\*\s*from\s*['"]\.\/icons\/([a-z0-9-]+)(?:\.tsx?)?['"]/gm)) {
    if (isSafeName(m[1]!) && !groups.includes(m[1]!)) groups.push(m[1]!);
  }
  return groups;
}

/** `export const IconX = createIcon(` (or `duotone(` / `untinted(`) at the start of a line, in source order. */
export function iconExports(source: string): string[] {
  return [
    ...source.matchAll(/^export\s+const\s+(Icon[A-Z0-9][A-Za-z0-9]*)\s*(?::[^=]+)?=\s*(?:createIcon|duotone|untinted)\s*\(/gm),
  ].map((m) => m[1]!);
}

/** Every exported icon, read from the package source (cached until a file changes). */
export function allIcons(root: string): IconEntry[] {
  const index = inside(root, ICONS_SRC, 'index.ts');
  if (!existsSync(index)) {
    throw new ToolError(`${ICONS_SRC}/index.ts is missing, so there are no icons to search. Tell the user; don't guess an icon name.`);
  }
  const groups = cachedFile('icon-groups', index, exportedGroups);
  const seen = new Set<string>();
  const out: IconEntry[] = [];
  for (const group of groups) {
    const file = inside(root, ICONS_SRC, 'icons', `${group}.ts`);
    if (!existsSync(file)) continue;
    for (const name of cachedFile('icon-names', file, iconExports)) {
      if (seen.has(name)) continue;
      seen.add(name);
      out.push({ name, group, words: wordsOf(name) });
    }
  }
  return out;
}

/** The words of a query, split like names are: camelCase, letters and digits, separators. A leading "icon" is dropped. */
export function queryWords(query: string): string[] {
  const words = query
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-zA-Z])([0-9])|([0-9])([a-zA-Z])/g, '$1$3 $2$4')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w !== '');
  if (words[0] === 'icon' && words.length > 1) words.shift();
  return [...new Set(words)].slice(0, 8);
}

/** A number in a name only tells variants apart (IconMenu2, IconTerminal2); on its own it describes nothing. */
const isNumber = (w: string): boolean => /^\d+$/.test(w);

/** How well one query word fits one icon word: SAME, PREFIX (three letters or more) or 0. */
function wordFit(q: string, w: string): number {
  if (q === w) return SAME;
  if ((q === `${w}s` && w.length >= 4) || (w === `${q}s` && q.length >= 4)) return SAME;
  if (q.length >= 3 && w.startsWith(q)) return PREFIX;
  if (w.length >= 4 && q.startsWith(w)) return PREFIX;
  return 0;
}

export interface IconMatch {
  name: string;
  group: string;
  /** The query word that led here through the synonym list, when the name itself doesn't contain it. */
  synonymOf?: string;
}

interface Scored extends IconMatch {
  score: number;
  covered: Set<string>;
}

/** Points for a query word found in the name, as the same word or its plural. */
const SAME = 10;
/** Points for a query word that leads to the icon through SYNONYMS, minus half a point per place down its list. */
const SYNONYM = 7;
/** Points for a query word that starts an icon word, or the other way round ("calend" → calendar). */
const PREFIX = 4;
/** Bonus when the query and the name have exactly the same words. */
const EXACT = 5;
/** Deducted for each word of the name the query didn't ask for, so "arrow up" ranks IconArrowUp above IconArrowUpRight. */
const EXTRA_WORD = 0.5;

/** Synonym keys for a query: each word, and adjacent pairs joined ("sign out" → "signout", "id card" → "idcard"). */
function synonymKeys(words: string[]): Array<{ key: string; covers: string[] }> {
  const keys = words.map((w) => ({ key: w, covers: [w] }));
  for (let i = 0; i + 1 < words.length; i++) keys.push({ key: words[i]! + words[i + 1]!, covers: [words[i]!, words[i + 1]!] });
  return keys;
}

export const DEFAULT_ICON_LIMIT = 8;

export function findIcon(root: string, query: string, limit = DEFAULT_ICON_LIMIT): Record<string, unknown> {
  const words = queryWords(query);
  if (words.length === 0) {
    throw new ToolError('The query has no letters or digits. Describe the icon in a word or two, e.g. "trash" or "arrow down".');
  }
  const icons = allIcons(root);
  if (icons.length === 0) throw new ToolError(`No icons found in ${ICONS_SRC}. Tell the user; don't guess an icon name.`);

  const synonymHits = new Map<string, Array<{ rank: number; word: string; covers: string[] }>>();
  for (const { key, covers } of synonymKeys(words)) {
    (SYNONYMS[key] ?? []).forEach((name, rank) => {
      synonymHits.set(name, [...(synonymHits.get(name) ?? []), { rank, word: key, covers }]);
    });
  }
  const asName = query.trim();
  // A query written as an export name ("IconArrowDown") is usually a guess; say plainly when it doesn't exist.
  const guessedName = /^Icon[A-Z0-9]/.test(asName) && !icons.some((i) => i.name === asName);

  // How many names use each word. A rarer word says more ("down" more than "arrow"), so it breaks ties.
  // Plurals count with their singular: "arrows" (IconArrowsSort) is a use of "arrow".
  const base = (w: string): string => (w.length >= 5 && w.endsWith('s') ? w.slice(0, -1) : w);
  const uses = new Map<string, number>();
  for (const icon of icons) for (const w of new Set(icon.words.map(base))) uses.set(w, (uses.get(w) ?? 0) + 1);

  const scored: Scored[] = [];
  for (const icon of icons) {
    // The best way each query word reaches this icon: through a word in its name, or through a synonym.
    const best = new Map<string, { points: number; iconWord?: string; synonym?: string }>();
    for (const q of words) {
      for (const w of icon.words) {
        const fit = wordFit(q, w);
        if (fit > (best.get(q)?.points ?? 0)) best.set(q, { points: fit, iconWord: w });
      }
    }
    for (const syn of synonymHits.get(icon.name) ?? []) {
      const points = SYNONYM - syn.rank * 0.5;
      for (const q of syn.covers) if (points > (best.get(q)?.points ?? 0)) best.set(q, { points, synonym: syn.word });
    }
    if ([...best.keys()].every(isNumber)) continue;
    const hits = [...best.values()];
    const usedWords = new Set(hits.flatMap((b) => (b.iconWord ? [b.iconWord] : [])));
    let score = hits.reduce((sum, b) => sum + b.points + (b.iconWord ? 1 / (uses.get(base(b.iconWord)) ?? 1) : 0), 0);
    // A match through synonyms alone keeps its list order, so extra words only count against names that matched.
    if (usedWords.size > 0) score -= EXTRA_WORD * icon.words.filter((w) => !usedWords.has(w) && !isNumber(w)).length;
    const exact = words.length === icon.words.length && icon.words.every((w) => words.includes(w));
    if (exact) score += EXACT;
    const synonymOf = hits.find((b) => b.synonym)?.synonym;
    scored.push({ name: icon.name, group: icon.group, score, covered: new Set(best.keys()), ...(synonymOf ? { synonymOf } : {}) });
  }
  scored.sort((a, b) => b.score - a.score || a.name.length - b.name.length || a.name.localeCompare(b.name));

  if (scored.length === 0) {
    const kebab = new Map(icons.map((i) => [i.words.join('-'), i.name]));
    const near = closest(words.join('-'), [...kebab.keys()], 5).map((k) => kebab.get(k)!);
    return {
      query,
      icons: [],
      closest: near,
      note:
        (guessedName ? `${asName} is not exported by @syntara/icons. ` : '') +
        (near.length > 0
          ? `No icon matches "${query}". The closest names are only spelled alike; use one only if it means what you need, otherwise use no icon.`
          : `No icon matches "${query}", and no name is close. Try another word, or use no icon.`),
    };
  }

  const top = scored.slice(0, limit);
  const described = words.filter((w) => !isNumber(w));
  const missing = described.filter((w) => !scored.some((s) => s.covered.has(w)));
  const full = scored.some((s) => described.every((w) => s.covered.has(w)));
  const note = guessedName
    ? `${asName} is not exported by @syntara/icons. Use one of these real names, or no icon.`
    : missing.length > 0
      ? `No icon matches ${missing.map((w) => `"${w}"`).join(' or ')}. These match the other words.`
      : !full
        ? `No icon matches every word of "${query}". These match some of them.`
        : undefined;
  return {
    query,
    icons: top.map(({ name, group, synonymOf }) => ({ name, group, ...(synonymOf ? { synonymOf } : {}) })),
    ...(note ? { note } : {}),
  };
}
