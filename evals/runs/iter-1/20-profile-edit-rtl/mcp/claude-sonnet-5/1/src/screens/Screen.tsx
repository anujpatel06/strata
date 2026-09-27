'use client';

import { useEffect, useId, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { CalendarDate, getLocalTimeZone, parseDate, today } from '@internationalized/date';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  DatePicker,
  FileUpload,
  Select,
  SelectItem,
  TextField,
  ToastRegion,
  toast,
} from '@strata/react';
import styles from './Screen.module.css';

interface LanguageOption {
  id: string;
  label: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'العربية' },
  { id: 'fr', label: 'Français' },
  { id: 'hi', label: 'हिन्दी' },
  { id: 'es', label: 'Español' },
];

interface ProfileState {
  name: string;
  email: string;
  phone: string;
  dob: CalendarDate | null;
  language: string;
  photoFile: File | undefined;
}

// Mock data: the profile as it was last saved.
const INITIAL_PROFILE: ProfileState = {
  name: 'Layla Haddad',
  email: 'layla.haddad@example.com',
  phone: '+971 50 123 4567',
  dob: parseDate('1994-03-18'),
  language: 'en',
  photoFile: undefined,
};

function sameDate(a: CalendarDate | null, b: CalendarDate | null): boolean {
  if (a === null || b === null) return a === b;
  return a.compare(b) === 0;
}

function ChangedBadge(): ReactNode {
  return (
    <Badge variant="status" tone="info" size="sm" className={styles.changedBadge}>
      Changed
    </Badge>
  );
}

function FieldLabel({ children, changed }: { children: ReactNode; changed: boolean }): ReactNode {
  return (
    <span className={styles.labelRow}>
      {children}
      {changed && <ChangedBadge />}
    </span>
  );
}

export default function Screen() {
  const uid = useId();
  const [saved, setSaved] = useState<ProfileState>(INITIAL_PROFILE);
  const [draft, setDraft] = useState<ProfileState>(INITIAL_PROFILE);

  const photoPreviewUrl = useMemo(
    () => (draft.photoFile ? URL.createObjectURL(draft.photoFile) : undefined),
    [draft.photoFile],
  );
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  const changed = {
    photo: draft.photoFile !== saved.photoFile,
    name: draft.name !== saved.name,
    email: draft.email !== saved.email,
    phone: draft.phone !== saved.phone,
    dob: !sameDate(draft.dob, saved.dob),
    language: draft.language !== saved.language,
  };
  const hasChanges = Object.values(changed).some(Boolean);

  const handleSave = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    setSaved(draft);
    toast({ title: 'Profile updated', description: 'Your changes have been saved.', tone: 'success' });
  };

  const handleCancel = () => {
    setDraft(saved);
  };

  return (
    <div className={styles.root}>
      <form onSubmit={handleSave} aria-labelledby={`${uid}-title`} className={styles.form}>
        <Card className={styles.card}>
          <CardHeader>
            <CardTitle id={`${uid}-title`} level={1}>
              Edit profile
            </CardTitle>
          </CardHeader>
          <CardContent className={styles.stack}>
            <div className={styles.photoRow}>
              <Avatar name={draft.name} src={photoPreviewUrl} size="lg" className={styles.photo} />
              <div className={styles.photoUpload}>
                <FileUpload
                  label={<FieldLabel changed={changed.photo}>Profile photo</FieldLabel>}
                  acceptedFileTypes={['image/png', 'image/jpeg']}
                  maxSize={2 * 1024 * 1024}
                  files={draft.photoFile ? [draft.photoFile] : []}
                  onChange={(files) => setDraft((d) => ({ ...d, photoFile: files[0] }))}
                />
              </div>
            </div>

            <div className={styles.fieldGrid}>
              <TextField
                label={<FieldLabel changed={changed.name}>Full name</FieldLabel>}
                value={draft.name}
                onChange={(value) => setDraft((d) => ({ ...d, name: value }))}
                autoComplete="name"
                name="name"
                isRequired
              />
              <TextField
                label={<FieldLabel changed={changed.email}>Email</FieldLabel>}
                value={draft.email}
                onChange={(value) => setDraft((d) => ({ ...d, email: value }))}
                type="email"
                autoComplete="email"
                name="email"
                isRequired
              />
              <TextField
                label={<FieldLabel changed={changed.phone}>Phone</FieldLabel>}
                value={draft.phone}
                onChange={(value) => setDraft((d) => ({ ...d, phone: value }))}
                type="tel"
                autoComplete="tel"
                name="phone"
              />
              <DatePicker
                label={<FieldLabel changed={changed.dob}>Date of birth</FieldLabel>}
                description="As shown on your ID."
                value={draft.dob}
                onChange={(value) => setDraft((d) => ({ ...d, dob: value }))}
                maxValue={today(getLocalTimeZone())}
                isRequired
              />
              <Select
                label={<FieldLabel changed={changed.language}>Preferred language</FieldLabel>}
                selectedKey={draft.language}
                onSelectionChange={(key) => setDraft((d) => ({ ...d, language: String(key) }))}
                name="language"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.id} id={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </CardContent>
          <CardFooter divider className={styles.footer}>
            <Button variant="outline" onPress={handleCancel} isDisabled={!hasChanges}>
              Cancel
            </Button>
            <Button type="submit" isDisabled={!hasChanges}>
              Save
            </Button>
          </CardFooter>
        </Card>
      </form>
      <ToastRegion />
    </div>
  );
}
