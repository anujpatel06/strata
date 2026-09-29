'use client';

import { useRef, useState, type FormEvent, type MouseEvent } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Link,
  TextField,
} from '@syntara/react';
import { IconEye, IconEyeOff } from '@syntara/icons';
import styles from './Screen.module.css';

/** Mock content and data — there is no backend. */
const content = {
  title: 'Sign in',
  subtitle: 'Welcome back. Enter your details to continue.',
  email: { label: 'Email', placeholder: 'you@example.com' },
  password: { label: 'Password', show: 'Show password', hide: 'Hide password' },
  remember: 'Remember this device',
  forgot: 'Forgot password?',
  submit: 'Sign in',
  error: {
    title: "Couldn't sign you in",
    body: 'That email or password is incorrect. Try again or reset your password.',
  },
};

const EMAIL = 'priya.sharma@example.com';

/** Demo link points nowhere: keep it from navigating. */
const stay = (e: MouseEvent<Element>) => e.preventDefault();

export default function Screen() {
  const [email, setEmail] = useState(EMAIL);
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [hasError, setHasError] = useState(true);
  const [pending, setPending] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHasError(false);
    setPending(true);
    // Stands in for the network request; this mock always reports the same wrong password.
    setTimeout(() => {
      setPending(false);
      setHasError(true);
      passwordRef.current?.focus();
    }, 1200);
  };

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle level={1}>{content.title}</CardTitle>
          <CardDescription>{content.subtitle}</CardDescription>
        </CardHeader>
        <form noValidate onSubmit={onSubmit} className={styles.form}>
          <CardContent className={styles.fields}>
            {hasError && (
              <Alert tone="danger" title={content.error.title} live="polite">
                {content.error.body}
              </Alert>
            )}
            <TextField
              label={content.email.label}
              placeholder={content.email.placeholder}
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              onChange={setEmail}
              isRequired
            />
            <TextField
              inputRef={passwordRef}
              label={content.password.label}
              type={visible ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              isRequired
              suffix={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={visible ? content.password.hide : content.password.show}
                  onPress={() => setVisible((v) => !v)}
                >
                  {visible ? <IconEyeOff aria-hidden /> : <IconEye aria-hidden />}
                </Button>
              }
            />
            <div className={styles.options}>
              <Checkbox name="remember">{content.remember}</Checkbox>
              <Link href="#" onClick={stay} variant="standalone">
                {content.forgot}
              </Link>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" isPending={pending} className={styles.submit}>
              {content.submit}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
