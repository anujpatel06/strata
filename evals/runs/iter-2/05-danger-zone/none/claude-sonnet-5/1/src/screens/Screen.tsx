import { useState, type FormEvent } from 'react';
import {
  Alert,
  AlertDialog,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DialogTrigger,
  Switch,
  TextField,
} from '@strata/react';
import { IconMail, IconPhone, IconTrash, IconUser } from '@strata/icons';
import styles from './Screen.module.css';

interface ProfileDetails {
  name: string;
  email: string;
  phone: string;
}

interface NotificationPrefs {
  productUpdates: boolean;
  securityAlerts: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
}

// Mock data — stands in for the signed-in account until there's a backend.
const initialProfile: ProfileDetails = {
  name: 'Anuj Patel',
  email: 'patel.anuj1997@gmail.com',
  phone: '+91 98765 43210',
};

const initialPreferences: NotificationPrefs = {
  productUpdates: true,
  securityAlerts: true,
  weeklyDigest: false,
  marketingEmails: false,
};

const NOTIFICATION_OPTIONS: {
  key: keyof NotificationPrefs;
  label: string;
  description: string;
}[] = [
  {
    key: 'productUpdates',
    label: 'Product updates',
    description: 'New features and improvements we ship.',
  },
  {
    key: 'securityAlerts',
    label: 'Security alerts',
    description: 'Sign-ins and changes to your account.',
  },
  {
    key: 'weeklyDigest',
    label: 'Weekly digest',
    description: 'A weekly summary of your activity, sent Mondays.',
  },
  {
    key: 'marketingEmails',
    label: 'Marketing emails',
    description: 'Offers, tips and things we think you’ll like.',
  },
];

export default function Screen() {
  const [profile, setProfile] = useState(initialProfile);
  const [savedProfile, setSavedProfile] = useState(initialProfile);
  const [showSaved, setShowSaved] = useState(false);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [isClosed, setIsClosed] = useState(false);

  const isProfileDirty =
    profile.name !== savedProfile.name ||
    profile.email !== savedProfile.email ||
    profile.phone !== savedProfile.phone;

  function updateProfileField(field: keyof ProfileDetails, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setShowSaved(false);
  }

  function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavedProfile(profile);
    setShowSaved(true);
  }

  function togglePreference(key: keyof NotificationPrefs, value: boolean) {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }

  if (isClosed) {
    return (
      <div className={styles.page}>
        <Card className={styles.section}>
          <CardHeader>
            <CardTitle level={1}>Account closed</CardTitle>
            <CardDescription>
              Your account has been permanently closed. You&rsquo;ve been signed out of all devices.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Account settings</h1>
        <p className={styles.pageSubtitle}>Manage your profile, notifications and account access.</p>
      </header>

      <Card className={styles.section}>
        <CardHeader divider>
          <CardTitle level={2}>Profile details</CardTitle>
          <CardDescription>Your name, email and phone number.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSaveProfile}>
          <CardContent className={styles.fieldStack}>
            {showSaved && !isProfileDirty && (
              <Alert tone="success" title="Profile updated" live="polite" className={styles.savedAlert}>
                Your changes have been saved.
              </Alert>
            )}
            <TextField
              label="Full name"
              value={profile.name}
              onChange={(value) => updateProfileField('name', value)}
              prefix={<IconUser aria-hidden />}
              isRequired
            />
            <TextField
              label="Email address"
              type="email"
              value={profile.email}
              onChange={(value) => updateProfileField('email', value)}
              prefix={<IconMail aria-hidden />}
              isRequired
            />
            <TextField
              label="Phone number"
              type="tel"
              value={profile.phone}
              onChange={(value) => updateProfileField('phone', value)}
              prefix={<IconPhone aria-hidden />}
            />
          </CardContent>
          <CardFooter divider className={styles.footerActions}>
            <Button type="submit" variant="primary" isDisabled={!isProfileDirty}>
              Save changes
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className={styles.section}>
        <CardHeader divider>
          <CardTitle level={2}>Notification preferences</CardTitle>
          <CardDescription>Choose what you want to hear from us. Changes apply immediately.</CardDescription>
        </CardHeader>
        <CardContent className={styles.prefList}>
          {NOTIFICATION_OPTIONS.map((option) => (
            <div className={styles.prefRow} key={option.key}>
              <div className={styles.prefText}>
                <span className={styles.prefLabel}>{option.label}</span>
                <span className={styles.prefDescription}>{option.description}</span>
              </div>
              <Switch
                aria-label={option.label}
                isSelected={preferences[option.key]}
                onChange={(value) => togglePreference(option.key, value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card variant="outline" className={`${styles.section} ${styles.dangerSection}`}>
        <CardHeader divider>
          <CardTitle level={2}>Close account</CardTitle>
          <CardDescription>Permanently close your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className={styles.dangerText}>
            Closing your account removes your access right away and can&rsquo;t be reversed.
          </p>
        </CardContent>
        <CardFooter divider>
          <DialogTrigger>
            <Button variant="outline" tone="danger">
              <IconTrash aria-hidden />
              Close account
            </Button>
            <AlertDialog
              title="Close your account?"
              actionLabel="Close account"
              cancelLabel="Keep account"
              tone="danger"
              onAction={() => setIsClosed(true)}
            >
              You&rsquo;ll permanently lose your profile details (name, email and phone),
              <br />
              your notification preferences, and access to any active subscriptions.
              <br />
              <strong>This can&rsquo;t be undone.</strong>
            </AlertDialog>
          </DialogTrigger>
        </CardFooter>
      </Card>
    </div>
  );
}
