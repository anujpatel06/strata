import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
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
  Select,
  SelectItem,
  Separator,
  TextField,
  ToastRegion,
  toast,
} from '@strata/react';
import { IconCalendar, IconCamera, IconMail, IconPhone, IconTrash, IconUser } from '@strata/icons';
import styles from './Screen.module.css';

interface ProfileData {
  photoUrl: string | undefined;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  language: string;
}

const LANGUAGES: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'Arabic' },
  { id: 'fr', label: 'French' },
  { id: 'hi', label: 'Hindi' },
  { id: 'es', label: 'Spanish' },
  { id: 'pt', label: 'Portuguese' },
];

// Mock data: stands in for the signed-in person's saved profile.
const INITIAL_PROFILE: ProfileData = {
  photoUrl: undefined,
  fullName: 'Amara Osei',
  email: 'amara.osei@example.com',
  phone: '+1 415 555 0142',
  dateOfBirth: '1994-06-18',
  language: 'en',
};

function FieldLabel({ children, isChanged }: { children: ReactNode; isChanged: boolean }) {
  return (
    <span className={styles.labelRow}>
      {children}
      {isChanged && (
        <Badge tone="info" variant="soft" size="sm">
          Changed
        </Badge>
      )}
    </span>
  );
}

export default function Screen() {
  const [saved, setSaved] = useState<ProfileData>(INITIAL_PROFILE);
  const [form, setForm] = useState<ProfileData>(INITIAL_PROFILE);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke any not-yet-saved photo preview if the screen unmounts before save/cancel.
  const currentPhotoRef = useRef(form.photoUrl);
  currentPhotoRef.current = form.photoUrl;
  const savedPhotoRef = useRef(saved.photoUrl);
  savedPhotoRef.current = saved.photoUrl;
  useEffect(() => {
    return () => {
      const current = currentPhotoRef.current;
      if (current && current !== savedPhotoRef.current && current.startsWith('blob:')) {
        URL.revokeObjectURL(current);
      }
    };
  }, []);

  const changed = {
    photoUrl: form.photoUrl !== saved.photoUrl,
    fullName: form.fullName !== saved.fullName,
    email: form.email !== saved.email,
    phone: form.phone !== saved.phone,
    dateOfBirth: form.dateOfBirth !== saved.dateOfBirth,
    language: form.language !== saved.language,
  };
  const changedCount = Object.values(changed).filter(Boolean).length;
  const hasChanges = changedCount > 0;

  function updateField<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function replacePhoto(nextUrl: string | undefined) {
    setForm((prev) => {
      if (prev.photoUrl && prev.photoUrl !== saved.photoUrl && prev.photoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(prev.photoUrl);
      }
      return { ...prev, photoUrl: nextUrl };
    });
  }

  function handlePhotoSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    replacePhoto(URL.createObjectURL(file));
  }

  function handleCancel() {
    if (form.photoUrl && form.photoUrl !== saved.photoUrl && form.photoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(form.photoUrl);
    }
    setForm(saved);
  }

  function handleSave() {
    setIsSaving(true);
    window.setTimeout(() => {
      setSaved(form);
      setIsSaving(false);
      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved.',
        tone: 'success',
      });
    }, 600);
  }

  return (
    <div className={styles.page}>
      <ToastRegion />

      <header className={styles.header}>
        <h1 className={styles.title}>Edit profile</h1>
        <p className={styles.subtitle}>Update your personal details. This information is only visible to you.</p>
      </header>

      <Card className={styles.card}>
        <CardHeader divider>
          <CardTitle level={2}>Personal information</CardTitle>
          <CardDescription>
            {hasChanges
              ? `${changedCount} field${changedCount === 1 ? '' : 's'} changed since your last save.`
              : 'No changes since your last save.'}
          </CardDescription>
        </CardHeader>

        <CardContent className={styles.content}>
          <div className={styles.photoSection}>
            <Avatar name={form.fullName} src={form.photoUrl} size="lg" />
            <div className={styles.photoInfo}>
              <div className={styles.photoButtons}>
                <Button variant="outline" size="sm" onPress={() => fileInputRef.current?.click()}>
                  <IconCamera />
                  Change photo
                </Button>
                {form.photoUrl && (
                  <Button variant="ghost" size="sm" tone="danger" onPress={() => replacePhoto(undefined)}>
                    <IconTrash />
                    Remove
                  </Button>
                )}
                {changed.photoUrl && (
                  <Badge tone="info" variant="soft" size="sm">
                    Changed
                  </Badge>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className={styles.hiddenInput}
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </div>
              <p className={styles.photoHint}>PNG or JPG, up to 5 MB.</p>
            </div>
          </div>

          <Separator />

          <div className={styles.grid}>
            <TextField
              label={<FieldLabel isChanged={changed.fullName}>Full name</FieldLabel>}
              value={form.fullName}
              onChange={(value) => updateField('fullName', value)}
              placeholder="Your full name"
              prefix={<IconUser />}
              className={styles.field}
            />
            <TextField
              label={<FieldLabel isChanged={changed.email}>Email</FieldLabel>}
              type="email"
              value={form.email}
              onChange={(value) => updateField('email', value)}
              placeholder="you@example.com"
              description="We'll send account notices here."
              prefix={<IconMail />}
              className={styles.field}
            />
            <TextField
              label={<FieldLabel isChanged={changed.phone}>Phone</FieldLabel>}
              type="tel"
              value={form.phone}
              onChange={(value) => updateField('phone', value)}
              placeholder="+1 415 555 0100"
              description="Used for sign-in verification."
              prefix={<IconPhone />}
              className={styles.field}
            />
            <TextField
              label={<FieldLabel isChanged={changed.dateOfBirth}>Date of birth</FieldLabel>}
              type="date"
              value={form.dateOfBirth}
              onChange={(value) => updateField('dateOfBirth', value)}
              prefix={<IconCalendar />}
              className={styles.field}
            />
            <Select
              label={<FieldLabel isChanged={changed.language}>Preferred language</FieldLabel>}
              description="Sets the language for menus and notifications, including Arabic."
              selectedKey={form.language}
              onSelectionChange={(key) => {
                if (key != null) updateField('language', String(key));
              }}
              className={styles.field}
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
          <Button variant="outline" onPress={handleCancel} isDisabled={!hasChanges || isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onPress={handleSave} isDisabled={!hasChanges} isPending={isSaving}>
            Save changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
