import { useId, useState, type FormEvent, type ReactNode } from 'react';
import {
  AlertDialog,
  Button,
  Card,
  CardContent,
  CardFooter,
  DialogTrigger,
  Switch,
  TextField,
  toast,
  ToastRegion,
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

const initialProfile: Profile = {
  name: 'Anuj Patel',
  email: 'anuj.patel@example.com',
  phone: '+91 98765 43210',
};

const initialNotifications: NotificationPreference[] = [
  {
    id: 'product-updates',
    label: 'Product updates',
    description: 'New features and improvements to the app.',
    on: true,
  },
  {
    id: 'billing-alerts',
    label: 'Billing alerts',
    description: 'Receipts, renewals and failed payments.',
    on: true,
  },
  {
    id: 'security-alerts',
    label: 'Security alerts',
    description: 'Sign-ins from a new device or location.',
    on: true,
  },
  {
    id: 'marketing',
    label: 'Marketing emails',
    description: 'Offers, surveys and other occasional news.',
    on: false,
  },
];

const accountLossItems = [
  'Your profile, name and contact details',
  'Notification preferences and saved settings',
  'Your order and activity history',
  'Any active subscriptions, which will stop renewing',
];

function Section({
  title,
  description,
  headingId,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  headingId: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <div className={styles.sectionIntro}>
        <h2 id={headingId} className={styles.sectionTitle}>
          {title}
        </h2>
        {description && <p className={styles.sectionDescription}>{description}</p>}
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

export default function Screen() {
  const uid = useId();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [notifications, setNotifications] = useState<NotificationPreference[]>(initialNotifications);

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setProfile({
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      phone: String(data.get('phone') ?? ''),
    });
    toast({ title: 'Profile updated', tone: 'success' });
  };

  const toggleNotification = (id: string, isOn: boolean) => {
    setNotifications((all) => all.map((item) => (item.id === id ? { ...item, on: isOn } : item)));
  };

  const closeAccount = () => {
    toast({ title: 'Account closed', tone: 'neutral' });
  };

  return (
    <div className={styles.root}>
      <main className={styles.page} aria-labelledby={`${uid}-title`}>
        <div className={styles.header}>
          <h1 id={`${uid}-title`} className={styles.title}>
            Account settings
          </h1>
          <p className={styles.description}>Manage your profile, notifications and account.</p>
        </div>

        <Section
          title="Profile details"
          description="Your name and how we can reach you."
          headingId={`${uid}-profile-title`}
        >
          <Card>
            <form onSubmit={handleProfileSubmit} aria-labelledby={`${uid}-profile-title`} className={styles.form}>
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
                <Button type="submit">Save changes</Button>
              </CardFooter>
            </form>
          </Card>
        </Section>

        <Section
          title="Notification preferences"
          description="Choose what you hear from us."
          headingId={`${uid}-notifications-title`}
        >
          <Card>
            <CardContent className={styles.switches}>
              {notifications.map((item) => (
                <Switch
                  key={item.id}
                  isSelected={item.on}
                  onChange={(isOn) => toggleNotification(item.id, isOn)}
                  description={item.description}
                  className={styles.switch}
                >
                  {item.label}
                </Switch>
              ))}
            </CardContent>
          </Card>
        </Section>

        <Section title="Close account" headingId={`${uid}-danger-title`}>
          <Card>
            <CardContent className={styles.row}>
              <p className={styles.rowDescription}>
                Closing your account permanently removes your data. This can't be undone.
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
                  <span className={styles.dialogBody}>
                    <span>This can't be undone. You will lose:</span>
                    <ul className={styles.dialogList}>
                      {accountLossItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </span>
                </AlertDialog>
              </DialogTrigger>
            </CardContent>
          </Card>
        </Section>
      </main>
      <ToastRegion />
    </div>
  );
}
