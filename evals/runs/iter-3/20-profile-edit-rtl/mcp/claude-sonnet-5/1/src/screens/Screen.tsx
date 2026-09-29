'use client';

import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DatePicker,
  Select,
  SelectItem,
  TextField,
  ToastRegion,
  toast,
  type Key,
} from '@syntara/react';
import { IconUpload } from '@syntara/icons';
import { DropZone, FileTrigger, type FileDropItem } from 'react-aria-components';
import { parseDate, type DateValue } from '@internationalized/date';
import { useEffect, useId, useState, type FormEvent } from 'react';
import styles from './Screen.module.css';

interface Profile {
  photo: string | undefined;
  name: string;
  email: string;
  phone: string;
  dob: DateValue | null;
  language: Key;
}

// Mock data: what a "last save" would have returned from the server.
const initialProfile: Profile = {
  photo: undefined,
  name: 'Amara Osei',
  email: 'amara.osei@example.com',
  phone: '+1 415 555 0142',
  dob: parseDate('1994-03-18'),
  language: 'en',
};

const languageOptions: { id: Key; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'Arabic' },
  { id: 'fr', label: 'French' },
  { id: 'es', label: 'Spanish' },
  { id: 'hi', label: 'Hindi' },
  { id: 'ur', label: 'Urdu' },
];

const PHOTO_TYPES = ['image/png', 'image/jpeg'];
const PHOTO_MAX = 5 * 1024 * 1024;

const dateEqual = (a: DateValue | null, b: DateValue | null) => (a === b ? true : a != null && b != null && a.compare(b) === 0);

function ChangedBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <Badge tone="brand" variant="soft" size="sm" className={styles.changedBadge}>
      Changed
    </Badge>
  );
}

export default function Screen() {
  const uid = useId();
  const [saved, setSaved] = useState<Profile>(initialProfile);
  const [draft, setDraft] = useState<Profile>(initialProfile);

  // Object URLs hold the photo in memory until revoked.
  useEffect(() => {
    return () => {
      if (draft.photo) URL.revokeObjectURL(draft.photo);
    };
  }, [draft.photo]);

  const changed = {
    photo: draft.photo !== saved.photo,
    name: draft.name !== saved.name,
    email: draft.email !== saved.email,
    phone: draft.phone !== saved.phone,
    dob: !dateEqual(draft.dob, saved.dob),
    language: draft.language !== saved.language,
  };
  const changedCount = Object.values(changed).filter(Boolean).length;
  const hasChanges = changedCount > 0;

  const acceptPhoto = (file: File | undefined) => {
    if (!file || !PHOTO_TYPES.includes(file.type) || file.size > PHOTO_MAX) return;
    setDraft((d) => ({ ...d, photo: URL.createObjectURL(file) }));
  };

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaved(draft);
    toast({ title: 'Profile updated', tone: 'success' });
  };

  const handleCancel = () => {
    setDraft(saved);
  };

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <form onSubmit={handleSave} aria-labelledby={`${uid}-title`} className={styles.form}>
          <CardHeader>
            <CardTitle id={`${uid}-title`}>Edit profile</CardTitle>
            <CardDescription>
              {hasChanges ? (
                <Badge tone="brand" variant="soft" size="sm">
                  {changedCount} unsaved {changedCount === 1 ? 'change' : 'changes'}
                </Badge>
              ) : (
                'No changes since your last save.'
              )}
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
              <Avatar name={draft.name} src={draft.photo} alt="" size="lg" />
              <div className={styles.photoText}>
                <p className={styles.rowLabel} id={`${uid}-photo`}>
                  Profile photo
                  <ChangedBadge show={changed.photo} />
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
                label={
                  <span className={styles.labelRow}>
                    Full name
                    <ChangedBadge show={changed.name} />
                  </span>
                }
                value={draft.name}
                onChange={(name) => setDraft((d) => ({ ...d, name }))}
                autoComplete="name"
                isRequired
              />
              <TextField
                label={
                  <span className={styles.labelRow}>
                    Email
                    <ChangedBadge show={changed.email} />
                  </span>
                }
                type="email"
                value={draft.email}
                onChange={(email) => setDraft((d) => ({ ...d, email }))}
                autoComplete="email"
                className={styles.ltrValue}
                isRequired
              />
              <TextField
                label={
                  <span className={styles.labelRow}>
                    Phone
                    <ChangedBadge show={changed.phone} />
                  </span>
                }
                type="tel"
                value={draft.phone}
                onChange={(phone) => setDraft((d) => ({ ...d, phone }))}
                autoComplete="tel"
                className={styles.ltrValue}
              />
              <DatePicker
                label={
                  <span className={styles.labelRow}>
                    Date of birth
                    <ChangedBadge show={changed.dob} />
                  </span>
                }
                value={draft.dob}
                onChange={(dob) => setDraft((d) => ({ ...d, dob }))}
              />
              <Select
                label={
                  <span className={styles.labelRow}>
                    Preferred language
                    <ChangedBadge show={changed.language} />
                  </span>
                }
                selectedKey={draft.language}
                onSelectionChange={(language) => language !== null && setDraft((d) => ({ ...d, language }))}
              >
                {languageOptions.map((o) => (
                  <SelectItem key={o.id} id={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </CardContent>

          <CardFooter divider className={styles.footerEnd}>
            <Button type="button" variant="ghost" onPress={handleCancel} isDisabled={!hasChanges}>
              Cancel
            </Button>
            <Button type="submit" isDisabled={!hasChanges}>
              Save
            </Button>
          </CardFooter>
        </form>
      </Card>
      <ToastRegion />
    </div>
  );
}
