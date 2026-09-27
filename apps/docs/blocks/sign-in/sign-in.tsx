'use client';

/**
 * Sign in — email and password with a show/hide toggle, "keep me signed in", a passkey option and legal links.
 * A centred card on narrow containers; from 960px of its own width it becomes two columns with a brand panel
 * in the tenant's primary action colours. Built only from Strata components; copy comes from `content`.
 *
 * `headingLevel` (default 1) is the level of the sign-in title. Above 1 the block is embedded in another page and
 * renders no <main> or <footer> landmarks.
 */

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Link,
  Separator,
  TextField,
  ToastRegion,
  toast,
} from '@strata/react';
import { IconEye, IconEyeOff, IconKey } from '@strata/icons';
import { Fragment, useId, useRef, useState, type FormEvent, type JSX, type MouseEvent, type ReactNode } from 'react';
import { signInContent, type SignInContent } from './sign-in.content';
import styles from './sign-in.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

type Level = 1 | 2 | 3 | 4 | 5 | 6;
const level = (n: number): Level => Math.min(6, Math.max(1, Math.round(n))) as Level;

/** Demo links point at "#": keep them from navigating (or scrolling a host page to the top). */
const stay = (e: MouseEvent<Element>) => e.preventDefault();

/** `*word*` → <em>word</em>: editorial emphasis written in the copy (the heading face's italic), not in the component. */
function emphasis(text: string): ReactNode {
  const parts = text.split('*');
  if (parts.length < 3) return text;
  return parts.map((part, i) => (i % 2 === 1 ? <em key={i}>{part}</em> : <Fragment key={i}>{part}</Fragment>));
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SignInProps {
  /** All copy. Defaults to the English sample in ./sign-in.content.ts. */
  content?: SignInContent;
  /** Level of the sign-in title (default 1). Above 1 the block renders as embedded: no <main> or <footer> landmarks. */
  headingLevel?: 1 | 2 | 3 | 4;
  className?: string;
}

export function SignIn({ content = signInContent, headingLevel = 1, className }: SignInProps): JSX.Element {
  const uid = useId();
  const c = content.signIn;
  const embedded = headingLevel > 1;
  const Main = embedded ? 'div' : 'main';
  const Footer = embedded ? 'div' : 'footer';
  const monogram = Array.from(content.product.name.trim())[0] ?? '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [pending, setPending] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const validate = (next: { email: string; password: string }) => ({
    email: !next.email.trim() ? c.email.errors.required : EMAIL.test(next.email.trim()) ? undefined : c.email.errors.invalid,
    password: next.password ? undefined : c.password.errors.required,
  });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validate({ email, password });
    setErrors(found);
    if (found.email) return emailRef.current?.focus();
    if (found.password) return passwordRef.current?.focus();
    setPending(true);
    // Stands in for the network request.
    setTimeout(() => {
      setPending(false);
      toast({ title: c.success.title, tone: 'success' });
    }, 1200);
  };

  return (
    <div className={cx(styles.root, className)}>
      <Main className={styles.layout} aria-labelledby={embedded ? undefined : `${uid}-title`}>
        <div className={styles.formSide}>
          <Card className={styles.card}>
            <CardHeader className={styles.cardHeader}>
              <span className={styles.logoMark} aria-hidden="true">
                {monogram}
              </span>
              <CardTitle level={level(headingLevel)} id={`${uid}-title`} className={styles.title}>
                {emphasis(c.title)}
              </CardTitle>
              <CardDescription>{c.subtitle}</CardDescription>
            </CardHeader>

            <form noValidate onSubmit={onSubmit} aria-labelledby={`${uid}-title`} className={styles.form}>
              <CardContent className={styles.fields}>
                <TextField
                  inputRef={emailRef}
                  label={c.email.label}
                  placeholder={c.email.placeholder}
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
                  className={styles.ltrValue}
                />
                <TextField
                  inputRef={passwordRef}
                  label={c.password.label}
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
                      aria-label={visible ? c.password.hide : c.password.show}
                      onPress={() => setVisible((v) => !v)}
                      className={styles.reveal}
                    >
                      {visible ? <IconEyeOff aria-hidden /> : <IconEye aria-hidden />}
                    </Button>
                  }
                />
                <div className={styles.options}>
                  <Checkbox name="remember" defaultSelected>
                    {c.remember}
                  </Checkbox>
                  <Link href="#" onClick={stay} variant="standalone" className={styles.small}>
                    {c.password.forgot}
                  </Link>
                </div>
                <Button type="submit" isPending={pending} className={styles.full}>
                  {c.submit}
                </Button>
                <Separator label={c.or} />
                <Button variant="outline" className={styles.full}>
                  <IconKey aria-hidden />
                  {c.passkey}
                </Button>
              </CardContent>
            </form>

            <CardFooter className={styles.cardFooter}>
              <span className={styles.muted}>{c.signUp.prompt}</span>
              <Link href="#" onClick={stay} variant="standalone">
                {c.signUp.action}
              </Link>
            </CardFooter>
          </Card>

          <Footer className={styles.legal}>
            <ul className={styles.legalList}>
              {[c.legal.terms, c.legal.privacy, c.legal.help].map((label) => (
                <li key={label}>
                  <Link href="#" onClick={stay} variant="standalone" className={styles.legalLink}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </Footer>
        </div>

        {/*
          The brand panel is a quiet inset surface, not a slab of brand colour: the mark, a short kicker, and the
          promise set large. Decorative arcs sit in the far corner, away from the text.
        */}
        <div className={styles.brandPanel}>
          <span className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              {monogram}
            </span>
            <span className={styles.brandName}>{content.product.name}</span>
          </span>
          <svg className={styles.arcs} viewBox="0 0 400 400" aria-hidden="true" focusable="false">
            {[80, 140, 200, 260, 320].map((r) => (
              <circle key={r} cx="400" cy="0" r={r} />
            ))}
          </svg>
          <div className={styles.brandCopy}>
            <p className={styles.headline}>{emphasis(c.brand.headline)}</p>
            <p className={styles.brandBody}>{c.brand.body}</p>
          </div>
        </div>
      </Main>
      <ToastRegion />
    </div>
  );
}
