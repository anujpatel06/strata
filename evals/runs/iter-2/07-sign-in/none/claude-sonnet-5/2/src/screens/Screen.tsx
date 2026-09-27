import { useState, type FormEvent } from 'react';
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Checkbox, Link, TextField } from '@strata/react';
import { IconEye, IconEyeOff } from '@strata/icons';
import styles from './Screen.module.css';

// Mock state: the person has just retried after a wrong password.
const MOCK_EMAIL = 'anuj.patel@vela.com';
const MOCK_PASSWORD = 'hunter2wrong';

export default function Screen() {
  const [email, setEmail] = useState(MOCK_EMAIL);
  const [password, setPassword] = useState(MOCK_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(true);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setHasError(false);
    // Mock only: no backend call. Simulate the same failure again.
    window.setTimeout(() => {
      setIsSubmitting(false);
      setHasError(true);
    }, 1200);
  }

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <CardHeader className={styles.header}>
          <CardTitle level={1}>Sign in</CardTitle>
          <CardDescription>Enter your details to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {hasError && (
              <Alert tone="danger" title="Incorrect email or password" live="assertive">
                Check your details and try again.
              </Alert>
            )}

            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={setEmail}
              isRequired
              isDisabled={isSubmitting}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              isRequired
              isInvalid={hasError}
              isDisabled={isSubmitting}
              suffix={
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onPress={() => setShowPassword((value) => !value)}
                  className={styles.togglePassword}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </Button>
              }
            />

            <div className={styles.row}>
              <Checkbox isSelected={rememberDevice} onChange={setRememberDevice}>
                Remember this device
              </Checkbox>
              <Link variant="inline" href="#forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className={styles.submit}
              isPending={isSubmitting}
              isDisabled={isSubmitting}
            >
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
