import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  DatePicker,
  FileUpload,
  Select,
  SelectItem,
  TextField,
  ToastRegion,
  toast,
  type Key,
} from '@syntara/react';
import { getLocalTimeZone, parseDate, today, type DateValue } from '@internationalized/date';
import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import styles from './Screen.module.css';

interface LanguageOption {
  id: string;
  label: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'Arabic' },
  { id: 'fr', label: 'French' },
  { id: 'es', label: 'Spanish' },
  { id: 'hi', label: 'Hindi' },
];

interface Profile {
  name: string;
  email: string;
  phone: string;
  dob: DateValue;
  language: string;
  photo: string | undefined;
}

// Mock data: the profile as it was after the last save. There is no backend.
const SAVED_PROFILE: Profile = {
  name: 'Amara Osei',
  email: 'amara.osei@example.com',
  phone: '+234 802 555 0176',
  dob: parseDate('1994-03-18'),
  language: 'en',
  photo: undefined,
};

const PHOTO_TYPES = ['image/png', 'image/jpeg'];

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function ChangedLabel({ children, changed }: { children: string; changed: boolean }) {
  return (
    <span className={styles.labelRow}>
      {children}
      {changed && (
        <Badge variant="status" tone="info" size="sm">
          Changed
        </Badge>
      )}
    </span>
  );
}

export default function Screen() {
  const uid = useId();
  const [saved, setSaved] = useState(SAVED_PROFILE);
  const [draft, setDraft] = useState(SAVED_PROFILE);

  // Object URLs created for a chosen photo file live until they're replaced or the screen unmounts.
  useEffect(() => {
    return () => {
      if (draft.photo && draft.photo !== saved.photo) URL.revokeObjectURL(draft.photo);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changed = {
    photo: draft.photo !== saved.photo,
    name: draft.name !== saved.name,
    email: draft.email !== saved.email,
    phone: draft.phone !== saved.phone,
    dob: draft.dob.toString() !== saved.dob.toString(),
    language: draft.language !== saved.language,
  };
  const changedCount = Object.values(changed).filter(Boolean).length;
  const hasChanges = changedCount > 0;

  const maxDob = useMemo(() => today(getLocalTimeZone()), []);

  const handlePhotoChange = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (draft.photo && draft.photo !== saved.photo) URL.revokeObjectURL(draft.photo);
    setDraft((d) => ({ ...d, photo: URL.createObjectURL(file) }));
  };

  const handleCancel = () => {
    if (draft.photo && draft.photo !== saved.photo) URL.revokeObjectURL(draft.photo);
    setDraft(saved);
  };

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaved(draft);
    toast({ title: 'Profile updated', tone: 'success' });
  };

  const statusText = hasChanges
    ? `${changedCount} ${changedCount === 1 ? 'field has' : 'fields have'} changed since your last save.`
    : 'No changes yet.';

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title} id={`${uid}-title`}>
          Edit profile
        </h1>
        <p className={styles.description}>Update your photo and personal details.</p>
      </div>

      <form onSubmit={handleSave} aria-labelledby={`${uid}-title`} className={styles.form}>
        <Card>
          <CardContent className={styles.stack}>
            <div className={styles.photoRow}>
              <Avatar name={draft.name} src={draft.photo} tint="auto" size="lg" className={styles.avatar}>
                {initials(draft.name)}
              </Avatar>
              <div className={styles.photoUpload}>
                <FileUpload
                  label={<ChangedLabel changed={changed.photo}>Profile photo</ChangedLabel>}
                  description="Shown on your profile and to people you work with."
                  acceptedFileTypes={PHOTO_TYPES}
                  maxSize={5 * 1024 * 1024}
                  dropLabel="Drop a photo here or"
                  browseLabel="choose a file"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>

            <div className={styles.fieldGrid}>
              <TextField
                label={<ChangedLabel changed={changed.name}>Full name</ChangedLabel>}
                value={draft.name}
                onChange={(name) => setDraft((d) => ({ ...d, name }))}
                autoComplete="name"
                name="name"
                isRequired
              />
              <TextField
                label={<ChangedLabel changed={changed.email}>Email</ChangedLabel>}
                value={draft.email}
                onChange={(email) => setDraft((d) => ({ ...d, email }))}
                type="email"
                autoComplete="email"
                name="email"
                className={styles.ltrValue}
                isRequired
              />
              <TextField
                label={<ChangedLabel changed={changed.phone}>Phone</ChangedLabel>}
                value={draft.phone}
                onChange={(phone) => setDraft((d) => ({ ...d, phone }))}
                type="tel"
                autoComplete="tel"
                name="phone"
                className={styles.ltrValue}
              />
              <DatePicker
                label={<ChangedLabel changed={changed.dob}>Date of birth</ChangedLabel>}
                value={draft.dob}
                onChange={(dob) => dob && setDraft((d) => ({ ...d, dob }))}
                maxValue={maxDob}
                name="dob"
              />
              <Select
                label={<ChangedLabel changed={changed.language}>Preferred language</ChangedLabel>}
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
            <p className={styles.status}>{statusText}</p>
            <div className={styles.actions}>
              <Button type="button" variant="outline" onPress={handleCancel} isDisabled={!hasChanges}>
                Cancel
              </Button>
              <Button type="submit" isDisabled={!hasChanges}>
                Save changes
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>

      <ToastRegion />
    </div>
  );
}
