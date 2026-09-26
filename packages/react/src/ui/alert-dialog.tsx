'use client';

import { useState, type JSX, type ReactNode } from 'react';
import { Button } from './button';
import { Dialog, type DialogProps } from './dialog';

export interface AlertDialogProps
  extends Omit<DialogProps, 'children' | 'description' | 'footer' | 'role' | 'isDismissable'> {
  /** The question or statement, e.g. "Delete this card?". */
  title: ReactNode;
  /** The consequence, e.g. "This can't be undone." */
  children: ReactNode;
  /** Label of the confirming button, e.g. "Delete". */
  actionLabel: ReactNode;
  /** Label of the dismissing button. */
  cancelLabel?: ReactNode;
  /** `danger` styles the action as destructive and moves initial focus to Cancel. */
  tone?: 'default' | 'danger';
  /**
   * Called when the action is pressed. The dialog closes afterwards; if this returns a promise the action shows
   * a pending state and the dialog closes when it resolves (it stays open if it rejects).
   */
  onAction?: () => void | Promise<unknown>;
  /** Shows the action as pending and blocks Cancel/Escape — for when you track the request yourself. */
  isPending?: boolean;
}

/**
 * A modal confirmation that interrupts the user — use it for destructive or irreversible steps. It can't be
 * dismissed by clicking outside; Escape and Cancel close it without acting.
 */
export function AlertDialog({
  title,
  children,
  actionLabel,
  cancelLabel = 'Cancel',
  tone = 'default',
  onAction,
  isPending,
  size = 'md',
  isKeyboardDismissDisabled,
  ...props
}: AlertDialogProps): JSX.Element {
  const [isRunning, setRunning] = useState(false);
  const pending = isPending || isRunning;
  const isDanger = tone === 'danger';

  return (
    <Dialog
      {...props}
      role="alertdialog"
      size={size}
      title={title}
      description={children}
      isDismissable={false}
      isKeyboardDismissDisabled={pending || isKeyboardDismissDisabled}
      footer={({ close }) => (
        <>
          <Button variant="outline" onPress={close} isDisabled={pending} autoFocus={isDanger}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            isPending={pending}
            autoFocus={!isDanger}
            onPress={() => {
              const result = onAction?.();
              if (result && typeof result.then === 'function') {
                setRunning(true);
                result.then(close, () => {}).finally(() => setRunning(false));
              } else {
                close();
              }
            }}
          >
            {actionLabel}
          </Button>
        </>
      )}
    />
  );
}
