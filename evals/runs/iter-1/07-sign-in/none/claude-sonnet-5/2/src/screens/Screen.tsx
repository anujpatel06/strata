import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import styles from './Screen.module.css';

// Mock account: the person just tried to sign in with the wrong password.
const MOCK_EMAIL = 'jordan.wells@example.com';
const MOCK_WRONG_PASSWORD = 'sunshine92';
const WRONG_PASSWORD_ERROR = "That password doesn't match this email. Check it and try again.";

type Status = 'idle' | 'submitting' | 'error';

export default function Screen() {
  const [email, setEmail] = useState(MOCK_EMAIL);
  const [password, setPassword] = useState(MOCK_WRONG_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [status, setStatus] = useState<Status>('error');

  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();
  const rememberId = useId();

  const isSubmitting = status === 'submitting';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    // Mock request: this account always rejects the password to keep the error state visible.
    window.setTimeout(() => {
      setStatus('error');
    }, 1200);
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>Welcome back. Enter your details to continue.</p>

        <form className={styles.form} noValidate onSubmit={handleSubmit}>
          {status === 'error' && (
            <div className={styles.errorBanner} role="alert" id={errorId}>
              <svg
                className={styles.errorIcon}
                viewBox="0 0 20 20"
                width="18"
                height="18"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <line x1="10" y1="6" x2="10" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="10" cy="14" r="1" fill="currentColor" />
              </svg>
              <span>{WRONG_PASSWORD_ERROR}</span>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor={emailId}>
              Email
            </label>
            <input
              id={emailId}
              name="email"
              type="email"
              autoComplete="email"
              className={styles.input}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label} htmlFor={passwordId}>
                Password
              </label>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => {
                  /* mock: no reset flow wired up */
                }}
              >
                Forgot password?
              </button>
            </div>
            <div className={`${styles.passwordField} ${status === 'error' ? styles.inputInvalid : ''}`}>
              <input
                id={passwordId}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={styles.passwordInput}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
                aria-invalid={status === 'error'}
                aria-describedby={status === 'error' ? errorId : undefined}
                required
              />
              <button
                type="button"
                className={styles.toggleButton}
                onClick={() => setShowPassword((value) => !value)}
                disabled={isSubmitting}
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                    <path
                      d="M3 3l18 18M10.6 10.7a2.5 2.5 0 003.5 3.5M6.6 6.8C4.2 8.4 2.5 10.7 1.5 12c1.7 2.9 5.3 7 10.5 7 1.7 0 3.2-.4 4.5-1.1M9.9 4.2A10.7 10.7 0 0112 4c5.2 0 8.8 4.1 10.5 7-.6 1-1.4 2.2-2.4 3.3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                    <path
                      d="M1.5 12C3.2 9.1 6.8 5 12 5s8.8 4.1 10.5 7c-1.7 2.9-5.3 7-10.5 7S3.2 14.9 1.5 12z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="2.75" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <label className={styles.checkboxRow} htmlFor={rememberId}>
            <input
              id={rememberId}
              type="checkbox"
              className={styles.checkbox}
              checked={rememberDevice}
              onChange={(event) => setRememberDevice(event.target.checked)}
              disabled={isSubmitting}
            />
            <span>Remember this device</span>
          </label>

          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                <span>Signing in…</span>
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
