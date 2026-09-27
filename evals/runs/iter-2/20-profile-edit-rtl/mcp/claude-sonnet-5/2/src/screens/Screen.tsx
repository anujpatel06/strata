'use client';

import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
  DatePicker,
  Select,
  SelectItem,
  TextField,
  ToastRegion,
  toast,
} from '@strata/react';
import { IconUpload } from '@strata/icons';
import { CalendarDate, type DateValue } from '@internationalized/date';
import { DropZone, FileTrigger, type FileDropItem } from 'react-aria-components';
import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import styles from './Screen.module.css';

interface LanguageOption {
  id: string;
  label: string;
}

const LANGUAGES: LanguageOption[] = [
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'Arabic (العربية)' },
  { id: 'hi', label: 'Hindi (हिन्दी)' },
  { id: 'fr', label: 'French (Français)' },
  { id: 'es', label: 'Spanish (Español)' },
];

interface ProfileData {
  photo: string | undefined;
  name: string;
  email: string;
  phone: string;
  dob: DateValue;
  languageId: string;
}

const INITIAL_PROFILE: ProfileData = {
  photo: undefined,
  name: 'Aanya Kapoor',
  email: 'aanya.kapoor@example.com',
  phone: '+91 98765 43210',
  dob: new CalendarDate(1994, 6, 12),
  languageId: 'en',
};

const PHOTO_TYPES = ['image/png', 'image/jpeg'];
const PHOTO_MAX = 5 * 1024 * 1024;

function ChangedBadge(): ReactNode {
  return (
    <Badge tone="warning" variant="status" size="sm" dot>
      Changed
    </Badge>
  );
}

function FieldLabel({ children, changed }: { children: ReactNode; changed: boolean }) {
  return (
    <span className={styles.fieldLabel}>
      {children}
      {changed && <ChangedBadge />}
    </span>
  );
}

export default function Screen() {
  const uid = useId();
  const [saved, setSaved] = useState<ProfileData>(INITIAL_PROFILE);
  const [draft, setDraft] = useState<ProfileData>(INITIAL_PROFILE);

  // Object URLs hold the chosen photo file in memory until revoked; the ref tracks the latest one for unmount cleanup.
  const photoRef = useRef(draft.photo);
  photoRef.current = draft.photo;
  useEffect(() => {
    return () => {
      if (photoRef.current?.startsWith('blob:')) URL.revokeObjectURL(photoRef.current);
    };
  }, []);

  const changed = useMemo(
    () => ({
      photo: draft.photo !== saved.photo,
      name: draft.name !== saved.name,
      email: draft.email !== saved.email,
      phone: draft.phone !== saved.phone,
      dob: draft.dob.compare(saved.dob) !== 0,
      language: draft.languageId !== saved.languageId,
    }),
    [draft, saved],
  );
  const changedCount = Object.values(changed).filter(Boolean).length;
  const hasChanges = changedCount > 0;

  const acceptPhoto = (file: File | undefined) => {
    if (!file || !PHOTO_TYPES.includes(file.type) || file.size > PHOTO_MAX) return;
    setDraft((d) => {
      if (d.photo?.startsWith('blob:')) URL.revokeObjectURL(d.photo);
      return { ...d, photo: URL.createObjectURL(file) };
    });
  };

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!hasChanges) return;
    setSaved(draft);
    toast({ title: 'Profile updated', description: 'Your changes have been saved.', tone: 'success' });
  };

  const handleCancel = () => {
    setDraft(saved);
  };

  return (
    <div className={styles.root}>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title} id={`${uid}-title`}>
            Edit profile
          </h1>
          <p className={styles.description}>Update your personal details. People you work with may see this information.</p>
        </div>

        <Card>
          <form onSubmit={handleSave} aria-labelledby={`${uid}-title`} className={styles.form}>
            <CardHeader divider>
              <CardTitle level={2}>Personal details</CardTitle>
              <CardDescription>
                <span role="status" aria-live="polite">
                  {hasChanges
                    ? `${changedCount} field${changedCount === 1 ? '' : 's'} changed since your last save`
                    : 'No changes since your last save'}
                </span>
              </CardDescription>
            </CardHeader>

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
                <Avatar name={draft.name} src={draft.photo} alt="" tint="auto" size="lg" className={styles.photo} />
                <div className={styles.photoText}>
                  <p className={styles.rowLabel} id={`${uid}-photo`}>
                    <FieldLabel changed={changed.photo}>Profile photo</FieldLabel>
                  </p>
                  <p className={styles.rowDescription} id={`${uid}-photo-hint`}>
                    PNG or JPG, up to 5MB.
                  </p>
                </div>
                <FileTrigger acceptedFileTypes={PHOTO_TYPES} onSelect={(files) => acceptPhoto(files?.[0])}>
                  <Button variant="outline" size="sm" aria-describedby={`${uid}-photo ${uid}-photo-hint`} className={styles.photoButton}>
                    <IconUpload aria-hidden />
                    Change photo
                  </Button>
                </FileTrigger>
              </DropZone>

              <div className={styles.fieldGrid}>
                <TextField
                  label={<FieldLabel changed={changed.name}>Full name</FieldLabel>}
                  value={draft.name}
                  onChange={(name) => setDraft((d) => ({ ...d, name }))}
                  autoComplete="name"
                  name="name"
                  isRequired
                />
                <TextField
                  label={<FieldLabel changed={changed.email}>Email</FieldLabel>}
                  value={draft.email}
                  onChange={(email) => setDraft((d) => ({ ...d, email }))}
                  type="email"
                  autoComplete="email"
                  name="email"
                  className={styles.ltrValue}
                  isRequired
                />
                <TextField
                  label={<FieldLabel changed={changed.phone}>Phone</FieldLabel>}
                  value={draft.phone}
                  onChange={(phone) => setDraft((d) => ({ ...d, phone }))}
                  type="tel"
                  autoComplete="tel"
                  name="phone"
                  className={styles.ltrValue}
                />
                <DatePicker
                  label={<FieldLabel changed={changed.dob}>Date of birth</FieldLabel>}
                  value={draft.dob}
                  onChange={(dob) => dob && setDraft((d) => ({ ...d, dob }))}
                  maxValue={new CalendarDate(2026, 9, 28)}
                  name="dob"
                />
                <Select
                  label={<FieldLabel changed={changed.language}>Preferred language</FieldLabel>}
                  selectedKey={draft.languageId}
                  onSelectionChange={(key) => key && setDraft((d) => ({ ...d, languageId: String(key) }))}
                  name="language"
                >
                  {LANGUAGES.map((o) => (
                    <SelectItem key={o.id} id={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </CardContent>

            <CardFooter divider className={styles.footer}>
              <Button type="button" variant="outline" onPress={handleCancel} isDisabled={!hasChanges}>
                Cancel
              </Button>
              <Button type="submit" isDisabled={!hasChanges}>
                Save changes
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
      <ToastRegion />
    </div>
  );
}
