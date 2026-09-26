import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import styles from './Tabs.module.css';
import ui from './ui.module.css';

export interface TabBadge {
  /** Visible text, e.g. "3". */
  text: string;
  /** Appended for screen readers, e.g. "adjustments". */
  srText: string;
  tone?: 'neutral' | 'fail';
  icon?: ReactNode;
}

export interface TabItem<T extends string> {
  id: T;
  label: string;
  badges?: TabBadge[];
}

interface TabsProps<T extends string> {
  label: string;
  idPrefix: string;
  tabs: ReadonlyArray<TabItem<T>>;
  selected: T;
  onSelect: (id: T) => void;
}

export const tabId = (prefix: string, id: string) => `${prefix}-tab-${id}`;
export const panelId = (prefix: string, id: string) => `${prefix}-panel-${id}`;

/**
 * WAI-ARIA tablist with roving tabindex and automatic activation:
 * ←/→ move and select, Home/End jump to the ends, Tab moves into the panel.
 */
export function Tabs<T extends string>({ label, idPrefix, tabs, selected, onSelect }: TabsProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const move = (index: number) => {
    const count = tabs.length;
    const next = ((index % count) + count) % count;
    const tab = tabs[next];
    if (!tab) return;
    onSelect(tab.id);
    refs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    switch (event.key) {
      case 'ArrowRight':
        move(rtl ? index - 1 : index + 1);
        break;
      case 'ArrowLeft':
        move(rtl ? index + 1 : index - 1);
        break;
      case 'Home':
        move(0);
        break;
      case 'End':
        move(tabs.length - 1);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  return (
    <div role="tablist" aria-label={label} className={styles.tablist}>
      {tabs.map((tab, index) => {
        const isSelected = tab.id === selected;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            id={tabId(idPrefix, tab.id)}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={panelId(idPrefix, tab.id)}
            tabIndex={isSelected ? 0 : -1}
            className={styles.tab}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            <span>{tab.label}</span>
            {tab.badges?.map((badge) => (
              <span
                key={badge.srText}
                className={`${styles.badge} ${badge.tone === 'fail' ? styles.badgeFail : ''}`}
              >
                {badge.icon}
                {badge.text}
                <span className={ui.srOnly}> {badge.srText}</span>
              </span>
            ))}
          </button>
        );
      })}
    </div>
  );
}
