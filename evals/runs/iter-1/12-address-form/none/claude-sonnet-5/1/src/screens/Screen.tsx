import { useId, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import styles from './Screen.module.css';

const EMIRATES = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
] as const;

interface AddressForm {
  fullName: string;
  phone: string;
  emirate: string;
  area: string;
  building: string;
  flat: string;
  notes: string;
}

// Mock state: submitted once already, with the phone missing and the flat number invalid.
const MOCK_FORM: AddressForm = {
  fullName: 'Aisha Al Mazrouei',
  phone: '',
  emirate: 'Dubai',
  area: 'Al Barsha 1',
  building: 'May Tower 2',
  flat: '12/B!',
  notes: 'Please call on arrival. Leave with security if unavailable.',
};

const FLAT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\- ]{0,9}$/;

type Errors = Partial<Record<keyof AddressForm, string>>;

function validate(form: AddressForm): Errors {
  const errors: Errors = {};

  if (!form.fullName.trim()) {
    errors.fullName = 'Enter the recipient’s full name.';
  }
  if (!form.phone.trim()) {
    errors.phone = 'Enter a phone number so the driver can reach you.';
  }
  if (!form.emirate) {
    errors.emirate = 'Select an emirate.';
  }
  if (!form.area.trim()) {
    errors.area = 'Enter the area.';
  }
  if (form.flat.trim() && !FLAT_PATTERN.test(form.flat.trim())) {
    errors.flat = 'Enter a valid flat number, e.g. 204 or 12B.';
  }

  return errors;
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: (describedBy: string | undefined) => ReactNode;
}

function Field({ id, label, required, error, children }: FieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children(error ? errorId : undefined)}
      {error && (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function Screen() {
  const [form, setForm] = useState<AddressForm>(MOCK_FORM);
  const [submitted, setSubmitted] = useState(true);
  const formId = useId();

  const errors = submitted ? validate(form) : {};

  function update<K extends keyof AddressForm>(key: K) {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Delivery address</h1>
        <p className={styles.subtitle}>Tell us where to deliver your order.</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Field id={`${formId}-fullName`} label="Full name" required error={errors.fullName}>
          {(describedBy) => (
            <input
              id={`${formId}-fullName`}
              className={styles.control}
              type="text"
              autoComplete="name"
              value={form.fullName}
              onChange={update('fullName')}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={describedBy}
            />
          )}
        </Field>

        <Field id={`${formId}-phone`} label="Phone number" required error={errors.phone}>
          {(describedBy) => (
            <input
              id={`${formId}-phone`}
              className={styles.control}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="e.g. 050 123 4567"
              value={form.phone}
              onChange={update('phone')}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={describedBy}
            />
          )}
        </Field>

        <Field id={`${formId}-emirate`} label="Emirate" required error={errors.emirate}>
          {(describedBy) => (
            <select
              id={`${formId}-emirate`}
              className={styles.control}
              value={form.emirate}
              onChange={update('emirate')}
              aria-invalid={Boolean(errors.emirate)}
              aria-describedby={describedBy}
            >
              <option value="" disabled>
                Select an emirate
              </option>
              {EMIRATES.map((emirate) => (
                <option key={emirate} value={emirate}>
                  {emirate}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field id={`${formId}-area`} label="Area" required error={errors.area}>
          {(describedBy) => (
            <input
              id={`${formId}-area`}
              className={styles.control}
              type="text"
              autoComplete="address-level2"
              value={form.area}
              onChange={update('area')}
              aria-invalid={Boolean(errors.area)}
              aria-describedby={describedBy}
            />
          )}
        </Field>

        <div className={styles.row}>
          <Field id={`${formId}-building`} label="Building">
            {(describedBy) => (
              <input
                id={`${formId}-building`}
                className={styles.control}
                type="text"
                autoComplete="address-line1"
                value={form.building}
                onChange={update('building')}
                aria-describedby={describedBy}
              />
            )}
          </Field>

          <Field id={`${formId}-flat`} label="Flat number" error={errors.flat}>
            {(describedBy) => (
              <input
                id={`${formId}-flat`}
                className={styles.control}
                type="text"
                autoComplete="address-line2"
                value={form.flat}
                onChange={update('flat')}
                aria-invalid={Boolean(errors.flat)}
                aria-describedby={describedBy}
              />
            )}
          </Field>
        </div>

        <Field id={`${formId}-notes`} label="Delivery notes">
          {(describedBy) => (
            <textarea
              id={`${formId}-notes`}
              className={`${styles.control} ${styles.textarea}`}
              rows={3}
              placeholder="Landmarks, gate codes, preferred delivery times…"
              value={form.notes}
              onChange={update('notes')}
              aria-describedby={describedBy}
            />
          )}
        </Field>

        <div className={styles.actions}>
          <button className={styles.submitButton} type="submit">
            Save address
          </button>
        </div>
      </form>
    </div>
  );
}
