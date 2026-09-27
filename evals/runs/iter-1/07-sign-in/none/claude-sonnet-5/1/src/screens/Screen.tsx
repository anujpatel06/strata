import { useEffect, useRef, useState, type FormEvent } from 'react';
import styles from './Screen.module.css';

// Mock data: the person has just retried after an incorrect password attempt.
const MOCK_ACCOUNT = {
  email: 'jordan.kim@example.com',
  attemptedPassword: 'Summer2024!',
};

const WRONG_PASSWORD_MESSAGE = 'Incorrect email or password. Please try again.';
const SIGN_IN_DELAY_MS = 900;

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3l18 18M10.6 5.2A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.4 4.3M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7a10.4 10.4 0 0 0 4-.8M9.9 10a3 3 0 0 0 4.2 4.2"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className={styles.spinner} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="42 100"
      />
    </svg>
  );
}

export default function Screen() {
  const [email, setEmail] = useState(MOCK_ACCOUNT.email);
  const [password, setPassword] = useState(MOCK_ACCOUNT.attemptedPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(WRONG_PASSWORD_MESSAGE);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const errorId = 'signin-error';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      setError(WRONG_PASSWORD_MESSAGE);
    }, SIGN_IN_DELAY_MS);
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>Enter your details to access your account.</p>

        {error && (
          <p className={styles.error} id={errorId} role="alert">
            {error}
          </p>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input
              className={styles.input}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                className={styles.input}
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                required
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword((value) => !value)}
                disabled={loading}
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div className={styles.row}>
            <label className={styles.checkboxLabel}>
              <input
                className={styles.checkbox}
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                disabled={loading}
              />
              Remember this device
            </label>

            <button type="button" className={styles.link}>
              Forgot password?
            </button>
          </div>

          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner />
                Signing in…
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
