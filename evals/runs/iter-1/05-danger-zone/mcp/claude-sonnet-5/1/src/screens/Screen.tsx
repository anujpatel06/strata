import { useId, useState, type FormEvent, type ReactNode } from 'react';
import {
  AlertDialog,
  Button,
  Card,
  CardContent,
  CardFooter,
  DialogTrigger,
  EmptyState,
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

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  defaultOn: boolean;
}

const initialProfile: Profile = {
  name: 'Jordan Lee',
  email: 'jordan.lee@example.com',
  phone: '+1 415 555 0148',
};

const notificationSettings: NotificationSetting[] = [
  {
    id: 'account-activity',
    label: 'Account activity',
    description: 'Sign-ins, password changes and other security events.',
    defaultOn: true,
  },
  {
    id: 'product-updates',
    label: 'Product updates',
    description: 'New features and changes to the app.',
    defaultOn: true,
  },
  {
    id: 'weekly-summary',
    label: 'Weekly summary',
    description: 'A recap of your activity every Monday.',
    defaultOn: false,
  },
  {
    id: 'tips-and-offers',
    label: 'Tips and offers',
    description: 'Suggestions and the occasional promotion.',
    defaultOn: false,
  },
];

const lostOnClosure = [
  'Your profile and saved preferences',
  'Your message and activity history',
  'Any active subscriptions or plans',
  'Access from every signed-in device',
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
      <div className={styles.sectionAside}>
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
  const [closed, setClosed] = useState(false);

  const saveProfile = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({ title: 'Profile updated', tone: 'success' });
  };

  if (closed) {
    return (
      <div className={styles.root}>
        <EmptyState
          level={1}
          title="Your account is closing"
          description="We're deleting your data now. You've been signed out of every device."
        />
        <ToastRegion />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Account settings</h1>
        <p className={styles.description}>Manage your profile, notifications and account.</p>
      </div>

      <Section title="Profile details" description="Your name, email and phone number." headingId={`${uid}-profile`}>
        <Card>
          <form onSubmit={saveProfile} aria-labelledby={`${uid}-profile`} className={styles.form}>
            <CardContent className={styles.stack}>
              <TextField
                label="Name"
                autoComplete="name"
                name="name"
                value={profile.name}
                onChange={(name) => setProfile((p) => ({ ...p, name }))}
              />
              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                name="email"
                value={profile.email}
                onChange={(email) => setProfile((p) => ({ ...p, email }))}
                className={styles.ltrValue}
              />
              <TextField
                label="Phone"
                type="tel"
                autoComplete="tel"
                name="phone"
                value={profile.phone}
                onChange={(phone) => setProfile((p) => ({ ...p, phone }))}
                className={styles.ltrValue}
              />
            </CardContent>
            <CardFooter divider className={styles.footerEnd}>
              <Button type="submit">Save changes</Button>
            </CardFooter>
          </form>
        </Card>
      </Section>

      <Section
        title="Notification preferences"
        description="Choose what you hear from us. Changes apply immediately."
        headingId={`${uid}-notifications`}
      >
        <Card>
          <CardContent className={styles.switches}>
            {notificationSettings.map((item) => (
              <Switch
                key={item.id}
                name={item.id}
                defaultSelected={item.defaultOn}
                description={item.description}
                className={styles.switch}
                onChange={(on) =>
                  toast({ title: `${item.label} ${on ? 'turned on' : 'turned off'}`, tone: 'neutral' })
                }
              >
                {item.label}
              </Switch>
            ))}
          </CardContent>
        </Card>
      </Section>

      <Section title="Close account" headingId={`${uid}-danger`}>
        <Card>
          <CardContent className={styles.row}>
            <p className={styles.rowDescription}>Permanently close your account. This can&rsquo;t be undone.</p>
            <DialogTrigger>
              <Button variant="outline" tone="danger">
                Close account
              </Button>
              <AlertDialog
                tone="danger"
                title="Close your account?"
                actionLabel="Close account"
                cancelLabel="Keep account"
                onAction={() => setClosed(true)}
              >
                <p className={styles.dialogIntro}>This can&rsquo;t be undone. You&rsquo;ll lose:</p>
                <ul className={styles.dialogList}>
                  {lostOnClosure.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </AlertDialog>
            </DialogTrigger>
          </CardContent>
        </Card>
      </Section>

      <ToastRegion />
    </div>
  );
}
