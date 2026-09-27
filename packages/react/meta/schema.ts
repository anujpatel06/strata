/**
 * meta/<name>.meta.json — ONE source of truth per component for docs pages, the registry, and (Phase 5) the MCP server.
 * ADR-007. Keep strings plain English; no marketing.
 */
export type Category = 'actions' | 'inputs' | 'overlays' | 'feedback' | 'display' | 'navigation' | 'data' | 'layout';

export interface PropDoc {
  /** Which exported component this prop belongs to, e.g. "Button" or "CardHeader". */
  component: string;
  name: string;
  /** TypeScript type as a readable string, e.g. "'sm' | 'md' | 'lg'". */
  type: string;
  default?: string;
  required?: boolean;
  description: string;
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
  /** Other Strata registry items it imports, by name (e.g. "button"). */
  registryDependencies: string[];
  /** Link to the React Aria docs page it is built on, if any. */
  reactAria?: string;
  /** Minimal usage snippet (TSX) shown under "Usage". Import from '@strata/react'. */
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
}
