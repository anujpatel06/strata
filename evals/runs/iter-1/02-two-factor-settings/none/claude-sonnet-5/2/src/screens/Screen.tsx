import { useEffect, useId, useRef, useState } from 'react';
import styles from './Screen.module.css';

type TwoFactorMethod = 'app' | 'sms';

interface BackupCode {
  code: string;
  used: boolean;
}

const MOCK_BACKUP_CODES: BackupCode[] = [
  { code: '4F82-9K3L', used: false },
  { code: 'QW7T-2XN9', used: false },
  { code: 'B5R8-LM4C', used: true },
  { code: 'H2D6-9PZV', used: false },
  { code: 'T9K1-CV3F', used: false },
  { code: 'N4X7-8QWL', used: false },
  { code: 'Z1M5-R7HD', used: false },
  { code: 'K8W3-9TBN', used: false },
];

const MOCK_PHONE = '+1 •••-•••-4821';

export default function Screen() {
  const [enabled, setEnabled] = useState(true);
  const [method, setMethod] = useState<TwoFactorMethod>('app');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [confirmingDisable, setConfirmingDisable] = useState(false);

  const headingId = useId();
  const methodGroupName = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!confirmingDisable) return;
    dialogRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setConfirmingDisable(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmingDisable]);

  function handleToggle() {
    if (enabled) {
      setConfirmingDisable(true);
    } else {
      setEnabled(true);
    }
  }

  function confirmDisable() {
    setEnabled(false);
    setConfirmingDisable(false);
    setShowBackupCodes(false);
  }

  return (
    <div className={styles.page}>
      <section className={styles.card} aria-labelledby={headingId}>
        <div className={styles.header}>
          <div>
            <h2 id={headingId} className={styles.title}>
              Two-factor authentication
            </h2>
            <p className={styles.description}>
              Add an extra layer of security to your account by requiring a second step when you sign in.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Turn two-factor authentication on or off"
            className={`${styles.switch} ${enabled ? styles.switchOn : ''}`}
            onClick={handleToggle}
          >
            <span className={styles.switchKnob} />
          </button>
        </div>

        <div className={styles.statusRow}>
          <span className={`${styles.statusDot} ${enabled ? styles.statusDotOn : styles.statusDotOff}`} aria-hidden="true" />
          <span className={styles.statusText}>
            {enabled ? 'Two-factor authentication is on' : 'Two-factor authentication is off'}
          </span>
        </div>

        {enabled && (
          <div className={styles.content}>
            <fieldset className={styles.fieldset}>
              <legend className={styles.fieldsetLegend}>Verification method</legend>

              <label className={`${styles.option} ${method === 'app' ? styles.optionSelected : ''}`}>
                <input
                  type="radio"
                  name={methodGroupName}
                  value="app"
                  checked={method === 'app'}
                  onChange={() => setMethod('app')}
                  className={styles.radio}
                />
                <span className={styles.optionBody}>
                  <span className={styles.optionTitle}>Authenticator app</span>
                  <span className={styles.optionHint}>Get codes from an app like Google Authenticator or Authy.</span>
                </span>
              </label>

              <label className={`${styles.option} ${method === 'sms' ? styles.optionSelected : ''}`}>
                <input
                  type="radio"
                  name={methodGroupName}
                  value="sms"
                  checked={method === 'sms'}
                  onChange={() => setMethod('sms')}
                  className={styles.radio}
                />
                <span className={styles.optionBody}>
                  <span className={styles.optionTitle}>Text message</span>
                  <span className={styles.optionHint}>Get a code sent by SMS to {MOCK_PHONE}.</span>
                </span>
              </label>
            </fieldset>

            <div className={styles.backupSection}>
              <div className={styles.backupHeader}>
                <div>
                  <h3 className={styles.backupTitle}>Backup codes</h3>
                  <p className={styles.backupHint}>
                    Use one of these codes to sign in if you lose access to your{' '}
                    {method === 'app' ? 'authenticator app' : 'phone'}. Each code works once.
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => setShowBackupCodes((visible) => !visible)}
                  aria-expanded={showBackupCodes}
                >
                  {showBackupCodes ? 'Hide codes' : 'Show codes'}
                </button>
              </div>

              {showBackupCodes && (
                <ul className={styles.codeGrid}>
                  {MOCK_BACKUP_CODES.map((backupCode) => (
                    <li key={backupCode.code} className={`${styles.code} ${backupCode.used ? styles.codeUsed : ''}`}>
                      <span className={styles.codeValue}>{backupCode.code}</span>
                      {backupCode.used && <span className={styles.codeUsedLabel}>Used</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>

      {confirmingDisable && (
        <div className={styles.overlay} role="presentation" onClick={() => setConfirmingDisable(false)}>
          <div
            ref={dialogRef}
            className={styles.dialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="disable-2fa-title"
            aria-describedby="disable-2fa-description"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="disable-2fa-title" className={styles.dialogTitle}>
              Turn off two-factor authentication?
            </h3>
            <p id="disable-2fa-description" className={styles.dialogText}>
              This will lower the security of your account. You won't be asked for a second step when signing in.
            </p>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => setConfirmingDisable(false)}>
                Cancel
              </button>
              <button type="button" className={styles.dangerButton} onClick={confirmDisable}>
                Turn off
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
