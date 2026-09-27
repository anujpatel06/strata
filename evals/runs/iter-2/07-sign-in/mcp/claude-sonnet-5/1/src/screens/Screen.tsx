import { useRef, useState, type FormEvent } from 'react';
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

// Mock data: the person already tried to sign in once, with the wrong password.
const mockAccount = {
  email: 'jordan.ellis@example.com',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  email?: string;
  password?: string;
}

function validate(next: { email: string; password: string }): FieldErrors {
  return {
    email: !next.email.trim()
      ? 'Enter your email address.'
      : EMAIL_PATTERN.test(next.email.trim())
        ? undefined
        : 'Enter a valid email address.',
    password: next.password ? undefined : 'Enter your password.',
  };
}

export default function Screen() {
  const [email, setEmail] = useState(mockAccount.email);
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [signInFailed, setSignInFailed] = useState(true);
  const passwordRef = useRef<HTMLInputElement>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validate({ email, password });
    setErrors(found);
    if (found.email || found.password) {
      setSignInFailed(false);
      return;
    }
    setSignInFailed(false);
    setPending(true);
    // Stands in for the network request; this mock account always rejects the password.
    setTimeout(() => {
      setPending(false);
      setSignInFailed(true);
      setPassword('');
      passwordRef.current?.focus();
    }, 1200);
  };

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle level={1}>Sign in</CardTitle>
          <CardDescription>Use your work email and password to continue.</CardDescription>
        </CardHeader>
        <form noValidate onSubmit={onSubmit}>
          <CardContent className={styles.fields}>
            {signInFailed && (
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
              onChange={(v) => {
                setEmail(v);
                if (errors.email) setErrors((x) => ({ ...x, email: validate({ email: v, password }).email }));
              }}
              isRequired
              validationBehavior="aria"
              isInvalid={!!errors.email}
              errorMessage={errors.email}
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
                if (errors.password) setErrors((x) => ({ ...x, password: validate({ email, password: v }).password }));
              }}
              isRequired
              validationBehavior="aria"
              isInvalid={!!errors.password}
              errorMessage={errors.password}
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
              <Link href="#" variant="standalone">
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
