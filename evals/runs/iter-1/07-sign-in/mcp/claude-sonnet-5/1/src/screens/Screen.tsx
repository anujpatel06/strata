'use client';

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

// Mock: this account has just failed to sign in with a wrong password.
const mock = {
  email: 'jordan.taylor@example.com',
};

export default function Screen() {
  const [email, setEmail] = useState(mock.email);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(true);
  const [pending, setPending] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFailed(false);
    setPending(true);
    // Stands in for the network request; this mock always rejects the password.
    setTimeout(() => {
      setPending(false);
      setPassword('');
      setFailed(true);
    }, 1400);
  };

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Enter your email and password to continue.</CardDescription>
        </CardHeader>
        <form noValidate onSubmit={onSubmit}>
          <CardContent className={styles.fields}>
            {failed && (
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
            />
            <TextField
              label="Password"
              type={visible ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              isRequired
              isInvalid={failed}
              errorMessage={failed ? 'Check your password and try again.' : undefined}
              suffix={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={visible ? 'Hide password' : 'Show password'}
                  onPress={() => setVisible((v) => !v)}
                >
                  {visible ? <IconEyeOff aria-hidden /> : <IconEye aria-hidden />}
                </Button>
              }
            />
            <div className={styles.options}>
              <Checkbox isSelected={remember} onChange={setRemember}>
                Remember this device
              </Checkbox>
              <Link href="#" onClick={(e) => e.preventDefault()} variant="standalone">
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
