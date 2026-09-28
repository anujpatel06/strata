/**
 * "Break it" presets for the server-driven UI demo. Each one takes a clean example document and changes one thing
 * that the contract has a rule about. Isomorphic: no React, no DOM.
 */
type Json = Record<string, unknown>;

export interface PresetResult {
  doc: Json;
  /** JSON pointer of what changed, so the editor can scroll to it. */
  pointer: string;
  /** One sentence: what changed. */
  note: string;
}

export interface Preset {
  id: string;
  label: string;
  apply: (doc: Json) => PresetResult;
}

const isObject = (v: unknown): v is Json => v !== null && typeof v === 'object' && !Array.isArray(v);
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** Every node in a document, depth first, with its JSON pointer. Walks children, slots and fallbacks. */
function* nodes(node: unknown, pointer: string): Generator<{ node: Json; pointer: string }> {
  if (!isObject(node) || typeof node.type !== 'string') return;
  yield { node, pointer };
  if (Array.isArray(node.children)) {
    for (const [i, child] of node.children.entries()) yield* nodes(child, `${pointer}/children/${i}`);
  }
  if (isObject(node.slots)) {
    for (const [name, slot] of Object.entries(node.slots)) yield* nodes(slot, `${pointer}/slots/${name}`);
  }
  if (node.fallback !== undefined) yield* nodes(node.fallback, `${pointer}/fallback`);
}

function rootChildren(doc: Json): unknown[] {
  const root = isObject(doc.root) ? doc.root : (doc.root = { type: 'Stack', children: [] });
  if (!Array.isArray(root.children)) root.children = [];
  return root.children as unknown[];
}

export const PRESETS: readonly Preset[] = [
  {
    id: 'unknown-component',
    label: 'Unknown component',
    apply(input) {
      const doc = clone(input);
      const children = rootChildren(doc);
      const at = Math.min(1, children.length);
      children.splice(at, 0, {
        type: 'OfferCarousel',
        id: 'offers',
        props: { autoplay: true },
        fallback: {
          type: 'Alert',
          props: { tone: 'info', title: 'More offers in the app' },
          children: 'Update the app to see this section.',
        },
      });
      return {
        doc,
        pointer: `/root/children/${at}`,
        note: 'Added a node type this client doesn’t know, with a fallback. The validator rejects it; the renderer draws the fallback.',
      };
    },
  },
  {
    id: 'unnamed-button',
    label: 'Unnamed button',
    apply(input) {
      const doc = clone(input);
      // Not a Button in a slot: @syntara/sdui 1.0.0's validator reports a rule broken inside `slots.action` against the
      // parent node (an Alert's rule instead of button-name), so the demo would show the wrong message. Reported.
      const found = [...nodes(doc.root, '/root')].find((n) => n.node.type === 'Button' && !n.pointer.includes('/slots/'));
      if (found) {
        found.node.children = [{ icon: 'arrow-right' }];
        if (isObject(found.node.props)) delete found.node.props.ariaLabel;
        return {
          doc,
          pointer: `${found.pointer}/children`,
          note: 'Replaced a Button’s text with an icon and gave it no ariaLabel, so it has no accessible name.',
        };
      }
      const children = rootChildren(doc);
      children.push({ type: 'Button', props: { variant: 'outline' }, children: [{ icon: 'arrow-right' }], action: { type: 'event', name: 'screen.next' } });
      return {
        doc,
        pointer: `/root/children/${children.length - 1}`,
        note: 'Added a Button with only an icon and no ariaLabel, so it has no accessible name.',
      };
    },
  },
  {
    id: 'javascript-href',
    label: 'javascript: link',
    apply(input) {
      const doc = clone(input);
      const found = [...nodes(doc.root, '/root')].find((n) => isObject(n.node.action) && n.node.action.type === 'navigate');
      if (found && isObject(found.node.action)) {
        found.node.action.href = 'javascript:alert(document.cookie)';
        return { doc, pointer: `${found.pointer}/action/href`, note: `Pointed the first navigate action (a ${String(found.node.type)}) at a javascript: URL.` };
      }
      const children = rootChildren(doc);
      children.push({ type: 'Link', children: 'Details', action: { type: 'navigate', href: 'javascript:alert(document.cookie)' } });
      return { doc, pointer: `/root/children/${children.length - 1}`, note: 'Added a Link whose navigate action is a javascript: URL.' };
    },
  },
  {
    id: 'theme-field',
    label: 'Theme field',
    apply(input) {
      const { schemaVersion, ...rest } = clone(input);
      const doc: Json = { schemaVersion, theme: 'festive-sale', ...rest };
      return {
        doc,
        pointer: '/theme',
        note: 'Added "theme": "festive-sale". A screen can’t pick its brand: the client that draws it does.',
      };
    },
  },
];
