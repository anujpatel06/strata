import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import {
  Alert,
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
  toast,
  ToastRegion,
} from '@strata/react';
import { IconCamera, IconTrash } from '@strata/icons';
import styles from './Screen.module.css';

interface ProfileValues {
  fullName: string;
  email: string;
  phone: string;
  dob: CalendarDate;
  language: string;
  photo: string | null;
}

interface LanguageOption {
  id: string;
  label: string;
}

const LANGUAGES: LanguageOption[] = [
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'Arabic (العربية)' },
  { id: 'fr', label: 'French (Français)' },
  { id: 'hi', label: 'Hindi (हिन्दी)' },
  { id: 'ur', label: 'Urdu (اردو)' },
];

// Mock data: stands in for the signed-in person's saved profile.
const INITIAL_PROFILE: ProfileValues = {
  fullName: 'Anuj Patel',
  email: 'patel.anuj1997@gmail.com',
  phone: '+91 98765 43210',
  dob: new CalendarDate(1997, 4, 12),
  language: 'en',
  photo: null,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FieldLabel({ text, changed }: { text: ReactNode; changed: boolean }) {
  return (
    <span className={styles.labelRow}>
      {text}
      {changed && (
        <Badge tone="info" variant="soft" size="sm">
          Edited
        </Badge>
      )}
    </span>
  );
}

export default function Screen() {
  const [savedProfile, setSavedProfile] = useState<ProfileValues>(INITIAL_PROFILE);
  const [values, setValues] = useState<ProfileValues>(INITIAL_PROFILE);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const photoChanged = values.photo !== savedProfile.photo;
  const fullNameChanged = values.fullName !== savedProfile.fullName;
  const emailChanged = values.email !== savedProfile.email;
  const phoneChanged = values.phone !== savedProfile.phone;
  const dobChanged = values.dob.compare(savedProfile.dob) !== 0;
  const languageChanged = values.language !== savedProfile.language;

  const changedFields = [
    photoChanged && 'Profile photo',
    fullNameChanged && 'Full name',
    emailChanged && 'Email',
    phoneChanged && 'Phone',
    dobChanged && 'Date of birth',
    languageChanged && 'Preferred language',
  ].filter((field): field is string => Boolean(field));

  const hasChanges = changedFields.length > 0;

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setValues((v) => ({ ...v, photo: url }));
  }

  function handleRemovePhoto() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setValues((v) => ({ ...v, photo: null }));
  }

  function validate(): boolean {
    const nextErrors: typeof errors = {};
    if (!values.fullName.trim()) nextErrors.fullName = 'Enter a full name.';
    if (!EMAIL_PATTERN.test(values.email.trim())) nextErrors.email = 'Enter a valid email address.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSavedProfile(values);
    setIsSaving(false);
    toast({
      title: 'Profile saved',
      description: 'Your changes have been saved.',
      tone: 'success',
    });
  }

  function handleCancel() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setValues(savedProfile);
    setErrors({});
  }

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <CardHeader divider>
          <CardTitle level={1}>Edit profile</CardTitle>
          <CardDescription>Update your personal details and how you'd like to be reached.</CardDescription>
        </CardHeader>

        <CardContent className={styles.content}>
          {hasChanges && (
            <Alert tone="info" live="polite" title="Unsaved changes" className={styles.changesAlert}>
              {changedFields.length} field{changedFields.length > 1 ? 's' : ''} changed since your last save:{' '}
              {changedFields.join(', ')}.
            </Alert>
          )}

          <div className={styles.photoSection}>
            <Avatar name={values.fullName} src={values.photo ?? undefined} size="lg" alt="" />
            <div className={styles.photoDetails}>
              <FieldLabel text="Profile photo" changed={photoChanged} />
              <div className={styles.photoActions}>
                <Button variant="outline" size="sm" onPress={() => fileInputRef.current?.click()}>
                  <IconCamera /> Change photo
                </Button>
                {values.photo && (
                  <Button variant="ghost" tone="danger" size="sm" onPress={handleRemovePhoto}>
                    <IconTrash /> Remove
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className={styles.hiddenInput}
                tabIndex={-1}
              />
            </div>
          </div>

          <div className={styles.fields}>
            <TextField
              label={<FieldLabel text="Full name" changed={fullNameChanged} />}
              value={values.fullName}
              onChange={(value) => setValues((v) => ({ ...v, fullName: value }))}
              isInvalid={!!errors.fullName}
              errorMessage={errors.fullName}
              isRequired
              className={`${styles.field} ${styles.fieldFull}`}
            />

            <TextField
              label={<FieldLabel text="Email" changed={emailChanged} />}
              type="email"
              value={values.email}
              onChange={(value) => setValues((v) => ({ ...v, email: value }))}
              isInvalid={!!errors.email}
              errorMessage={errors.email}
              isRequired
              className={styles.field}
            />

            <TextField
              label={<FieldLabel text="Phone" changed={phoneChanged} />}
              type="tel"
              value={values.phone}
              onChange={(value) => setValues((v) => ({ ...v, phone: value }))}
              className={styles.field}
            />

            <DatePicker
              label={<FieldLabel text="Date of birth" changed={dobChanged} />}
              value={values.dob}
              onChange={(date) => date && setValues((v) => ({ ...v, dob: date }))}
              maxValue={today(getLocalTimeZone())}
              className={styles.field}
            />

            <Select
              label={<FieldLabel text="Preferred language" changed={languageChanged} />}
              selectedKey={values.language}
              onSelectionChange={(key) => setValues((v) => ({ ...v, language: String(key) }))}
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
          <span className={styles.footerStatus}>
            {hasChanges ? `${changedFields.length} unsaved change${changedFields.length > 1 ? 's' : ''}` : 'No changes yet'}
          </span>
          <div className={styles.footerActions}>
            <Button variant="outline" onPress={handleCancel} isDisabled={!hasChanges || isSaving}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleSave} isPending={isSaving} isDisabled={!hasChanges || isSaving}>
              Save changes
            </Button>
          </div>
        </CardFooter>
      </Card>
      <ToastRegion />
    </div>
  );
}
