import { useId, type FormEvent } from 'react';
import {
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
  ToastRegion,
  toast,
} from '@syntara/react';
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

const profile: Profile = {
  name: 'Anuj Patel',
  email: 'patel.anuj1997@gmail.com',
  phone: '+91 98765 43210',
};

const notificationPreferences: NotificationPreference[] = [
  {
    id: 'product-updates',
    label: 'Product updates',
    description: 'New features and improvements.',
    on: true,
  },
  {
    id: 'security-alerts',
    label: 'Security alerts',
    description: 'Sign-ins from a new device or location.',
    on: true,
  },
  {
    id: 'billing-notices',
    label: 'Billing notices',
    description: 'Receipts and upcoming payment reminders.',
    on: false,
  },
  {
    id: 'newsletter',
    label: 'Newsletter',
    description: 'Occasional tips and product news.',
    on: false,
  },
];

const lossItems = [
  'Your profile, preferences and account history',
  'Access to any teams or workspaces you belong to',
  'All files and data stored in your account',
];

export default function Screen() {
  const profileHeadingId = useId();
  const notificationsHeadingId = useId();
  const dangerHeadingId = useId();

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast({ title: 'Profile details saved', tone: 'success' });
  };

  const handleNotificationsSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast({ title: 'Notification preferences saved', tone: 'success' });
  };

  const handleCloseAccount = () => {
    toast({ title: 'Account closed', tone: 'neutral' });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Account settings</h1>
        <p className={styles.description}>Manage your profile, notifications and account.</p>
      </header>

      <section aria-labelledby={profileHeadingId} className={styles.section}>
        <Card>
          <form onSubmit={handleProfileSubmit}>
            <CardHeader>
              <CardTitle id={profileHeadingId} level={2}>
                Profile details
              </CardTitle>
              <CardDescription>Your name and how we can reach you.</CardDescription>
            </CardHeader>
            <CardContent className={styles.fieldGrid}>
              <TextField label="Name" name="name" autoComplete="name" defaultValue={profile.name} isRequired />
              <TextField
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={profile.email}
                isRequired
              />
              <TextField label="Phone" name="phone" type="tel" autoComplete="tel" defaultValue={profile.phone} />
            </CardContent>
            <CardFooter divider className={styles.footerEnd}>
              <Button type="submit">Save profile</Button>
            </CardFooter>
          </form>
        </Card>
      </section>

      <section aria-labelledby={notificationsHeadingId} className={styles.section}>
        <Card>
          <form onSubmit={handleNotificationsSubmit}>
            <CardHeader>
              <CardTitle id={notificationsHeadingId} level={2}>
                Notification preferences
              </CardTitle>
              <CardDescription>Choose which notifications you want to receive.</CardDescription>
            </CardHeader>
            <CardContent className={styles.switchGrid}>
              {notificationPreferences.map((item) => (
                <Switch key={item.id} name={item.id} defaultSelected={item.on} description={item.description}>
                  {item.label}
                </Switch>
              ))}
            </CardContent>
            <CardFooter divider className={styles.footerEnd}>
              <Button type="submit">Save preferences</Button>
            </CardFooter>
          </form>
        </Card>
      </section>

      <section aria-labelledby={dangerHeadingId} className={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle id={dangerHeadingId} level={2}>
              Close account
            </CardTitle>
            <CardDescription>Permanently close your account. This can&rsquo;t be undone.</CardDescription>
          </CardHeader>
          <CardFooter divider className={styles.footerEnd}>
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
                <p className={styles.dialogIntro}>This can&rsquo;t be undone. You will lose:</p>
                <ul className={styles.lossList}>
                  {lossItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </AlertDialog>
            </DialogTrigger>
          </CardFooter>
        </Card>
      </section>

      <ToastRegion />
    </div>
  );
}
