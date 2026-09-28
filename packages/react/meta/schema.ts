/**
 * meta/<name>.meta.json — ONE source of truth per component for docs pages, the registry, and (Phase 5) the MCP server.
 * ADR-007. Keep strings plain English; no marketing.
 */
export type Category = 'actions' | 'inputs' | 'overlays' | 'feedback' | 'display' | 'navigation' | 'data' | 'layout';

/**
 * A deprecation, following GOVERNANCE.md: deprecated in a minor release, removed in a major, with a codemod.
 * The docs page, the dev-time warning text and (Phase 5) the MCP server all read this record.
 */
export interface Deprecation {
  /** The release that deprecated it, e.g. "0.2.0". */
  since: string;
  /** The release that removes it, e.g. "1.0.0". Must be later than `since`. */
  removal: string;
  /** What to write instead, as code, e.g. `tone="danger"`. */
  replacement: string;
  /** One sentence: why it changed. */
  reason: string;
  /** Transform name in packages/codemods/transforms, without the extension, e.g. "button-variant-danger-to-tone". */
  codemod: string;
  /** The RFC that decided it: a file name in docs/rfcs without the extension, e.g. "001-button-tone". */
  rfc: string;
}

export interface PropDoc {
  /** Which exported component this prop belongs to, e.g. "Button" or "CardHeader". */
  component: string;
  name: string;
  /** TypeScript type as a readable string, e.g. "'sm' | 'md' | 'lg'". */
  type: string;
  default?: string;
  required?: boolean;
  description: string;
  /** The whole prop is deprecated. */
  deprecated?: Deprecation;
  /**
   * Single values of a string-literal union that are deprecated while the prop itself stays. `value` is written as
   * in `type`, quotes included, e.g. "'danger'", and must appear there until the release that removes it.
   */
  deprecatedValues?: Array<Deprecation & { value: string }>;
}

export interface ExampleDoc {
  /** File name without extension in apps/docs/examples/<component>/, e.g. "button-variants". The first is the hero preview and must be "<name>-demo". */
  name: string;
  title: string;
  description?: string;
}

export interface ComponentMeta {
  /** kebab-case, equals the file name in src/ui and the registry item name, e.g. "date-picker". */
  name: string;
  /** Display name, e.g. "Date Picker". */
  title: string;
  /** One sentence: what it is for. */
  description: string;
  category: Category;
  /**
   * alpha | beta | stable. The criteria are the "Maturity" section of the governance docs page; `pnpm check:meta`
   * enforces the automatable ones (examples, tests, keyboard tests, block use, npm publication).
   */
  maturity: 'alpha' | 'beta' | 'stable';
  /**
   * Dated records of reviews a person actually did (YYYY-MM-DD). Never fill it from an automated run: axe and the
   * test suite are checked separately. `a11y` = a manual keyboard + screen-reader review; stable requires it.
   */
  review?: { a11y?: string };
  /** Named exports from src/ui/<name>.tsx, main component first. */
  exports: string[];
  /** Files in src/ui this component ships (tsx + module.css), relative to src/ui. */
  files: string[];
  /** npm packages the component files import (besides react). */
  dependencies: string[];
  /** Other Syntara registry items it imports, by name (e.g. "button"). */
  registryDependencies: string[];
  /** Link to the React Aria docs page it is built on, if any. */
  reactAria?: string;
  /** Minimal usage snippet (TSX) shown under "Usage". Import from '@syntara/react'. */
  usage: string;
  examples: ExampleDoc[];
  props: PropDoc[];
  accessibility: {
    keyboard: { keys: string; action: string }[];
    notes: string[];
  };
  guidelines: { do: string[]; dont: string[] };
  /** Tokens this component reads, e.g. ["color.action.primary.*", "radius.button", "control-height"]. */
  tokens: string[];
  /**
   * Other packages a consumer imports to use this component, beyond '@syntara/react'. Leave it out when there are none.
   * The MCP server's get_component returns it. `pnpm check:meta` checks each package is in `dependencies` and each name is exported.
   */
  imports?: ImportDoc[];
  /**
   * Types that agents get wrong, each based on a real type error or on the component's own types. Leave it out when
   * there are none. The MCP server's get_component returns it.
   */
  typeNotes?: TypeNote[];
}

/** A package the consumer imports alongside the component, e.g. '@internationalized/date' for date values. */
export interface ImportDoc {
  /** npm package name. Must be one of the component's `dependencies`. */
  package: string;
  /** Exact named exports to import. Prefix type-only names with "type ", e.g. "type DateValue". */
  names: string[];
  /** One sentence: why the consumer needs them. */
  why: string;
}

/** A short note on a type that is easy to get wrong. */
export interface TypeNote {
  /** The prop it is about, as written in `props[].name` (one of the names when that lists several). Leave it out for a general note. */
  prop?: string;
  /** What the type is and what goes wrong. Plain words, at most 300 characters. */
  note: string;
  /** One line of correct TSX that type-checks, at most 200 characters. */
  example?: string;
}
