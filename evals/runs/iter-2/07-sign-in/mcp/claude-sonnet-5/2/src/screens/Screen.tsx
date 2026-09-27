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
} from '@strata/react';
import { IconEye, IconEyeOff } from '@strata/icons';
import { useId, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import styles from './Screen.module.css';

/** Demo link points at "#": keep it from navigating. */
const stay = (e: MouseEvent<Element>) => e.preventDefault();

const WRONG_PASSWORD = 'That email and password combination is incorrect. Check your details and try again.';

export default function Screen() {
  const uid = useId();
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('jordan.ellis@northfield.example');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(WRONG_PASSWORD);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    // Stands in for the network request. The mock backend always rejects this password.
    window.setTimeout(() => {
      setPending(false);
      setError(WRONG_PASSWORD);
      setPassword('');
      passwordRef.current?.focus();
    }, 1400);
  };

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle level={1} id={`${uid}-title`}>
            Sign in
          </CardTitle>
          <CardDescription>Enter your details to access your account.</CardDescription>
        </CardHeader>
        <form noValidate onSubmit={onSubmit} aria-labelledby={`${uid}-title`} className={styles.form}>
          <CardContent className={styles.fields}>
            {error ? (
              <Alert tone="danger" title="Couldn't sign you in">
                {error}
              </Alert>
            ) : null}
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
              inputRef={passwordRef}
              label="Password"
              type={visible ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              isRequired
              isInvalid={!!error}
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
              <Link href="#" onClick={stay} variant="standalone" className={styles.forgot}>
                Forgot password?
              </Link>
            </div>
            <Button type="submit" isPending={pending} className={styles.submit}>
              Sign in
            </Button>
          </CardContent>
        </form>
        <CardFooter className={styles.footer}>
          <span className={styles.muted}>Don't have an account?</span>
          <Link href="#" onClick={stay} variant="standalone">
            Create one
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
