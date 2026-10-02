'use client';

import { useState, type JSX, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import {
  Button as RACButton,
  TextArea as RACTextArea,
  TextField as RACTextField,
  composeRenderProps,
  type ButtonProps as RACButtonProps,
  type Key,
} from 'react-aria-components';
import { IconChevronDown, IconPlayerStop, IconSend } from '@syntara/icons';
import { Menu, MenuItem, MenuTrigger } from './menu';
import styles from './prompt-composer.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export interface PromptComposerProps {
  /** Names the text box for screen readers. Default "Message". */
  label?: string;
  placeholder?: string;
  /** Controlled text. Leave unset and the composer keeps its own, clearing it after each send. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Called with the trimmed text on Enter or the send button. Shift+Enter adds a new line. */
  onSubmit?: (value: string) => void;
  /** A reply is being written. The send button becomes a stop button. */
  isPending?: boolean;
  onStop?: () => void;
  /** Controls at the start of the toolbar: attach, model and mode pickers. */
  startActions?: ReactNode;
  /** Controls before the send button: voice, and similar. */
  endActions?: ReactNode;
  /**
   * The two-colour edge and halo. `'brand'` (or `true`, the default) uses the brand's primary and accent;
   * `'spectrum'` sweeps from its warning to its info colour, warm to cool. `false` turns it off.
   */
  glow?: boolean | 'brand' | 'spectrum';
  /**
   * `'solid'` (default) or `'glass'`: a frosted, see-through face for a composer floating over content.
   * Text stays at 4.5:1 over any backdrop (the theme engine solves the glass opacity for it).
   */
  surface?: 'solid' | 'glass';
  sendLabel?: string;
  stopLabel?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

/**
 * The box where a person writes to an AI: a growing text area, a toolbar of pill controls and a send button.
 * Enter sends, Shift+Enter breaks the line, and Enter while an input method is composing (Hindi, Japanese,
 * Chinese keyboards) only confirms the composition, never sends.
 */
export function PromptComposer({
  label = 'Message',
  placeholder = 'Ask anything…',
  value: controlled,
  defaultValue = '',
  onChange,
  onSubmit,
  isPending = false,
  onStop,
  startActions,
  endActions,
  glow = true,
  surface = 'solid',
  sendLabel = 'Send',
  stopLabel = 'Stop',
  className,
  ref,
}: PromptComposerProps): JSX.Element {
  const [own, setOwn] = useState(defaultValue);
  const value = controlled ?? own;
  const isEmpty = value.trim() === '';

  const change = (v: string) => {
    if (controlled === undefined) setOwn(v);
    onChange?.(v);
  };
  const submit = () => {
    if (isEmpty || isPending) return;
    onSubmit?.(value.trim());
    if (controlled === undefined) setOwn('');
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    submit();
  };

  return (
    <div ref={ref} className={cx(styles.root, className)} data-glow={glow === false ? undefined : glow === true ? 'brand' : glow} data-surface={surface} data-pending={isPending || undefined}>
      <RACTextField aria-label={label} value={value} onChange={change} className={styles.field}>
        <RACTextArea className={styles.input} placeholder={placeholder} rows={1} onKeyDown={onKeyDown} />
      </RACTextField>
      <div className={styles.toolbar}>
        {startActions != null && <div className={styles.group}>{startActions}</div>}
        <div className={cx(styles.group, styles.end)}>
          {endActions}
          {isPending ? (
            <RACButton className={styles.send} aria-label={stopLabel} onPress={onStop}>
              <IconPlayerStop aria-hidden />
            </RACButton>
          ) : (
            <RACButton className={styles.send} aria-label={sendLabel} isDisabled={isEmpty} onPress={submit}>
              <IconSend aria-hidden />
            </RACButton>
          )}
        </div>
      </div>
    </div>
  );
}

export interface ComposerButtonProps extends Omit<RACButtonProps, 'children'> {
  /** Leading icon. Decorative: give the button a text label or an `aria-label`. */
  icon?: ReactNode;
  children?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

/** A pill control for the composer toolbar. With only an icon it becomes a circle; pass `aria-label`. */
export function ComposerButton({ icon, children, className, ...props }: ComposerButtonProps): JSX.Element {
  return (
    <RACButton
      {...props}
      data-icon-only={children == null || undefined}
      className={composeRenderProps(className, (c) => cx(styles.pill, c))}
    >
      {icon != null && (
        <span className={styles.pillIcon} aria-hidden>
          {icon}
        </span>
      )}
      {children != null && <span className={icon != null ? styles.pillText : undefined}>{children}</span>}
    </RACButton>
  );
}

export interface ComposerOption {
  id: string;
  label: string;
  icon?: ReactNode;
  description?: string;
}

export interface ComposerSelectProps {
  /** What is being chosen, e.g. "Reasoning". Read with the current choice: "Reasoning: DeepThink". */
  label: string;
  options: ComposerOption[];
  selectedId?: string;
  defaultSelectedId?: string;
  onSelectionChange?: (id: string) => void;
}

/** A pill that opens a menu of options, showing the current one with its icon. */
export function ComposerSelect({
  label,
  options,
  selectedId,
  defaultSelectedId,
  onSelectionChange,
}: ComposerSelectProps): JSX.Element {
  const [own, setOwn] = useState(defaultSelectedId ?? options[0]?.id);
  const current = selectedId ?? own;
  const option = options.find((o) => o.id === current) ?? options[0];

  return (
    <MenuTrigger>
      <RACButton className={styles.pill} aria-label={`${label}: ${option?.label ?? ''}`}>
        {option?.icon != null && (
          <span className={styles.pillIcon} aria-hidden>
            {option.icon}
          </span>
        )}
        <span className={option?.icon != null ? styles.pillText : undefined}>{option?.label}</span>
        <IconChevronDown className={styles.chevron} aria-hidden />
      </RACButton>
      <Menu
        aria-label={label}
        placement="bottom start"
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={current ? [current] : []}
        onSelectionChange={(keys) => {
          const id = [...(keys as Set<Key>)][0];
          if (id == null) return;
          if (selectedId === undefined) setOwn(String(id));
          onSelectionChange?.(String(id));
        }}
      >
        {options.map((o) => (
          <MenuItem key={o.id} id={o.id} icon={o.icon} description={o.description}>
            {o.label}
          </MenuItem>
        ))}
      </Menu>
    </MenuTrigger>
  );
}
