import { useId, useState, type FormEvent, type JSX, type ReactNode } from 'react';
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

const initialNotifications: NotificationPreference[] = [
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
    id: 'billing-emails',
    label: 'Billing emails',
    description: 'Receipts and payment reminders.',
    on: true,
  },
  {
    id: 'marketing-tips',
    label: 'Tips and offers',
    description: 'Occasional suggestions on getting more from your account.',
    on: false,
  },
];

const whatWillBeLost = [
  'Your profile, including your name, email and phone number',
  'Your notification preferences',
  'Your billing history and saved payment methods',
  'Access to any shared workspaces',
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
}): JSX.Element {
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <div className={styles.aside}>
        <h2 id={headingId} className={styles.sectionTitle}>
          {title}
        </h2>
        {description && <p className={styles.sectionDescription}>{description}</p>}
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function ProfileSection(): JSX.Element {
  const uid = useId();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({ title: 'Profile updated', tone: 'success' });
  };

  return (
    <Section
      title="Profile details"
      description="Your name and contact information."
      headingId={`${uid}-title`}
    >
      <Card>
        <form onSubmit={handleSubmit} aria-labelledby={`${uid}-title`} className={styles.form}>
          <CardContent className={styles.fieldGrid}>
            <TextField label="Name" defaultValue={initialProfile.name} autoComplete="name" name="name" />
            <TextField
              label="Email"
              defaultValue={initialProfile.email}
              type="email"
              autoComplete="email"
              name="email"
            />
            <TextField label="Phone" defaultValue={initialProfile.phone} type="tel" autoComplete="tel" name="phone" />
          </CardContent>
          <CardFooter divider className={styles.footerEnd}>
            <Button type="submit">Save changes</Button>
          </CardFooter>
        </form>
      </Card>
    </Section>
  );
}

function NotificationsSection(): JSX.Element {
  const uid = useId();
  const [prefs, setPrefs] = useState(initialNotifications);

  const toggle = (id: string, on: boolean) => {
    setPrefs((all) => all.map((p) => (p.id === id ? { ...p, on } : p)));
  };

  return (
    <Section
      title="Notification preferences"
      description="Choose what you hear from us."
      headingId={`${uid}-title`}
    >
      <Card>
        <CardContent className={styles.switches}>
          {prefs.map((pref) => (
            <Switch
              key={pref.id}
              isSelected={pref.on}
              onChange={(on) => toggle(pref.id, on)}
              description={pref.description}
              className={styles.switch}
            >
              {pref.label}
            </Switch>
          ))}
        </CardContent>
      </Card>
    </Section>
  );
}

function CloseAccountSection(): JSX.Element {
  const uid = useId();
  const [closed, setClosed] = useState(false);

  return (
    <Section title="Close account" headingId={`${uid}-title`}>
      <Card>
        <CardContent>
          <div className={styles.row}>
            <p className={styles.dangerText}>
              {closed
                ? 'Your account has been closed.'
                : "Permanently close your account. This can't be undone."}
            </p>
            <DialogTrigger>
              <Button variant="outline" tone="danger" isDisabled={closed}>
                Close account
              </Button>
              <AlertDialog
                tone="danger"
                title="Close your account?"
                actionLabel="Close account"
                cancelLabel="Cancel"
                onAction={() => {
                  setClosed(true);
                  toast({ title: 'Account closed', tone: 'neutral' });
                }}
              >
                <p className={styles.dialogIntro}>This can't be undone. You will lose:</p>
                <ul className={styles.lossList}>
                  {whatWillBeLost.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </AlertDialog>
            </DialogTrigger>
          </div>
        </CardContent>
      </Card>
    </Section>
  );
}

export default function Screen(): JSX.Element {
  const uid = useId();

  return (
    <div className={styles.page} aria-labelledby={`${uid}-title`}>
      <div className={styles.header}>
        <h1 id={`${uid}-title`} className={styles.title}>
          Account settings
        </h1>
        <p className={styles.description}>Manage your profile, notifications and account.</p>
      </div>
      <ProfileSection />
      <NotificationsSection />
      <CloseAccountSection />
      <ToastRegion />
    </div>
  );
}
