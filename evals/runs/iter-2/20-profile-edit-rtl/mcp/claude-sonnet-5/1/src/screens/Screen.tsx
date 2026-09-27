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
} from '@strata/react';
import { IconUpload } from '@strata/icons';
import { CalendarDate, getLocalTimeZone, today, type DateValue } from '@internationalized/date';
import { DropZone, FileTrigger, type FileDropItem, type Key } from 'react-aria-components';
import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import styles from './Screen.module.css';

interface Profile {
  photo: string | undefined;
  name: string;
  email: string;
  phone: string;
  dob: CalendarDate;
  language: string;
}

const LANGUAGE_OPTIONS = [
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'Arabic' },
  { id: 'fr', label: 'French' },
  { id: 'es', label: 'Spanish' },
  { id: 'hi', label: 'Hindi' },
];

const INITIAL_PROFILE: Profile = {
  photo: undefined,
  name: 'Amara Whitfield',
  email: 'amara.whitfield@example.com',
  phone: '+1 415 555 0142',
  dob: new CalendarDate(1994, 6, 12),
  language: 'en',
};

const PHOTO_TYPES = ['image/png', 'image/jpeg'];
const PHOTO_MAX = 5 * 1024 * 1024;

function sameDate(a: DateValue, b: DateValue): boolean {
  return a.toString() === b.toString();
}

function FieldLabel({ children, changed }: { children: ReactNode; changed: boolean }) {
  return (
    <span className={styles.labelRow}>
      {children}
      {changed && (
        <Badge tone="info" variant="soft" size="sm">
          Changed
        </Badge>
      )}
    </span>
  );
}

export default function Screen() {
  const uid = useId();
  const createdPhotoUrls = useRef<string[]>([]);

  const [saved, setSaved] = useState<Profile>(INITIAL_PROFILE);
  const [photo, setPhoto] = useState(saved.photo);
  const [name, setName] = useState(saved.name);
  const [email, setEmail] = useState(saved.email);
  const [phone, setPhone] = useState(saved.phone);
  const [dob, setDob] = useState<CalendarDate>(saved.dob);
  const [language, setLanguage] = useState(saved.language);

  const photoChanged = photo !== saved.photo;
  const nameChanged = name !== saved.name;
  const emailChanged = email !== saved.email;
  const phoneChanged = phone !== saved.phone;
  const dobChanged = !sameDate(dob, saved.dob);
  const languageChanged = language !== saved.language;

  const changedCount = [photoChanged, nameChanged, emailChanged, phoneChanged, dobChanged, languageChanged].filter(
    Boolean,
  ).length;
  const hasChanges = changedCount > 0;

  const maxDob = useMemo(() => today(getLocalTimeZone()), []);

  useEffect(() => () => createdPhotoUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const acceptPhoto = (file: File | undefined) => {
    if (!file || !PHOTO_TYPES.includes(file.type) || file.size > PHOTO_MAX) return;
    const url = URL.createObjectURL(file);
    createdPhotoUrls.current.push(url);
    setPhoto(url);
  };

  const handleCancel = () => {
    setPhoto(saved.photo);
    setName(saved.name);
    setEmail(saved.email);
    setPhone(saved.phone);
    setDob(saved.dob);
    setLanguage(saved.language);
  };

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaved({ photo, name, email, phone, dob, language });
    toast({ title: 'Profile saved', tone: 'success' });
  };

  const summary = hasChanges
    ? `${changedCount} ${changedCount === 1 ? 'field has' : 'fields have'} changed since your last save.`
    : 'No changes since your last save.';

  return (
    <div className={styles.root}>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Edit profile</h1>
          <p className={styles.description}>Update your personal details. Changes are highlighted until you save.</p>
        </div>

        <Card>
          <form onSubmit={handleSave} aria-labelledby={`${uid}-title`} className={styles.form}>
            <CardHeader>
              <CardTitle id={`${uid}-title`}>Personal details</CardTitle>
              <CardDescription>{summary}</CardDescription>
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
                <Avatar name={name} src={photo} tint="auto" size="lg" className={styles.photo} />
                <div className={styles.photoText}>
                  <p className={styles.rowLabel} id={`${uid}-photo`}>
                    <FieldLabel changed={photoChanged}>Profile photo</FieldLabel>
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
                  label={<FieldLabel changed={nameChanged}>Full name</FieldLabel>}
                  value={name}
                  onChange={setName}
                  autoComplete="name"
                  name="name"
                  isRequired
                />
                <TextField
                  label={<FieldLabel changed={emailChanged}>Email</FieldLabel>}
                  value={email}
                  onChange={setEmail}
                  type="email"
                  autoComplete="email"
                  name="email"
                  isRequired
                  className={styles.ltrValue}
                />
                <TextField
                  label={<FieldLabel changed={phoneChanged}>Phone</FieldLabel>}
                  value={phone}
                  onChange={setPhone}
                  type="tel"
                  autoComplete="tel"
                  name="phone"
                  className={styles.ltrValue}
                />
                <DatePicker
                  label={<FieldLabel changed={dobChanged}>Date of birth</FieldLabel>}
                  value={dob}
                  onChange={(value) => value && setDob(value as CalendarDate)}
                  maxValue={maxDob}
                  name="dob"
                />
                <Select
                  label={<FieldLabel changed={languageChanged}>Preferred language</FieldLabel>}
                  selectedKey={language}
                  onSelectionChange={(key: Key | null) => key && setLanguage(String(key))}
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

            <CardFooter divider className={styles.footerEnd}>
              <Button type="button" variant="ghost" onPress={handleCancel} isDisabled={!hasChanges}>
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
