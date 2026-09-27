import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import styles from './Screen.module.css';

interface FormValues {
  fullName: string;
  phone: string;
  emirate: string;
  area: string;
  building: string;
  flatNumber: string;
  deliveryNotes: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMIRATES = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
];

// Mock data: the shopper has already tried to submit once, leaving the
// phone number empty and the flat number in an invalid format.
const initialValues: FormValues = {
  fullName: 'Fatima Al Mazrouei',
  phone: '',
  emirate: 'Dubai',
  area: 'Al Barsha 1',
  building: 'Marina Heights, Tower B',
  flatNumber: '12/B*',
  deliveryNotes: 'Call on arrival, gate code 4521.',
};

const FLAT_NUMBER_PATTERN = /^[A-Za-z0-9 -]+$/;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Enter the recipient's full name.";
  }
  if (!values.phone.trim()) {
    errors.phone = 'Enter a phone number.';
  }
  if (!values.emirate) {
    errors.emirate = 'Select an emirate.';
  }
  if (!values.area.trim()) {
    errors.area = 'Enter the area.';
  }
  if (values.flatNumber.trim() && !FLAT_NUMBER_PATTERN.test(values.flatNumber.trim())) {
    errors.flatNumber = 'Use only letters, numbers, spaces and hyphens.';
  }

  return errors;
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  helperText?: string;
  children: ReactNode;
}

function Field({ id, label, required, optional, error, helperText, children }: FieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            {' '}
            *
          </span>
        )}
        {optional && <span className={styles.optional}> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p className={styles.error} id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className={styles.helper} id={`${id}-helper`}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export default function Screen() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [submitted, setSubmitted] = useState(true);

  const errors = submitted ? validate(values) : {};
  const hasErrors = Object.keys(errors).length > 0;

  function handleChange(key: keyof FormValues) {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setValues((previous) => ({ ...previous, [key]: value }));
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  function describedBy(id: keyof FormValues) {
    if (errors[id]) return `${id}-error`;
    return undefined;
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Delivery address</h1>
          <p className={styles.subtitle}>Tell us where to deliver your order.</p>
        </header>

        {hasErrors && (
          <p className={styles.summary} role="alert">
            There&apos;s a problem with the delivery address. Please check the highlighted fields.
          </p>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.row}>
            <Field id="fullName" label="Full name" required error={errors.fullName}>
              <input
                id="fullName"
                name="fullName"
                type="text"
                className={`${styles.input} ${errors.fullName ? styles.inputInvalid : ''}`}
                value={values.fullName}
                onChange={handleChange('fullName')}
                autoComplete="name"
                aria-required="true"
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={describedBy('fullName')}
              />
            </Field>

            <Field id="phone" label="Phone number" required error={errors.phone}>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                placeholder="05X XXX XXXX"
                className={`${styles.input} ${errors.phone ? styles.inputInvalid : ''}`}
                value={values.phone}
                onChange={handleChange('phone')}
                autoComplete="tel"
                aria-required="true"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={describedBy('phone')}
              />
            </Field>
          </div>

          <div className={styles.row}>
            <Field id="emirate" label="Emirate" required error={errors.emirate}>
              <select
                id="emirate"
                name="emirate"
                className={`${styles.select} ${errors.emirate ? styles.inputInvalid : ''}`}
                value={values.emirate}
                onChange={handleChange('emirate')}
                aria-required="true"
                aria-invalid={Boolean(errors.emirate)}
                aria-describedby={describedBy('emirate')}
              >
                <option value="" disabled>
                  Select emirate
                </option>
                {EMIRATES.map((emirate) => (
                  <option key={emirate} value={emirate}>
                    {emirate}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="area" label="Area" required error={errors.area}>
              <input
                id="area"
                name="area"
                type="text"
                className={`${styles.input} ${errors.area ? styles.inputInvalid : ''}`}
                value={values.area}
                onChange={handleChange('area')}
                autoComplete="address-level2"
                aria-required="true"
                aria-invalid={Boolean(errors.area)}
                aria-describedby={describedBy('area')}
              />
            </Field>
          </div>

          <div className={styles.row}>
            <Field id="building" label="Building / villa" optional>
              <input
                id="building"
                name="building"
                type="text"
                className={styles.input}
                value={values.building}
                onChange={handleChange('building')}
                autoComplete="address-line1"
              />
            </Field>

            <Field
              id="flatNumber"
              label="Flat / apartment number"
              optional
              error={errors.flatNumber}
              helperText="For example, 204 or 12B."
            >
              <input
                id="flatNumber"
                name="flatNumber"
                type="text"
                className={`${styles.input} ${errors.flatNumber ? styles.inputInvalid : ''}`}
                value={values.flatNumber}
                onChange={handleChange('flatNumber')}
                autoComplete="address-line2"
                aria-invalid={Boolean(errors.flatNumber)}
                aria-describedby={describedBy('flatNumber') ?? 'flatNumber-helper'}
              />
            </Field>
          </div>

          <Field
            id="deliveryNotes"
            label="Delivery notes"
            optional
            helperText="Anything that helps the driver find you."
          >
            <textarea
              id="deliveryNotes"
              name="deliveryNotes"
              className={styles.textarea}
              value={values.deliveryNotes}
              onChange={handleChange('deliveryNotes')}
              rows={3}
              aria-describedby="deliveryNotes-helper"
            />
          </Field>

          <div className={styles.actions}>
            <button type="submit" className={styles.button}>
              Save address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
