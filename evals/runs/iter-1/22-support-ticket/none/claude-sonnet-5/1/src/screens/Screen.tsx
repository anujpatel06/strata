import { useId, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import styles from './Screen.module.css';

type Topic = {
  value: string;
  label: string;
};

type ContactMethod = 'email' | 'phone' | 'none';

type FormErrors = Partial<Record<'topic' | 'subject' | 'description', string>>;

// Mock data: topics a support request can be filed under.
const TOPICS: Topic[] = [
  { value: 'billing', label: 'Billing & payments' },
  { value: 'technical', label: 'Technical issue' },
  { value: 'account', label: 'Account & login' },
  { value: 'feature', label: 'Feature request' },
  { value: 'other', label: 'Something else' },
];

const CONTACT_METHODS: { value: ContactMethod; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'none', label: 'No preference' },
];

const DESCRIPTION_LIMIT = 500;

function createReferenceNumber(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SR-${stamp}-${random}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Screen() {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [contactMethod, setContactMethod] = useState<ContactMethod>('none');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);

  const topicId = useId();
  const subjectId = useId();
  const descriptionId = useId();
  const attachmentId = useId();
  const topicErrorId = useId();
  const subjectErrorId = useId();
  const descriptionErrorId = useId();
  const descriptionCountId = useId();

  const remaining = DESCRIPTION_LIMIT - description.length;
  const submittedTopic = TOPICS.find((t) => t.value === topic);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setAttachment(event.target.files?.[0] ?? null);
  }

  function handleRemoveFile() {
    setAttachment(null);
  }

  function resetForm() {
    setTopic('');
    setSubject('');
    setDescription('');
    setContactMethod('none');
    setAttachment(null);
    setErrors({});
    setReferenceNumber(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    if (!topic) nextErrors.topic = 'Choose a topic for your request.';
    if (!subject.trim()) nextErrors.subject = 'Enter a subject.';
    if (!description.trim()) nextErrors.description = 'Describe your request.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setReferenceNumber(createReferenceNumber());
  }

  if (referenceNumber) {
    return (
      <div className={styles.page}>
        <div className={styles.confirmation}>
          <div className={styles.confirmationIcon} aria-hidden="true">
            ✓
          </div>
          <h1 className={styles.confirmationTitle}>Request submitted</h1>
          <p className={styles.confirmationText}>
            We&apos;ve received your request and will get back to you using your preferred contact
            method.
          </p>
          <div className={styles.referenceBox}>
            <span className={styles.referenceLabel}>Reference number</span>
            <span className={styles.referenceValue}>{referenceNumber}</span>
          </div>
          <dl className={styles.summaryList}>
            <div className={styles.summaryRow}>
              <dt>Topic</dt>
              <dd>{submittedTopic?.label ?? '—'}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>Subject</dt>
              <dd>{subject}</dd>
            </div>
          </dl>
          <button type="button" className={styles.secondaryButton} onClick={resetForm}>
            Submit another request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Raise a support request</h1>
        <p className={styles.subtitle}>
          Tell us what&apos;s going on and we&apos;ll route it to the right team.
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={topicId}>
            Topic <span className={styles.requiredMark}>*</span>
          </label>
          <select
            id={topicId}
            className={styles.select}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            aria-invalid={Boolean(errors.topic)}
            aria-describedby={errors.topic ? topicErrorId : undefined}
          >
            <option value="" disabled>
              Select a topic
            </option>
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {errors.topic && (
            <p className={styles.errorText} id={topicErrorId} role="alert">
              {errors.topic}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={subjectId}>
            Subject <span className={styles.requiredMark}>*</span>
          </label>
          <input
            id={subjectId}
            className={styles.input}
            type="text"
            value={subject}
            maxLength={120}
            placeholder="Brief summary of your request"
            onChange={(e) => setSubject(e.target.value)}
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={errors.subject ? subjectErrorId : undefined}
          />
          {errors.subject && (
            <p className={styles.errorText} id={subjectErrorId} role="alert">
              {errors.subject}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={descriptionId}>
            Description <span className={styles.requiredMark}>*</span>
          </label>
          <textarea
            id={descriptionId}
            className={styles.textarea}
            value={description}
            maxLength={DESCRIPTION_LIMIT}
            rows={6}
            placeholder="Share as much detail as you can"
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={`${descriptionCountId}${errors.description ? ` ${descriptionErrorId}` : ''}`}
          />
          <div className={styles.textareaFooter}>
            {errors.description ? (
              <p className={styles.errorText} id={descriptionErrorId} role="alert">
                {errors.description}
              </p>
            ) : (
              <span />
            )}
            <span
              className={remaining <= 20 ? styles.charCountWarning : styles.charCount}
              id={descriptionCountId}
            >
              {remaining} character{remaining === 1 ? '' : 's'} left
            </span>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={attachmentId}>
            Attachment <span className={styles.optionalMark}>(optional)</span>
          </label>
          <input
            id={attachmentId}
            className={styles.fileInput}
            type="file"
            onChange={handleFileChange}
          />
          {attachment && (
            <div className={styles.fileRow}>
              <span className={styles.fileName}>
                {attachment.name} · {formatFileSize(attachment.size)}
              </span>
              <button
                type="button"
                className={styles.fileRemoveButton}
                onClick={handleRemoveFile}
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Preferred contact method</legend>
          <div className={styles.radioGroup}>
            {CONTACT_METHODS.map((method) => (
              <label key={method.value} className={styles.radioOption}>
                <input
                  className={styles.radioInput}
                  type="radio"
                  name="contactMethod"
                  value={method.value}
                  checked={contactMethod === method.value}
                  onChange={() => setContactMethod(method.value)}
                />
                {method.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className={styles.actions}>
          <button type="submit" className={styles.submitButton}>
            Submit request
          </button>
        </div>
      </form>
    </div>
  );
}
