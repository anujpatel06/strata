import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import styles from './Screen.module.css';

type Method = 'app' | 'sms';

interface BackupCode {
  code: string;
  used: boolean;
}

const initialBackupCodes: BackupCode[] = [
  { code: '7F3K-9QXZ', used: false },
  { code: 'M2LP-6VDA', used: false },
  { code: 'Q8RT-1JNB', used: true },
  { code: 'X5CW-4HYE', used: false },
  { code: '9BUD-2SKF', used: false },
  { code: 'L6ZM-8PQR', used: true },
  { code: 'A1TG-3WXV', used: false },
  { code: 'K4NH-7CLU', used: false },
];

const maskedPhoneNumber = '+1 •••-•••-0198';

function createBackupCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part()}-${part()}`;
}

export default function Screen() {
  const headingId = useId();
  const backupHeadingId = useId();
  const confirmTitleId = useId();
  const confirmDescId = useId();

  const [enabled, setEnabled] = useState(true);
  const [method, setMethod] = useState<Method>('app');
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>(initialBackupCodes);
  const [codesVisible, setCodesVisible] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [justCopied, setJustCopied] = useState(false);

  const toggleRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const turnOffRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (confirmOpen) {
      lastFocusedRef.current = document.activeElement as HTMLElement | null;
      cancelRef.current?.focus();
    } else {
      lastFocusedRef.current?.focus();
    }
  }, [confirmOpen]);

  useEffect(() => {
    if (!justCopied) return;
    const timer = window.setTimeout(() => setJustCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [justCopied]);

  function handleToggleClick() {
    if (enabled) {
      setConfirmOpen(true);
    } else {
      setEnabled(true);
      setStatusMessage('Two-factor authentication turned on.');
    }
  }

  function handleCancelTurnOff() {
    setConfirmOpen(false);
  }

  function handleConfirmTurnOff() {
    setEnabled(false);
    setConfirmOpen(false);
    setStatusMessage('Two-factor authentication turned off.');
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      handleCancelTurnOff();
      return;
    }
    if (event.key !== 'Tab') return;
    const first = cancelRef.current;
    const last = turnOffRef.current;
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleRegenerateCodes() {
    setBackupCodes(Array.from({ length: 8 }, () => ({ code: createBackupCode(), used: false })));
    setCodesVisible(true);
    setStatusMessage('New backup codes generated. Save them somewhere safe.');
  }

  async function handleCopyCodes() {
    const text = backupCodes.map((c) => c.code).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setJustCopied(true);
    } catch {
      // Clipboard access may be unavailable; nothing to fall back to.
    }
  }

  const remainingCodes = backupCodes.filter((c) => !c.used).length;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Security settings</h1>
        <p className={styles.pageDescription}>
          Manage how you sign in and keep your account secure.
        </p>
      </header>

      <section className={styles.section} aria-labelledby={headingId}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 id={headingId} className={styles.sectionTitle}>
              Two-factor authentication
            </h2>
            <p className={styles.sectionDescription}>
              Require a second step when signing in, in addition to your password.
            </p>
          </div>
          <button
            ref={toggleRef}
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-labelledby={headingId}
            className={`${styles.switch} ${enabled ? styles.switchOn : ''}`}
            onClick={handleToggleClick}
          >
            <span className={styles.switchTrack} aria-hidden="true">
              <span className={styles.switchThumb} />
            </span>
            <span className={styles.switchLabel}>{enabled ? 'On' : 'Off'}</span>
          </button>
        </div>

        {enabled && (
          <div className={styles.content}>
            <fieldset className={styles.methodGroup}>
              <legend className={styles.methodLegend}>Verification method</legend>

              <label className={styles.radioRow}>
                <input
                  type="radio"
                  name="twofactor-method"
                  value="app"
                  checked={method === 'app'}
                  onChange={() => setMethod('app')}
                  className={styles.radioInput}
                />
                <span className={styles.radioText}>
                  <span className={styles.radioTitle}>Authenticator app</span>
                  <span className={styles.radioHint}>
                    Get codes from an app like Google Authenticator or Authy.
                  </span>
                </span>
              </label>

              <label className={styles.radioRow}>
                <input
                  type="radio"
                  name="twofactor-method"
                  value="sms"
                  checked={method === 'sms'}
                  onChange={() => setMethod('sms')}
                  className={styles.radioInput}
                />
                <span className={styles.radioText}>
                  <span className={styles.radioTitle}>Text message</span>
                  <span className={styles.radioHint}>
                    {method === 'sms'
                      ? `Codes are sent to ${maskedPhoneNumber}.`
                      : 'Get codes by SMS to your phone.'}
                  </span>
                </span>
              </label>
            </fieldset>

            <div className={styles.backupCodes} aria-labelledby={backupHeadingId}>
              <div className={styles.backupHeader}>
                <h3 id={backupHeadingId} className={styles.backupTitle}>
                  Backup codes
                </h3>
                <div className={styles.backupActions}>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => setCodesVisible((v) => !v)}
                  >
                    {codesVisible ? 'Hide codes' : 'Show codes'}
                  </button>
                  <button type="button" className={styles.linkButton} onClick={handleRegenerateCodes}>
                    Regenerate codes
                  </button>
                </div>
              </div>
              <p className={styles.backupHint}>
                Use a backup code to sign in if you lose access to your{' '}
                {method === 'app' ? 'authenticator app' : 'phone'}. Each code can only be used
                once.
              </p>

              {codesVisible ? (
                <>
                  <ul className={styles.codeGrid}>
                    {backupCodes.map((c) => (
                      <li
                        key={c.code}
                        className={`${styles.code} ${c.used ? styles.codeUsed : ''}`}
                      >
                        <span>{c.code}</span>
                        {c.used && <span className={styles.codeUsedLabel}>Used</span>}
                      </li>
                    ))}
                  </ul>
                  <button type="button" className={styles.linkButton} onClick={handleCopyCodes}>
                    {justCopied ? 'Copied!' : 'Copy codes'}
                  </button>
                </>
              ) : (
                <p className={styles.codesSummary}>
                  {remainingCodes} of {backupCodes.length} codes remaining.
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      <div aria-live="polite" className={styles.visuallyHidden}>
        {statusMessage}
      </div>

      {confirmOpen && (
        <div className={styles.overlay}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={confirmTitleId}
            aria-describedby={confirmDescId}
            className={styles.dialog}
            onKeyDown={handleDialogKeyDown}
          >
            <h2 id={confirmTitleId} className={styles.dialogTitle}>
              Turn off two-factor authentication?
            </h2>
            <p id={confirmDescId} className={styles.dialogDescription}>
              This makes your account less secure. You'll only need your password to sign in.
            </p>
            <div className={styles.dialogActions}>
              <button
                ref={cancelRef}
                type="button"
                className={styles.secondaryButton}
                onClick={handleCancelTurnOff}
              >
                Cancel
              </button>
              <button
                ref={turnOffRef}
                type="button"
                className={styles.dangerButton}
                onClick={handleConfirmTurnOff}
              >
                Turn off
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
