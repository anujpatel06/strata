import { useState, type FormEvent } from 'react';
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

// Mock data: the person just tried to sign in with a wrong password.
const account = {
  email: 'jordan.lee@example.com',
};

export default function Screen() {
  const [email, setEmail] = useState(account.email);
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [remember, setRemember] = useState(false);
  const [pending, setPending] = useState(false);
  const [hasError, setHasError] = useState(true);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHasError(false);
    setPending(true);
    window.setTimeout(() => {
      setPending(false);
      setHasError(true);
    }, 1200);
  };

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Enter your details to continue.</CardDescription>
        </CardHeader>

        <form noValidate onSubmit={handleSubmit} className={styles.form}>
          <CardContent className={styles.fields}>
            {hasError && (
              <Alert tone="danger" title="Incorrect email or password">
                Check your details and try again.
              </Alert>
            )}

            <TextField
              label="Email"
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              onChange={setEmail}
              isRequired
              isDisabled={pending}
            />

            <TextField
              label="Password"
              type={passwordVisible ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              isRequired
              isDisabled={pending}
              isInvalid={hasError}
              errorMessage={hasError ? 'Incorrect password.' : undefined}
              suffix={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                  onPress={() => setPasswordVisible((v) => !v)}
                  isDisabled={pending}
                >
                  {passwordVisible ? <IconEyeOff aria-hidden /> : <IconEye aria-hidden />}
                </Button>
              }
            />

            <div className={styles.options}>
              <Checkbox isSelected={remember} onChange={setRemember} isDisabled={pending}>
                Remember this device
              </Checkbox>
              <Link variant="standalone" className={styles.forgot}>
                Forgot password?
              </Link>
            </div>

            <Button type="submit" isPending={pending} className={styles.submit}>
              Sign in
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
