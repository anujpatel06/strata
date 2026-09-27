import { useMemo, useState } from 'react';
import {
  AlertDialog,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
  DialogTrigger,
  EmptyState,
  IconTile,
  Switch,
  TextField,
  toast,
  ToastRegion,
} from '@strata/react';
import { IconBell, IconCircleCheck, IconMail, IconPhone, IconTrash, IconUser } from '@strata/icons';
import styles from './Screen.module.css';

interface Profile {
  name: string;
  email: string;
  phone: string;
}

interface NotificationPreference {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

const initialProfile: Profile = {
  name: 'Anuj Patel',
  email: 'patel.anuj1997@gmail.com',
  phone: '+1 (415) 555-0182',
};

const initialPreferences: NotificationPreference[] = [
  {
    id: 'product-updates',
    title: 'Product updates',
    description: 'New features, improvements and changes to things you use.',
    enabled: true,
  },
  {
    id: 'security-alerts',
    title: 'Security alerts',
    description: 'Sign-ins from new devices and other account security notices.',
    enabled: true,
  },
  {
    id: 'weekly-digest',
    title: 'Weekly digest',
    description: 'A weekly summary of activity across your account.',
    enabled: false,
  },
  {
    id: 'marketing',
    title: 'Marketing & offers',
    description: 'Product news, tips and the occasional promotion.',
    enabled: false,
  },
];

export default function Screen() {
  const [savedProfile, setSavedProfile] = useState(initialProfile);
  const [profile, setProfile] = useState(initialProfile);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [isClosed, setIsClosed] = useState(false);

  const isProfileDirty = useMemo(
    () =>
      profile.name !== savedProfile.name ||
      profile.email !== savedProfile.email ||
      profile.phone !== savedProfile.phone,
    [profile, savedProfile],
  );

  function updateProfileField(field: keyof Profile, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  function handleSaveProfile() {
    setSavedProfile(profile);
    toast({ title: 'Profile updated', tone: 'success' });
  }

  function togglePreference(id: string) {
    setPreferences((prev) =>
      prev.map((preference) =>
        preference.id === id ? { ...preference, enabled: !preference.enabled } : preference,
      ),
    );
  }

  function handleCloseAccount() {
    setIsClosed(true);
  }

  if (isClosed) {
    return (
      <div className={styles.page}>
        <EmptyState
          icon={<IconCircleCheck aria-hidden />}
          title="Your account has been closed"
          description="Your profile, notification preferences and account history have been permanently deleted."
        />
        <ToastRegion />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Account settings</h1>
        <p className={styles.subheading}>Manage your profile, notifications and account access.</p>
      </header>

      <Card>
        <CardHeader divider>
          <div className={styles.headerRow}>
            <IconTile tint="none" size="sm">
              <IconUser aria-hidden />
            </IconTile>
            <div>
              <CardTitle level={2}>Profile details</CardTitle>
              <CardDescription>How we identify you and get in touch.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={styles.fieldGrid}>
            <TextField
              label="Full name"
              value={profile.name}
              onChange={(value) => updateProfileField('name', value)}
            />
            <TextField
              label="Email address"
              type="email"
              value={profile.email}
              onChange={(value) => updateProfileField('email', value)}
              prefix={<IconMail aria-hidden />}
            />
            <TextField
              label="Phone number"
              type="tel"
              value={profile.phone}
              onChange={(value) => updateProfileField('phone', value)}
              prefix={<IconPhone aria-hidden />}
            />
          </div>
        </CardContent>
        <CardFooter divider className={styles.footerActions}>
          <Button
            variant="primary"
            isDisabled={!isProfileDirty}
            onPress={handleSaveProfile}
          >
            Save changes
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader divider>
          <div className={styles.headerRow}>
            <IconTile tint="none" size="sm">
              <IconBell aria-hidden />
            </IconTile>
            <div>
              <CardTitle level={2}>Notification preferences</CardTitle>
              <CardDescription>Choose what you want to hear from us.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className={styles.preferenceList}>
            {preferences.map((preference) => (
              <li key={preference.id} className={styles.preferenceRow}>
                <Switch
                  isSelected={preference.enabled}
                  onChange={() => togglePreference(preference.id)}
                  description={preference.description}
                >
                  {preference.title}
                </Switch>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className={styles.dangerCard}>
        <CardHeader divider>
          <div className={styles.headerRow}>
            <IconTile tint="danger" size="sm">
              <IconTrash aria-hidden />
            </IconTile>
            <div>
              <CardTitle level={2}>Close account</CardTitle>
              <CardDescription>Permanently delete your account and everything in it.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardFooter className={styles.footerActions}>
          <DialogTrigger>
            <Button variant="outline" tone="danger">
              Close my account
            </Button>
            <AlertDialog
              title="Close your account?"
              tone="danger"
              actionLabel="Close my account"
              cancelLabel="Keep my account"
              onAction={handleCloseAccount}
            >
              <p>This will permanently delete:</p>
              <ul className={styles.lossList}>
                <li>Your profile details and login access</li>
                <li>Your saved notification preferences</li>
                <li>Your account history and activity</li>
              </ul>
              <p className={styles.lossWarning}>This can&apos;t be undone.</p>
            </AlertDialog>
          </DialogTrigger>
        </CardFooter>
      </Card>

      <ToastRegion />
    </div>
  );
}
