import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import styles from './Screen.module.css';

interface ProfileData {
  photoUrl: string | null;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  language: string;
}

type FieldKey = keyof ProfileData;
type SaveStatus = 'idle' | 'saving' | 'saved';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'ur', label: 'Urdu' },
];

// Mock data standing in for the signed-in person's saved profile.
const INITIAL_PROFILE: ProfileData = {
  photoUrl: null,
  fullName: 'Sara Ahmed',
  email: 'sara.ahmed@example.com',
  phone: '+1 415 555 0192',
  dateOfBirth: '1994-06-21',
  language: 'en',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase();
}

export default function Screen() {
  const [savedProfile, setSavedProfile] = useState<ProfileData>(INITIAL_PROFILE);
  const [draft, setDraft] = useState<ProfileData>(INITIAL_PROFILE);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<number | undefined>(undefined);
  const successTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(saveTimeoutRef.current);
      window.clearTimeout(successTimeoutRef.current);
    },
    [],
  );

  const changedFields = useMemo(() => {
    const changed = new Set<FieldKey>();
    (Object.keys(savedProfile) as FieldKey[]).forEach((key) => {
      if (savedProfile[key] !== draft[key]) changed.add(key);
    });
    return changed;
  }, [savedProfile, draft]);

  const hasChanges = changedFields.size > 0;

  function updateField<K extends FieldKey>(key: K, value: ProfileData[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setStatus((prev) => (prev === 'saved' ? 'idle' : prev));
  }

  function handlePhotoPick() {
    fileInputRef.current?.click();
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') updateField('photoUrl', reader.result);
    };
    reader.readAsDataURL(file);
  }

  function handleRemovePhoto() {
    updateField('photoUrl', null);
  }

  function handleCancel() {
    window.clearTimeout(saveTimeoutRef.current);
    setDraft(savedProfile);
    setStatus('idle');
  }

  function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!hasChanges || status === 'saving') return;
    setStatus('saving');
    saveTimeoutRef.current = window.setTimeout(() => {
      setSavedProfile(draft);
      setStatus('saved');
      successTimeoutRef.current = window.setTimeout(() => setStatus('idle'), 4000);
    }, 600);
  }

  return (
    <form className={styles.screen} onSubmit={handleSave} noValidate>
      <header className={styles.header}>
        <h1 className={styles.title}>Edit profile</h1>
        <p className={styles.subtitle}>Update your personal details. Fields changed since your last save are marked.</p>
      </header>

      <section className={styles.photoSection}>
        <div className={styles.avatar}>
          {draft.photoUrl ? (
            <img src={draft.photoUrl} alt="Profile photo" className={styles.avatarImage} />
          ) : (
            <span className={styles.avatarInitials} aria-hidden="true">
              {getInitials(draft.fullName)}
            </span>
          )}
        </div>
        <div className={styles.photoActions}>
          <div className={styles.photoActionsRow}>
            <button type="button" className={styles.secondaryButton} onClick={handlePhotoPick}>
              Change photo
            </button>
            {draft.photoUrl && (
              <button type="button" className={styles.textButton} onClick={handleRemovePhoto}>
                Remove photo
              </button>
            )}
            {changedFields.has('photoUrl') && <span className={styles.changedBadge}>Edited</span>}
          </div>
          <p className={styles.photoHint}>JPG or PNG, square images look best.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg"
            className={styles.hiddenInput}
            onChange={handlePhotoChange}
            aria-label="Upload a new profile photo"
          />
        </div>
      </section>

      <section className={styles.fields}>
        <Field label="Full name" htmlFor="fullName" changed={changedFields.has('fullName')} wide>
          <input
            id="fullName"
            type="text"
            className={styles.input}
            value={draft.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            autoComplete="name"
            required
          />
        </Field>

        <Field label="Email" htmlFor="email" changed={changedFields.has('email')} wide>
          <input
            id="email"
            type="email"
            className={styles.input}
            value={draft.email}
            onChange={(e) => updateField('email', e.target.value)}
            autoComplete="email"
            required
          />
        </Field>

        <Field label="Phone" htmlFor="phone" changed={changedFields.has('phone')}>
          <input
            id="phone"
            type="tel"
            className={styles.input}
            value={draft.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            autoComplete="tel"
          />
        </Field>

        <Field label="Date of birth" htmlFor="dateOfBirth" changed={changedFields.has('dateOfBirth')}>
          <input
            id="dateOfBirth"
            type="date"
            className={styles.input}
            value={draft.dateOfBirth}
            onChange={(e) => updateField('dateOfBirth', e.target.value)}
          />
        </Field>

        <Field label="Preferred language" htmlFor="language" changed={changedFields.has('language')}>
          <select
            id="language"
            className={styles.select}
            value={draft.language}
            onChange={(e) => updateField('language', e.target.value)}
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <div className={styles.statusRow} role="status" aria-live="polite">
        {status === 'saving' && <span className={styles.statusSaving}>Saving…</span>}
        {status === 'saved' && <span className={styles.statusSaved}>Profile saved.</span>}
        {status === 'idle' && hasChanges && (
          <span className={styles.statusPending}>You have unsaved changes.</span>
        )}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={handleCancel}
          disabled={!hasChanges || status === 'saving'}
        >
          Cancel
        </button>
        <button type="submit" className={styles.saveButton} disabled={!hasChanges || status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

interface FieldProps {
  label: string;
  htmlFor: string;
  changed: boolean;
  wide?: boolean;
  children: ReactNode;
}

function Field({ label, htmlFor, changed, wide, children }: FieldProps) {
  return (
    <div className={wide ? `${styles.field} ${styles.fieldWide}` : styles.field}>
      <label htmlFor={htmlFor} className={styles.label}>
        {label}
        {changed && <span className={styles.changedBadge}>Edited</span>}
      </label>
      {children}
    </div>
  );
}
