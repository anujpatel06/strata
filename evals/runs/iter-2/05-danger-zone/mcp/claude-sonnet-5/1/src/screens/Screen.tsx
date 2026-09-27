import { useId, useState, type FormEvent } from 'react';
import { AlertDialog, Button, Card, CardContent, CardFooter, DialogTrigger, Switch, TextField, ToastRegion, toast } from '@strata/react';
import styles from './Screen.module.css';

interface Profile {
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

const initialProfile: Profile = {
  name: 'Anuj Patel',
  email: 'patel.anuj1997@gmail.com',
  phone: '+91 98765 43210',
};

const initialPreferences: NotificationPreference[] = [
  { id: 'product-updates', label: 'Product updates', description: 'News about features and improvements.', on: true },
  { id: 'security-alerts', label: 'Security alerts', description: 'Sign-ins from a new device or location.', on: true },
  { id: 'billing-notices', label: 'Billing notices', description: 'Receipts and payment reminders.', on: true },
  { id: 'marketing-offers', label: 'Marketing offers', description: 'Occasional promotions and discounts.', on: false },
];

const lostOnClose = [
  'Your profile, saved preferences and account history',
  'Access to any active subscriptions, which will be cancelled immediately',
  'Files and data you have stored, which cannot be recovered afterwards',
];

export default function Screen() {
  const titleId = useId();
  const [profile, setProfile] = useState(initialProfile);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [closed, setClosed] = useState(false);

  const saveProfile = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({ title: 'Profile details saved', tone: 'success' });
  };

  const saveNotifications = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({ title: 'Notification preferences saved', tone: 'success' });
  };

  const togglePreference = (id: string, on: boolean) => {
    setPreferences((all) => all.map((p) => (p.id === id ? { ...p, on } : p)));
  };

  const closeAccount = () => {
    setClosed(true);
    toast({ title: 'Account closed', tone: 'neutral' });
  };

  if (closed) {
    return (
      <main className={styles.page} aria-labelledby={titleId}>
        <h1 id={titleId} className={styles.title}>
          Account settings
        </h1>
        <p className={styles.closedMessage}>Your account has been closed. You have been signed out.</p>
        <ToastRegion />
      </main>
    );
  }

  return (
    <main className={styles.page} aria-labelledby={titleId}>
      <h1 id={titleId} className={styles.title}>
        Account settings
      </h1>

      <section className={styles.section} aria-labelledby={`${titleId}-profile`}>
        <h2 id={`${titleId}-profile`} className={styles.sectionTitle}>
          Profile details
        </h2>
        <Card>
          <form onSubmit={saveProfile} aria-labelledby={`${titleId}-profile`} className={styles.form}>
            <CardContent className={styles.fields}>
              <TextField
                label="Name"
                autoComplete="name"
                value={profile.name}
                onChange={(name) => setProfile((p) => ({ ...p, name }))}
              />
              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                value={profile.email}
                onChange={(email) => setProfile((p) => ({ ...p, email }))}
              />
              <TextField
                label="Phone"
                type="tel"
                autoComplete="tel"
                value={profile.phone}
                onChange={(phone) => setProfile((p) => ({ ...p, phone }))}
              />
            </CardContent>
            <CardFooter divider className={styles.footerEnd}>
              <Button type="submit">Save changes</Button>
            </CardFooter>
          </form>
        </Card>
      </section>

      <section className={styles.section} aria-labelledby={`${titleId}-notifications`}>
        <h2 id={`${titleId}-notifications`} className={styles.sectionTitle}>
          Notification preferences
        </h2>
        <Card>
          <form onSubmit={saveNotifications} aria-labelledby={`${titleId}-notifications`} className={styles.form}>
            <CardContent className={styles.switches}>
              {preferences.map((pref) => (
                <Switch
                  key={pref.id}
                  isSelected={pref.on}
                  onChange={(on) => togglePreference(pref.id, on)}
                  description={pref.description}
                  className={styles.switch}
                >
                  {pref.label}
                </Switch>
              ))}
            </CardContent>
            <CardFooter divider className={styles.footerEnd}>
              <Button type="submit">Save changes</Button>
            </CardFooter>
          </form>
        </Card>
      </section>

      <section className={styles.section} aria-labelledby={`${titleId}-danger`}>
        <h2 id={`${titleId}-danger`} className={styles.sectionTitle}>
          Close account
        </h2>
        <Card>
          <CardContent className={styles.row}>
            <p className={styles.rowDescription}>
              Closing your account is permanent. You will lose access immediately and this cannot be undone.
            </p>
            <DialogTrigger>
              <Button variant="outline" tone="danger">
                Close account
              </Button>
              <AlertDialog
                tone="danger"
                title="Close your account?"
                actionLabel="Close account"
                cancelLabel="Cancel"
                onAction={closeAccount}
              >
                <p className={styles.dialogIntro}>This can&rsquo;t be undone. You will lose:</p>
                <ul className={styles.dialogList}>
                  {lostOnClose.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </AlertDialog>
            </DialogTrigger>
          </CardContent>
        </Card>
      </section>

      <ToastRegion />
    </main>
  );
}
