'use client';

/**
 * Request flow — three steps (details → evidence → review), then a success state. The same component files a
 * card dispute, an insurance claim or a grocery return: only `content` changes.
 *
 * Behaviour: Continue validates the current step. Problems show inline (FieldError) and in an error summary that
 * takes focus and links to each field. On every step change focus moves to the new step's heading, so keyboard
 * and screen reader users start at the top of the new content. Submit asks for confirmation in an AlertDialog.
 *
 * `headingLevel` (default 1) is the level of the flow title; the step heading and side cards use the next level.
 * Above 1 the block is embedded in another page and renders no <main> landmark.
 */

import {
  AlertDialog,
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  DatePicker,
  EmptyState,
  FileUpload,
  Link,
  Radio,
  RadioGroup,
  Steps,
  TextField,
  type FileUploadEntry,
} from '@strata/react';
import { getLocalTimeZone, today } from '@internationalized/date';
import { IconChevronLeft, IconCircleCheck, IconLogout } from '@tabler/icons-react';
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type HTMLAttributes,
  type JSX,
  type MouseEvent,
  type ReactNode,
} from 'react';
import type { DateValue } from 'react-aria-components';
import { requestFlowContent, type RequestFlowContent, type RequestFlowPlural } from './request-flow.content';
import styles from './request-flow.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

type Level = 1 | 2 | 3 | 4 | 5 | 6;
const level = (n: number): Level => Math.min(6, Math.max(1, Math.round(n))) as Level;
/** A section heading level: always below the title, so never 1. */
const subLevel = (n: number) => Math.min(6, Math.max(2, Math.round(n))) as Exclude<Level, 1>;

function Heading({ level: l, ...rest }: { level: Level } & HTMLAttributes<HTMLHeadingElement>): JSX.Element {
  const Tag = `h${l}` as const;
  return <Tag {...rest} />;
}

/** Demo links point at "#": keep them from navigating (or scrolling a host page to the top). */
const stay = (e: MouseEvent<Element>) => e.preventDefault();

type Step = 'details' | 'evidence' | 'review' | 'done';
type FieldKey = 'reason' | 'field' | 'date' | 'files' | 'confirm';
type Errors = Partial<Record<FieldKey, string>>;

const STEP_FIELDS: Record<Exclude<Step, 'done'>, FieldKey[]> = {
  details: ['reason', 'field', 'date'],
  evidence: ['files'],
  review: ['confirm'],
};

/* ------------------------------------------------------------------ *
 * Formatting and parsing — Intl in the content locale
 * ------------------------------------------------------------------ */

const MINUS = '−';

function useFormat(locale: string, currency: string) {
  return useMemo(() => {
    const money = new Intl.NumberFormat(locale, { style: 'currency', currency });
    const whole = new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const number = new Intl.NumberFormat(locale);
    const longDate = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' });
    const plural = new Intl.PluralRules(locale);
    const parts = number.formatToParts(12345.6);
    const group = parts.find((p) => p.type === 'group')?.value ?? ',';
    const decimal = parts.find((p) => p.type === 'decimal')?.value ?? '.';
    const withMinus = (nf: Intl.NumberFormat, v: number) =>
      nf
        .formatToParts(v)
        .map((p) => (p.type === 'minusSign' ? p.value.replace('-', MINUS) : p.value))
        .join('');
    return {
      symbol: money.formatToParts(0).find((p) => p.type === 'currency')?.value ?? currency,
      money: (v: number) => withMinus(Number.isInteger(v) ? whole : money, v),
      isoDate: (iso: string) => {
        const d = new Date(`${iso}T00:00:00Z`);
        return Number.isNaN(d.getTime()) ? iso : longDate.format(d);
      },
      date: (d: DateValue) => longDate.format(new Date(Date.UTC(d.year, d.month - 1, d.day))),
      count: (n: number, forms: RequestFlowPlural) =>
        (forms[plural.select(n) as keyof RequestFlowPlural] ?? forms.other).replace('{count}', number.format(n)),
      /** "2,499.50" in the content locale → 2499.5; anything else → null. */
      parse: (text: string): number | null => {
        const cleaned = text.trim().split(group).join('').replace(/\s/g, '').replace(decimal, '.');
        return /^\d+(\.\d{1,2})?$/.test(cleaned) ? Number(cleaned) : null;
      },
    };
  }, [locale, currency]);
}

/* ------------------------------------------------------------------ *
 * Block
 * ------------------------------------------------------------------ */

export interface RequestFlowProps {
  /** All copy and data. Defaults to the English sample in ./request-flow.content.ts. */
  content?: RequestFlowContent;
  /** Level of the flow title (default 1). Above 1 the block renders as embedded: no <main>, headings one level down. */
  headingLevel?: 1 | 2 | 3 | 4;
  className?: string;
}

interface Values {
  reason: string | null;
  field: string;
  date: DateValue | null;
  files: FileUploadEntry[];
  confirm: boolean;
}

const EMPTY: Values = { reason: null, field: '', date: null, files: [], confirm: false };

export function RequestFlow({ content = requestFlowContent, headingLevel = 1, className }: RequestFlowProps): JSX.Element {
  const uid = useId();
  const id = (part: string) => `${uid}-${part}`;
  const c = content.requestFlow;
  const fmt = useFormat(content.locale, content.currency);
  const embedded = headingLevel > 1;
  const titleLevel = level(headingLevel);
  const sectionLevel = subLevel(headingLevel + 1);
  const Main = embedded ? 'div' : 'main';

  const [step, setStep] = useState<Step>('details');
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [summary, setSummary] = useState<FieldKey[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const successRef = useRef<HTMLSpanElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const focusOnStep = useRef(false);
  const focusSummary = useRef(false);

  const maxAmount = c.details.field.errors.tooHigh ? Math.abs(c.subject.amount) : undefined;
  const todayDate = useMemo(() => today(getLocalTimeZone()), []);

  /* ---- validation ------------------------------------------------ */

  const check = (key: FieldKey, v: Values): string | undefined => {
    const d = c.details;
    switch (key) {
      case 'reason':
        return v.reason ? undefined : d.reason.error;
      case 'field': {
        if (!v.field.trim()) return d.field.errors.required;
        if (d.field.kind !== 'amount') return undefined;
        const amount = fmt.parse(v.field);
        if (amount == null || amount <= 0) return d.field.errors.invalid ?? d.field.errors.required;
        if (maxAmount != null && amount > maxAmount) return d.field.errors.tooHigh;
        return undefined;
      }
      case 'date':
        if (!v.date) return d.date.errors.required;
        return v.date.compare(todayDate) > 0 ? d.date.errors.future : undefined;
      case 'files':
        return v.files.length > 0 ? undefined : c.evidence.upload.error;
      case 'confirm':
        return v.confirm ? undefined : c.review.confirm.error;
    }
  };

  /** Updates one value; once a field has shown an error, it re-checks as the user fixes it. */
  const update = <K extends FieldKey>(key: K, value: Values[K]) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (errors[key]) setErrors((e) => ({ ...e, [key]: check(key, next) }));
  };

  const goTo = (next: Step) => {
    setErrors({});
    setSummary([]);
    focusOnStep.current = true;
    setStep(next);
  };

  const validateStep = (current: Exclude<Step, 'done'>): boolean => {
    const found: Errors = {};
    for (const key of STEP_FIELDS[current]) {
      const message = check(key, values);
      if (message) found[key] = message;
    }
    const keys = Object.keys(found) as FieldKey[];
    setErrors(found);
    setSummary(keys);
    if (keys.length) focusSummary.current = true;
    return keys.length === 0;
  };

  const onContinue = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step === 'done' || !validateStep(step)) return;
    if (step === 'details') goTo('evidence');
    else if (step === 'evidence') goTo('review');
    else setConfirmOpen(true);
  };

  useEffect(() => {
    if (focusSummary.current) {
      focusSummary.current = false;
      summaryRef.current?.focus();
    }
  }, [summary]);

  useEffect(() => {
    if (!focusOnStep.current) return;
    focusOnStep.current = false;
    (step === 'done' ? successRef.current : headingRef.current)?.focus();
  }, [step]);

  /*
   * After the confirm dialog closes, React Aria returns focus to Submit. Only then swap in the success state
   * (and move focus to its heading); swapping while the modal is still open would fight its focus trap.
   */
  const submitted = useRef(false);
  const finish = () => {
    if (!submitted.current) return;
    submitted.current = false;
    goTo('done');
  };

  /* ---- simulated upload progress --------------------------------- */

  const uploading = values.files.some((f) => (f.progress ?? 100) < 100);
  useEffect(() => {
    if (!uploading) return;
    const timer = setInterval(() => {
      setValues((prev) => ({
        ...prev,
        files: prev.files.map((f, i) =>
          (f.progress ?? 100) < 100 ? { ...f, progress: Math.min(100, (f.progress ?? 0) + 12 + ((i * 7) % 11)) } : f,
        ),
      }));
    }, 180);
    return () => clearInterval(timer);
  }, [uploading]);

  const onFiles = (files: File[]) => {
    const existing = new Map(values.files.map((f) => [f.file, f]));
    update(
      'files',
      files.map((file) => existing.get(file) ?? { file, progress: 0 }),
    );
  };

  /* ---- focus a field from the error summary ---------------------- */

  const FOCUS_TARGET: Record<FieldKey, string[]> = {
    reason: ['input[type="radio"]:checked', 'input[type="radio"]'],
    field: ['input'],
    date: ['[role="spinbutton"]'],
    files: ['button'],
    confirm: ['input[type="checkbox"]'],
  };
  const focusField = (key: FieldKey) => {
    const root = document.getElementById(id(key));
    for (const selector of FOCUS_TARGET[key]) {
      const target = root?.querySelector<HTMLElement>(selector);
      if (target) {
        target.focus();
        return;
      }
    }
  };

  const reasonLabel = c.details.reason.options.find((o) => o.id === values.reason)?.label ?? '';
  const fieldValue =
    c.details.field.kind === 'amount' && fmt.parse(values.field) != null ? fmt.money(fmt.parse(values.field) ?? 0) : values.field;

  const stepMeta: Record<Exclude<Step, 'done'>, { title: string; description: string }> = {
    details: c.details,
    evidence: c.evidence,
    review: c.review,
  };

  return (
    <div className={cx(styles.root, className)}>
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <span className={styles.brand}>
            <span className={styles.logoMark} aria-hidden="true">
              {Array.from(content.product.name.trim())[0] ?? ''}
            </span>
            <span className={styles.productName}>{content.product.name}</span>
          </span>
          <Link href="#" onClick={stay} variant="standalone" className={styles.exit}>
            <IconLogout aria-hidden className={styles.directional} />
            {c.exit}
          </Link>
        </div>
      </header>

      <Main className={styles.main} aria-labelledby={embedded ? undefined : id('title')}>
        <div className={styles.page}>
          <div className={styles.intro}>
            <Heading level={titleLevel} id={id('title')} className={styles.title}>
              {c.title}
            </Heading>
            <p className={styles.subtitle}>{c.subtitle}</p>
          </div>

          <div className={styles.layout}>
            <div className={styles.flow}>
              {step === 'done' ? (
                <Card className={styles.successCard}>
                  <EmptyState
                    level={sectionLevel}
                    icon={<IconCircleCheck className={styles.successIcon} />}
                    title={
                      <span ref={successRef} tabIndex={-1} className={styles.focusTarget}>
                        {c.success.title}
                      </span>
                    }
                    description={withReference(c.success.description, c.success.reference)}
                    action={
                      <div className={styles.successActions}>
                        <Button variant="primary">{c.success.track}</Button>
                        <Button
                          variant="outline"
                          onPress={() => {
                            setValues(EMPTY);
                            goTo('details');
                          }}
                        >
                          {c.success.done}
                        </Button>
                      </div>
                    }
                  />
                </Card>
              ) : (
                <>
                  <Steps
                    aria-label={c.progressLabel}
                    stepLabel={c.stepWord}
                    ofLabel={c.ofWord}
                    completedLabel={c.completedWord}
                    current={step}
                    steps={[
                      { id: 'details', label: c.steps.details },
                      { id: 'evidence', label: c.steps.evidence },
                      { id: 'review', label: c.steps.review },
                    ]}
                    onStepPress={(target) => goTo(target as Step)}
                  />

                  <Card className={styles.stepCard}>
                    <form noValidate onSubmit={onContinue} aria-labelledby={id('step')} className={styles.form}>
                      <CardHeader>
                        <CardTitle level={sectionLevel} id={id('step')} ref={headingRef} tabIndex={-1} className={styles.focusTarget}>
                          {stepMeta[step].title}
                        </CardTitle>
                        <CardDescription>{stepMeta[step].description}</CardDescription>
                      </CardHeader>

                      <CardContent className={styles.fields}>
                        {summary.some((key) => errors[key]) && (
                          <Alert tone="danger" title={c.errorSummary} ref={summaryRef} tabIndex={-1} className={styles.summary}>
                            <ul className={styles.summaryList}>
                              {summary.map((key) =>
                                errors[key] ? (
                                  <li key={key}>
                                    <Link
                                      href={`#${id(key)}`}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        focusField(key);
                                      }}
                                      className={styles.summaryLink}
                                    >
                                      {errors[key]}
                                    </Link>
                                  </li>
                                ) : null,
                              )}
                            </ul>
                          </Alert>
                        )}

                        {step === 'details' && (
                          <>
                            <div id={id('reason')} className={styles.anchor}>
                              <RadioGroup
                                variant="card"
                                label={c.details.reason.label}
                                value={values.reason}
                                onChange={(v) => update('reason', v)}
                                isRequired
                                validationBehavior="aria"
                                isInvalid={!!errors.reason}
                                errorMessage={errors.reason}
                                className={styles.reasons}
                              >
                                {c.details.reason.options.map((o) => (
                                  <Radio key={o.id} value={o.id} description={o.description}>
                                    {o.label}
                                  </Radio>
                                ))}
                              </RadioGroup>
                            </div>

                            <div className={styles.pair}>
                              <div id={id('field')} className={styles.anchor}>
                                <TextField
                                  label={c.details.field.label}
                                  description={c.details.field.description}
                                  placeholder={c.details.field.placeholder}
                                  value={values.field}
                                  onChange={(v) => update('field', v)}
                                  inputMode={c.details.field.kind === 'amount' ? 'decimal' : 'text'}
                                  prefix={c.details.field.kind === 'amount' ? fmt.symbol : undefined}
                                  autoComplete="off"
                                  isRequired
                                  validationBehavior="aria"
                                  isInvalid={!!errors.field}
                                  errorMessage={errors.field}
                                />
                              </div>
                              <div id={id('date')} className={styles.anchor}>
                                <DatePicker
                                  label={c.details.date.label}
                                  description={c.details.date.description}
                                  value={values.date}
                                  onChange={(v) => update('date', v)}
                                  maxValue={todayDate}
                                  isRequired
                                  validationBehavior="aria"
                                  isInvalid={errors.date ? true : undefined}
                                  errorMessage={errors.date}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {step === 'evidence' && (
                          <div id={id('files')} className={styles.anchor}>
                            <FileUpload
                              label={c.evidence.upload.label}
                              description={c.evidence.upload.description}
                              dropLabel={c.evidence.upload.dropLabel}
                              browseLabel={c.evidence.upload.browseLabel}
                              hint={c.evidence.upload.hint}
                              acceptedFileTypes={['image/*', '.pdf', '.heic']}
                              maxSize={10 * 1024 * 1024}
                              allowsMultiple
                              files={values.files}
                              onChange={onFiles}
                              isInvalid={!!errors.files}
                              errorMessage={errors.files}
                            />
                          </div>
                        )}

                        {step === 'review' && (
                          <>
                            <dl className={styles.answers}>
                              <Answer label={c.review.labels.reason} edit={c.review.edit} onEdit={() => goTo('details')}>
                                {reasonLabel}
                              </Answer>
                              <Answer label={c.review.labels.field} edit={c.review.edit} onEdit={() => goTo('details')}>
                                {fieldValue}
                              </Answer>
                              <Answer label={c.review.labels.date} edit={c.review.edit} onEdit={() => goTo('details')}>
                                {values.date ? fmt.date(values.date) : ''}
                              </Answer>
                              <Answer label={c.review.labels.files} edit={c.review.edit} onEdit={() => goTo('evidence')}>
                                <span>{fmt.count(values.files.length, c.review.files)}</span>
                                {values.files.length > 0 && (
                                  <span className={styles.fileNames}>{values.files.map((f) => f.file.name).join(', ')}</span>
                                )}
                              </Answer>
                            </dl>
                            <div id={id('confirm')} className={styles.anchor}>
                              <Checkbox
                                isSelected={values.confirm}
                                onChange={(v) => update('confirm', v)}
                                isRequired
                                validationBehavior="aria"
                                isInvalid={!!errors.confirm}
                                errorMessage={errors.confirm}
                              >
                                {c.review.confirm.label}
                              </Checkbox>
                            </div>
                          </>
                        )}
                      </CardContent>

                      <CardFooter divider className={styles.actions}>
                        {step !== 'details' && (
                          <Button variant="outline" onPress={() => goTo(step === 'review' ? 'evidence' : 'details')}>
                            <IconChevronLeft aria-hidden className={styles.directional} />
                            {c.back}
                          </Button>
                        )}
                        <Button type="submit" variant="primary" className={styles.next} onFocus={finish}>
                          {step === 'review' ? c.review.submit : c.next}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </>
              )}
            </div>

            <Card className={styles.subject}>
              <CardHeader>
                <p className={styles.eyebrow}>{c.subject.label}</p>
                <CardTitle level={sectionLevel}>{c.subject.title}</CardTitle>
                <CardDescription>{c.subject.meta}</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className={styles.facts}>
                  <div className={styles.fact}>
                    <dt>{c.subject.dateLabel}</dt>
                    <dd>
                      <time dateTime={c.subject.date}>{fmt.isoDate(c.subject.date)}</time>
                    </dd>
                  </div>
                  <div className={styles.fact}>
                    <dt>{c.subject.amountLabel}</dt>
                    <dd className={styles.num}>{fmt.money(c.subject.amount)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card variant="outline" className={styles.help}>
              <CardHeader>
                <CardTitle level={sectionLevel}>{c.help.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className={styles.helpList}>
                  {c.help.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>

      <AlertDialog
        isOpen={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          // Fallback if focus didn't return to Submit (e.g. it was moved elsewhere while the dialog closed).
          if (!open) setTimeout(finish, 600);
        }}
        title={c.review.dialog.title}
        actionLabel={c.review.dialog.action}
        cancelLabel={c.review.dialog.cancel}
        onAction={() =>
          new Promise<void>((resolve) => {
            // Stands in for the network request.
            setTimeout(() => {
              submitted.current = true;
              resolve();
            }, 900);
          })
        }
      >
        {c.review.dialog.body}
      </AlertDialog>
    </div>
  );
}

/** Puts the reference into the sentence as a unit that never breaks across lines (it contains hyphens). */
function withReference(sentence: string, reference: string): ReactNode {
  const [before, after] = sentence.split('{reference}');
  if (after === undefined) return sentence;
  return (
    <>
      {before}
      <span className={styles.reference} dir="ltr">
        {reference}
      </span>
      {after}
    </>
  );
}

function Answer({ label, edit, onEdit, children }: { label: string; edit: string; onEdit: () => void; children: ReactNode }): JSX.Element {
  return (
    <div className={styles.answer}>
      <dt className={styles.answerLabel}>{label}</dt>
      <dd className={styles.answerValue}>{children}</dd>
      <dd className={styles.answerEdit}>
        <Button variant="link" size="sm" onPress={onEdit} aria-label={`${edit} ${label}`}>
          {edit}
        </Button>
      </dd>
    </div>
  );
}
