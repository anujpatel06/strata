import { useId } from 'react';
import type { FormEvent } from 'react';
import {
  AlertDialog,
  Button,
  Card,
  CardContent,
  CardFooter,
  DialogTrigger,
  Switch,
  TextField,
  ToastRegion,
  toast,
} from '@strata/react';
import styles from './Screen.module.css';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
}

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  on: boolean;
}

const profile: ProfileData = {
  name: 'Anuj Patel',
  email: 'anuj.patel@example.com',
  phone: '+1 (555) 010-2938',
};

const notificationPreferences: NotificationPreference[] = [
  {
    id: 'account-activity',
    label: 'Account activity',
    description: 'Sign-ins, password changes and other security alerts.',
    on: true,
  },
  {
    id: 'product-updates',
    label: 'Product updates',
    description: 'New features and improvements as they ship.',
    on: true,
  },
  {
    id: 'billing-notices',
    label: 'Billing notices',
    description: 'Invoices, receipts and payment failures.',
    on: true,
  },
  {
    id: 'marketing-emails',
    label: 'Marketing emails',
    description: 'Tips, offers and the occasional survey.',
    on: false,
  },
];

const whatWillBeLost = [
  'Your profile details and sign-in credentials',
  'Your saved notification preferences',
  'Your billing history and invoices',
  'Access to anything shared with you in this account',
];

export default function Screen() {
  const uid = useId();

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast({ title: 'Profile updated', tone: 'success' });
  };

  const handleNotificationsSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast({ title: 'Notification preferences saved', tone: 'success' });
  };

  const handleCloseAccount = () => {
    toast({ title: 'Account closed', tone: 'neutral' });
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Account settings</h1>
        <p className={styles.description}>Manage your profile, notification preferences and account.</p>
      </div>

      <section className={styles.section} aria-labelledby={`${uid}-profile-title`}>
        <div className={styles.aside}>
          <h2 id={`${uid}-profile-title`} className={styles.sectionTitle}>
            Profile details
          </h2>
          <p className={styles.sectionDescription}>Your name and how we can reach you.</p>
        </div>
        <Card className={styles.sectionBody}>
          <form onSubmit={handleProfileSubmit} aria-labelledby={`${uid}-profile-title`} className={styles.form}>
            <CardContent className={styles.fieldGrid}>
              <TextField label="Name" defaultValue={profile.name} autoComplete="name" name="name" />
              <TextField
                label="Email"
                defaultValue={profile.email}
                type="email"
                autoComplete="email"
                name="email"
              />
              <TextField label="Phone" defaultValue={profile.phone} type="tel" autoComplete="tel" name="phone" />
            </CardContent>
            <CardFooter divider className={styles.footerEnd}>
              <Button type="submit">Save changes</Button>
            </CardFooter>
          </form>
        </Card>
      </section>

      <section className={styles.section} aria-labelledby={`${uid}-notifications-title`}>
        <div className={styles.aside}>
          <h2 id={`${uid}-notifications-title`} className={styles.sectionTitle}>
            Notification preferences
          </h2>
          <p className={styles.sectionDescription}>Choose what you want to hear from us.</p>
        </div>
        <Card className={styles.sectionBody}>
          <form
            onSubmit={handleNotificationsSubmit}
            aria-labelledby={`${uid}-notifications-title`}
            className={styles.form}
          >
            <CardContent className={styles.switches}>
              {notificationPreferences.map((preference) => (
                <Switch
                  key={preference.id}
                  name={preference.id}
                  defaultSelected={preference.on}
                  description={preference.description}
                  className={styles.switch}
                >
                  {preference.label}
                </Switch>
              ))}
            </CardContent>
            <CardFooter divider className={styles.footerEnd}>
              <Button type="submit">Save preferences</Button>
            </CardFooter>
          </form>
        </Card>
      </section>

      <section className={styles.section} aria-labelledby={`${uid}-danger-title`}>
        <div className={styles.aside}>
          <h2 id={`${uid}-danger-title`} className={styles.sectionTitle}>
            Close account
          </h2>
          <p className={styles.sectionDescription}>Permanently close your account.</p>
        </div>
        <Card className={styles.sectionBody}>
          <CardContent>
            <div className={styles.row}>
              <p className={styles.rowDescription}>
                Closing your account can&rsquo;t be undone. You&rsquo;ll lose access to everything in it.
              </p>
              <DialogTrigger>
                <Button variant="outline" tone="danger">
                  Close account
                </Button>
                <AlertDialog
                  tone="danger"
                  title="Close your account?"
                  actionLabel="Close account"
                  cancelLabel="Keep account"
                  onAction={handleCloseAccount}
                >
                  <p className={styles.dialogIntro}>This can&rsquo;t be undone. You&rsquo;ll lose:</p>
                  <ul className={styles.dialogList}>
                    {whatWillBeLost.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </AlertDialog>
              </DialogTrigger>
            </div>
          </CardContent>
        </Card>
      </section>

      <ToastRegion />
    </div>
  );
}
