import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
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
  Select,
  SelectItem,
  TextField,
  ToastRegion,
  toast,
} from '@strata/react';
import { IconCamera, IconTrash } from '@strata/icons';
import styles from './Screen.module.css';

interface ProfileValues {
  photo: string | null;
  fullName: string;
  email: string;
  phone: string;
  dob: CalendarDate;
  language: string;
}

const LANGUAGES: { id: string; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'Arabic (العربية)' },
  { id: 'fr', label: 'French (Français)' },
  { id: 'hi', label: 'Hindi (हिन्दी)' },
  { id: 'ur', label: 'Urdu (اردو)' },
];

// The person's saved profile, as it would come back from the server.
const INITIAL_PROFILE: ProfileValues = {
  photo: null,
  fullName: 'Anuj Patel',
  email: 'patel.anuj1997@gmail.com',
  phone: '+1 415 555 0132',
  dob: new CalendarDate(1997, 4, 12),
  language: 'en',
};

function sameDate(a: CalendarDate, b: CalendarDate) {
  return a.compare(b) === 0;
}

function ChangedBadge() {
  return (
    <Badge tone="info" variant="soft" size="sm" className={styles.changedBadge}>
      Edited
    </Badge>
  );
}

function FieldLabel({ children, changed }: { children: ReactNode; changed: boolean }) {
  return (
    <span className={styles.labelRow}>
      {children}
      {changed && <ChangedBadge />}
    </span>
  );
}

export default function Screen() {
  const [saved, setSaved] = useState<ProfileValues>(INITIAL_PROFILE);
  const [draft, setDraft] = useState<ProfileValues>(INITIAL_PROFILE);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const changed = useMemo(
    () => ({
      photo: draft.photo !== saved.photo,
      fullName: draft.fullName !== saved.fullName,
      email: draft.email !== saved.email,
      phone: draft.phone !== saved.phone,
      dob: !sameDate(draft.dob, saved.dob),
      language: draft.language !== saved.language,
    }),
    [draft, saved],
  );

  const hasChanges = Object.values(changed).some(Boolean);

  function setField<K extends keyof ProfileValues>(key: K, value: ProfileValues[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function handlePhotoPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setField('photo', typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  }

  function handleCancel() {
    setDraft(saved);
  }

  function handleSave() {
    setIsSaving(true);
    window.setTimeout(() => {
      setSaved(draft);
      setIsSaving(false);
      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved.',
        tone: 'success',
      });
    }, 700);
  }

  return (
    <div className={styles.page}>
      <ToastRegion />
      <Card className={styles.card}>
        <CardHeader divider>
          <CardTitle level={1}>Edit profile</CardTitle>
        </CardHeader>

        <CardContent className={styles.content}>
          <section className={styles.photoSection}>
            <div className={styles.avatarWrap}>
              <Avatar name={draft.fullName || 'Unnamed'} src={draft.photo ?? undefined} size="lg" />
              <Button
                size="icon"
                variant="contrast"
                className={styles.photoButton}
                aria-label="Change photo"
                onPress={() => fileInputRef.current?.click()}
              >
                <IconCamera />
              </Button>
            </div>
            <div className={styles.photoMeta}>
              <span className={styles.photoLabel}>
                Profile photo
                {changed.photo && <ChangedBadge />}
              </span>
              <div className={styles.photoActions}>
                <Button variant="link" onPress={() => fileInputRef.current?.click()}>
                  Change photo
                </Button>
                {draft.photo && (
                  <Button variant="ghost" tone="danger" size="sm" onPress={() => setField('photo', null)}>
                    <IconTrash />
                    Remove photo
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoPick}
                className={styles.hiddenInput}
                aria-hidden="true"
                tabIndex={-1}
              />
            </div>
          </section>

          <div className={styles.grid}>
            <TextField
              label={<FieldLabel changed={changed.fullName}>Full name</FieldLabel>}
              value={draft.fullName}
              onChange={(value) => setField('fullName', value)}
              isRequired
              className={styles.fieldFull}
            />

            <TextField
              label={<FieldLabel changed={changed.email}>Email</FieldLabel>}
              type="email"
              value={draft.email}
              onChange={(value) => setField('email', value)}
              isRequired
            />

            <TextField
              label={<FieldLabel changed={changed.phone}>Phone</FieldLabel>}
              type="tel"
              value={draft.phone}
              onChange={(value) => setField('phone', value)}
              isRequired
            />

            <DatePicker
              label={<FieldLabel changed={changed.dob}>Date of birth</FieldLabel>}
              value={draft.dob}
              maxValue={today(getLocalTimeZone())}
              onChange={(value) => value && setField('dob', value as CalendarDate)}
            />

            <Select
              label={<FieldLabel changed={changed.language}>Preferred language</FieldLabel>}
              selectedKey={draft.language}
              onSelectionChange={(key) => setField('language', String(key))}
            >
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.id} id={lang.id}>
                  {lang.label}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardContent>

        <CardFooter divider className={styles.footer}>
          <span className={styles.changeSummary}>
            {hasChanges ? 'You have unsaved changes.' : 'No changes to save.'}
          </span>
          <div className={styles.actions}>
            <Button variant="outline" onPress={handleCancel} isDisabled={!hasChanges || isSaving}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleSave} isDisabled={!hasChanges} isPending={isSaving}>
              Save
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
