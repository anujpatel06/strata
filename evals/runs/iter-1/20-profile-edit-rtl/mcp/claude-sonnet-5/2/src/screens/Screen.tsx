import { CalendarDate, getLocalTimeZone, parseDate, today, type DateValue } from '@internationalized/date';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  DatePicker,
  Select,
  SelectItem,
  TextField,
  ToastRegion,
  toast,
} from '@strata/react';
import { IconUpload } from '@strata/icons';
import { DropZone, FileTrigger, type FileDropItem, type Key } from 'react-aria-components';
import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import styles from './Screen.module.css';

const PHOTO_TYPES = ['image/png', 'image/jpeg'];
const PHOTO_MAX = 5 * 1024 * 1024;

const LANGUAGE_OPTIONS = [
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'Arabic' },
  { id: 'fr', label: 'French' },
  { id: 'hi', label: 'Hindi' },
  { id: 'es', label: 'Spanish' },
] as const;

// A stand-in photo (inline SVG) so the screen works offline, without a backend.
const MOCK_PHOTO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#c9d6e3"/><circle cx="32" cy="26" r="12" fill="#8a9bb0"/><path d="M10 64c2-14 11-21 22-21s20 7 22 21z" fill="#8a9bb0"/></svg>',
  );

interface Profile {
  photo: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: CalendarDate;
  language: string;
}

const MOCK_PROFILE: Profile = {
  photo: MOCK_PHOTO,
  fullName: 'Amara Okafor',
  email: 'amara.okafor@example.com',
  phone: '+1 415 555 0192',
  dateOfBirth: parseDate('1994-03-18'),
  language: 'en',
};

function sameDate(a: DateValue, b: DateValue): boolean {
  return a.toString() === b.toString();
}

function FieldLabel({ children, changed }: { children: ReactNode; changed: boolean }) {
  return (
    <span className={styles.fieldLabel}>
      {children}
      {changed && (
        <Badge tone="info" size="sm">
          Changed
        </Badge>
      )}
    </span>
  );
}

export default function Screen() {
  const uid = useId();
  const [saved, setSaved] = useState<Profile>(MOCK_PROFILE);
  const [draft, setDraft] = useState<Profile>(MOCK_PROFILE);

  // Object URLs hold the chosen file in memory until revoked.
  useEffect(() => {
    return () => {
      if (draft.photo.startsWith('blob:')) URL.revokeObjectURL(draft.photo);
    };
  }, [draft.photo]);

  const changed = {
    photo: draft.photo !== saved.photo,
    fullName: draft.fullName !== saved.fullName,
    email: draft.email !== saved.email,
    phone: draft.phone !== saved.phone,
    dateOfBirth: !sameDate(draft.dateOfBirth, saved.dateOfBirth),
    language: draft.language !== saved.language,
  };
  const changedCount = Object.values(changed).filter(Boolean).length;
  const isDirty = changedCount > 0;

  const acceptPhoto = (file: File | undefined) => {
    if (!file || !PHOTO_TYPES.includes(file.type) || file.size > PHOTO_MAX) return;
    setDraft((d) => ({ ...d, photo: URL.createObjectURL(file) }));
  };

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaved(draft);
    toast({ title: 'Profile updated', description: 'Your changes have been saved.', tone: 'success' });
  };

  const handleCancel = () => {
    setDraft(saved);
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title} id={`${uid}-title`}>
          Edit profile
        </h1>
        <p className={styles.description}>Update your personal details. Changed fields are marked until you save.</p>
      </div>

      <Card className={styles.card}>
        <form onSubmit={handleSave} aria-labelledby={`${uid}-title`} className={styles.form}>
          <CardContent className={styles.stack}>
            <DropZone
              aria-label="Profile photo"
              getDropOperation={(types) => (PHOTO_TYPES.some((t) => types.has(t)) ? 'copy' : 'cancel')}
              onDrop={async (e) => {
                const item = e.items.find((i): i is FileDropItem => i.kind === 'file');
                acceptPhoto(item ? await item.getFile() : undefined);
              }}
              className={styles.photoRow}
            >
              <Avatar name={draft.fullName} src={draft.photo} alt="" size="lg" className={styles.photo} />
              <div className={styles.photoText}>
                <p className={styles.rowLabel} id={`${uid}-photo`}>
                  <FieldLabel changed={changed.photo}>Profile photo</FieldLabel>
                </p>
                <p className={styles.rowDescription} id={`${uid}-photo-hint`}>
                  PNG or JPEG, up to 5 MB.
                </p>
              </div>
              <FileTrigger acceptedFileTypes={PHOTO_TYPES} onSelect={(files) => acceptPhoto(files?.[0])}>
                <Button variant="outline" size="sm" aria-describedby={`${uid}-photo ${uid}-photo-hint`}>
                  <IconUpload aria-hidden />
                  Change photo
                </Button>
              </FileTrigger>
            </DropZone>

            <div className={styles.fieldGrid}>
              <TextField
                label={<FieldLabel changed={changed.fullName}>Full name</FieldLabel>}
                value={draft.fullName}
                onChange={(value) => setDraft((d) => ({ ...d, fullName: value }))}
                autoComplete="name"
                name="fullName"
                isRequired
              />
              <TextField
                label={<FieldLabel changed={changed.email}>Email</FieldLabel>}
                value={draft.email}
                onChange={(value) => setDraft((d) => ({ ...d, email: value }))}
                type="email"
                autoComplete="email"
                name="email"
                className={styles.ltrValue}
                isRequired
              />
              <TextField
                label={<FieldLabel changed={changed.phone}>Phone</FieldLabel>}
                value={draft.phone}
                onChange={(value) => setDraft((d) => ({ ...d, phone: value }))}
                type="tel"
                autoComplete="tel"
                name="phone"
                className={styles.ltrValue}
              />
              <DatePicker
                label={<FieldLabel changed={changed.dateOfBirth}>Date of birth</FieldLabel>}
                value={draft.dateOfBirth}
                onChange={(value) => value && setDraft((d) => ({ ...d, dateOfBirth: value as CalendarDate }))}
                maxValue={today(getLocalTimeZone())}
                className={styles.ltrValue}
              />
              <Select
                label={<FieldLabel changed={changed.language}>Preferred language</FieldLabel>}
                selectedKey={draft.language}
                onSelectionChange={(key: Key | null) => key && setDraft((d) => ({ ...d, language: String(key) }))}
                name="language"
              >
                {LANGUAGE_OPTIONS.map((o) => (
                  <SelectItem key={o.id} id={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </CardContent>
          <CardFooter divider className={styles.footer}>
            <p aria-live="polite" className={styles.status}>
              {isDirty
                ? `${changedCount} ${changedCount === 1 ? 'field' : 'fields'} changed since last save`
                : 'No changes since last save'}
            </p>
            <div className={styles.actions}>
              <Button variant="ghost" type="button" onPress={handleCancel} isDisabled={!isDirty}>
                Cancel
              </Button>
              <Button type="submit" isDisabled={!isDirty}>
                Save
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
      <ToastRegion />
    </div>
  );
}
