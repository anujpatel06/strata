import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Link,
  TextField,
} from '@strata/react';
import { IconEye, IconEyeOff } from '@strata/icons';
import styles from './Screen.module.css';

// Mock: the person just tried these credentials and the password was wrong.
const MOCK_CREDENTIALS = {
  email: 'anita.kapoor@example.com',
  password: 'Summer2024!',
};

export default function Screen() {
  const [email, setEmail] = useState(MOCK_CREDENTIALS.email);
  const [password, setPassword] = useState(MOCK_CREDENTIALS.password);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setHasError(false);
    timeoutRef.current = setTimeout(() => {
      setIsSubmitting(false);
      setHasError(true);
    }, 1500);
  };

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle level={1}>Sign in</CardTitle>
          <CardDescription>Enter your email and password to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {hasError && (
              <Alert tone="danger" live="assertive" title="Incorrect email or password">
                Check your details and try again.
              </Alert>
            )}

            <TextField
              type="email"
              label="Email"
              value={email}
              onChange={setEmail}
              isRequired
              isInvalid={hasError}
              isDisabled={isSubmitting}
              autoComplete="email"
            />

            <TextField
              type={showPassword ? 'text' : 'password'}
              label="Password"
              value={password}
              onChange={setPassword}
              isRequired
              isInvalid={hasError}
              isDisabled={isSubmitting}
              autoComplete="current-password"
              suffix={
                <AriaButton
                  className={styles.toggleVisibility}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  isDisabled={isSubmitting}
                  onPress={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? (
                    <IconEyeOff aria-hidden="true" focusable="false" />
                  ) : (
                    <IconEye aria-hidden="true" focusable="false" />
                  )}
                </AriaButton>
              }
            />

            <div className={styles.row}>
              <Checkbox
                isSelected={rememberDevice}
                onChange={setRememberDevice}
                isDisabled={isSubmitting}
              >
                Remember this device
              </Checkbox>
              <Link variant="standalone" href="#" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>

            <Button type="submit" isPending={isSubmitting} className={styles.submit}>
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
