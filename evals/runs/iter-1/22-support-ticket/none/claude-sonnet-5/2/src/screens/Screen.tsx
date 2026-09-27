import { useId, useRef, useState, type FormEvent } from 'react';
import styles from './Screen.module.css';

// Mock data: the list of topics a request can be raised about.
const TOPICS = [
  { id: 'billing', label: 'Billing and payments' },
  { id: 'technical', label: 'Technical issue' },
  { id: 'account', label: 'Account access' },
  { id: 'feature', label: 'Feature request' },
  { id: 'other', label: 'Something else' },
] as const;

const CONTACT_PREFERENCES = [
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'none', label: 'No preference' },
] as const;

type ContactPreference = (typeof CONTACT_PREFERENCES)[number]['id'];

const DESCRIPTION_MAX_LENGTH = 500;

interface FormErrors {
  topic?: string;
  subject?: string;
  description?: string;
  contactPreference?: string;
}

function generateReferenceNumber() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SR-${code}`;
}

export default function Screen() {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [contactPreference, setContactPreference] = useState<ContactPreference | ''>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [reference, setReference] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const topicId = useId();
  const subjectId = useId();
  const descriptionId = useId();
  const descriptionCountId = useId();
  const attachmentId = useId();
  const contactLegendId = useId();

  const submittedTopicLabel = TOPICS.find((t) => t.id === topic)?.label ?? '';
  const remainingCharacters = DESCRIPTION_MAX_LENGTH - description.length;

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!topic) next.topic = 'Choose a topic.';
    if (!subject.trim()) next.subject = 'Enter a subject.';
    if (!description.trim()) next.description = 'Enter a description.';
    if (!contactPreference) next.contactPreference = 'Choose how you want to be contacted.';
    return next;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setReference(generateReferenceNumber());
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setAttachmentName(event.target.files?.[0]?.name ?? null);
  }

  function handleRemoveAttachment() {
    setAttachmentName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleReset() {
    setTopic('');
    setSubject('');
    setDescription('');
    setAttachmentName(null);
    setContactPreference('');
    setErrors({});
    setReference(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  if (reference) {
    return (
      <div className={styles.page}>
        <div className={styles.confirmation} role="status">
          <div className={styles.confirmationIcon} aria-hidden="true">
            ✓
          </div>
          <h1 className={styles.title}>Request submitted</h1>
          <p className={styles.intro}>
            Thanks — we've received your request about <strong>{submittedTopicLabel}</strong>. Keep the reference
            number below for your records.
          </p>
          <div className={styles.referenceBox}>
            <span className={styles.referenceLabel}>Reference number</span>
            <span className={styles.referenceNumber}>{reference}</span>
          </div>
          <p className={styles.intro}>
            {contactPreference === 'email' && "We'll get back to you by email."}
            {contactPreference === 'phone' && "We'll get back to you by phone."}
            {contactPreference === 'none' && "We'll get back to you using whichever channel works best."}
          </p>
          <button type="button" className={styles.secondaryButton} onClick={handleReset}>
            Submit another request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Raise a support request</h1>
      <p className={styles.intro}>Tell us what's going on and we'll get back to you.</p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={topicId}>
            Topic
          </label>
          <select
            id={topicId}
            className={styles.select}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            aria-invalid={Boolean(errors.topic)}
            aria-describedby={errors.topic ? `${topicId}-error` : undefined}
          >
            <option value="" disabled>
              Choose a topic
            </option>
            {TOPICS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          {errors.topic && (
            <span id={`${topicId}-error`} className={styles.error}>
              {errors.topic}
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={subjectId}>
            Subject
          </label>
          <input
            id={subjectId}
            type="text"
            className={styles.input}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="A short summary of your request"
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={errors.subject ? `${subjectId}-error` : undefined}
          />
          {errors.subject && (
            <span id={`${subjectId}-error`} className={styles.error}>
              {errors.subject}
            </span>
          )}
        </div>

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label className={styles.label} htmlFor={descriptionId}>
              Description
            </label>
            <span
              id={descriptionCountId}
              className={`${styles.charCount} ${remainingCharacters <= 20 ? styles.charCountWarning : ''}`}
            >
              {remainingCharacters} characters left
            </span>
          </div>
          <textarea
            id={descriptionId}
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX_LENGTH))}
            maxLength={DESCRIPTION_MAX_LENGTH}
            rows={6}
            placeholder="Give us as much detail as you can"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={`${descriptionCountId}${errors.description ? ` ${descriptionId}-error` : ''}`}
          />
          {errors.description && (
            <span id={`${descriptionId}-error`} className={styles.error}>
              {errors.description}
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={attachmentId}>
            Attachment <span className={styles.optional}>(optional)</span>
          </label>
          <div className={styles.fileRow}>
            <input
              ref={fileInputRef}
              id={attachmentId}
              type="file"
              className={styles.fileInput}
              onChange={handleFileChange}
            />
            {attachmentName && (
              <button type="button" className={styles.removeFileButton} onClick={handleRemoveAttachment}>
                Remove
              </button>
            )}
          </div>
          {attachmentName && <span className={styles.fileName}>{attachmentName}</span>}
        </div>

        <fieldset className={styles.fieldset} aria-describedby={errors.contactPreference ? `${contactLegendId}-error` : undefined}>
          <legend id={contactLegendId} className={styles.legend}>
            How would you like to be contacted?
          </legend>
          <div className={styles.radioGroup}>
            {CONTACT_PREFERENCES.map((option) => (
              <label key={option.id} className={styles.radioOption}>
                <input
                  type="radio"
                  name="contactPreference"
                  value={option.id}
                  checked={contactPreference === option.id}
                  onChange={() => setContactPreference(option.id)}
                />
                {option.label}
              </label>
            ))}
          </div>
          {errors.contactPreference && (
            <span id={`${contactLegendId}-error`} className={styles.error}>
              {errors.contactPreference}
            </span>
          )}
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
