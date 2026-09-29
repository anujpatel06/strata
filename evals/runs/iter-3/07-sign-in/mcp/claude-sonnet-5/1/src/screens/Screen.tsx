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

// Mock data: no backend. The screen loads mid-flow, right after a failed sign-in attempt.
const mockAccount = {
  email: 'anuj.patel@example.com',
};

const stay = (e: MouseEvent<HTMLAnchorElement>) => e.preventDefault();

export default function Screen() {
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState(mockAccount.email);
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(true);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(true);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFailed(false);
    setPending(true);
    // Stands in for the network request. The mock account always rejects this password.
    setTimeout(() => {
      setPending(false);
      setFailed(true);
      passwordRef.current?.focus();
    }, 1400);
  };

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle level={1}>Sign in</CardTitle>
          <CardDescription>Welcome back. Enter your details to continue.</CardDescription>
        </CardHeader>

        <form noValidate onSubmit={onSubmit} className={styles.form}>
          <CardContent className={styles.fields}>
            {failed && (
              <Alert tone="danger" title="Incorrect email or password" live="assertive">
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
              validationBehavior="aria"
            />

            <TextField
              inputRef={passwordRef}
              label="Password"
              type={visible ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (failed) setFailed(false);
              }}
              isRequired
              validationBehavior="aria"
              isInvalid={failed}
              errorMessage={failed ? 'That password is incorrect.' : undefined}
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
              <Checkbox name="remember" isSelected={remember} onChange={setRemember}>
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
          <span className={styles.footerText}>Don&apos;t have an account?</span>
          <Link href="#" onClick={stay} variant="standalone">
            Create one
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
