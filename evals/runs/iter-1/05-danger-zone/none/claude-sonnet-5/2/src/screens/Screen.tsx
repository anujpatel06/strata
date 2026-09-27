import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
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
  enabled: boolean;
}

const initialProfile: Profile = {
  name: 'Anuj Patel',
  email: 'patel.anuj1997@gmail.com',
  phone: '+1 (415) 555-0148',
};

const initialPreferences: NotificationPreference[] = [
  {
    id: 'product-updates',
    label: 'Product updates',
    description: 'New features, improvements and announcements.',
    enabled: true,
  },
  {
    id: 'security-alerts',
    label: 'Security alerts',
    description: 'Sign-in attempts and changes to your account.',
    enabled: true,
  },
  {
    id: 'billing-notices',
    label: 'Billing notices',
    description: 'Invoices, receipts and payment reminders.',
    enabled: false,
  },
  {
    id: 'marketing-emails',
    label: 'Marketing emails',
    description: 'Offers, tips and other promotional messages.',
    enabled: false,
  },
];

const closureLosses = [
  'Your profile details and account preferences',
  'Notification settings and saved contact info',
  'Access to your billing history and invoices',
  'Any shared workspaces or team memberships',
];

function Switch({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={styles.switch}
      data-on={checked}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.switchThumb} />
    </button>
  );
}

export default function Screen() {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [savedProfile, setSavedProfile] = useState<Profile>(initialProfile);
  const [justSaved, setJustSaved] = useState(false);

  const [preferences, setPreferences] = useState<NotificationPreference[]>(initialPreferences);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [accountClosed, setAccountClosed] = useState(false);

  const headingId = useId();
  const dialogTitleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const profileDirty =
    profile.name !== savedProfile.name ||
    profile.email !== savedProfile.email ||
    profile.phone !== savedProfile.phone;

  function handleProfileChange(field: keyof Profile, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setJustSaved(false);
  }

  function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    setSavedProfile(profile);
    setJustSaved(true);
  }

  function togglePreference(id: string, next: boolean) {
    setPreferences((prev) =>
      prev.map((pref) => (pref.id === id ? { ...pref, enabled: next } : pref)),
    );
  }

  function openConfirm() {
    setUnderstood(false);
    setConfirmOpen(true);
  }

  function closeConfirm() {
    setConfirmOpen(false);
    closeButtonRef.current?.focus();
  }

  useEffect(() => {
    if (!confirmOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeConfirm();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmOpen]);

  function handleCloseAccount() {
    setAccountClosed(true);
    setConfirmOpen(false);
  }

  if (accountClosed) {
    return (
      <div className={styles.page}>
        <div className={styles.closedState} role="status">
          <h1 className={styles.closedTitle}>Your account has been closed</h1>
          <p className={styles.closedBody}>
            We're sorry to see you go. You've been signed out, and your data is being removed as
            described in our data retention policy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title} id={headingId}>
          Account settings
        </h1>
        <p className={styles.subtitle}>Manage your profile, notifications and account status.</p>
      </header>

      <section className={styles.section} aria-labelledby={`${headingId}-profile`}>
        <div className={styles.sectionHeading}>
          <h2 className={styles.sectionTitle} id={`${headingId}-profile`}>
            Profile details
          </h2>
          <p className={styles.sectionDescription}>
            This information may be shown to other people you work with.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSaveProfile}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="profile-name">
              Full name
            </label>
            <input
              id="profile-name"
              className={styles.input}
              type="text"
              value={profile.name}
              onChange={(e) => handleProfileChange('name', e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="profile-email">
              Email address
            </label>
            <input
              id="profile-email"
              className={styles.input}
              type="email"
              value={profile.email}
              onChange={(e) => handleProfileChange('email', e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="profile-phone">
              Phone number
            </label>
            <input
              id="profile-phone"
              className={styles.input}
              type="tel"
              value={profile.phone}
              onChange={(e) => handleProfileChange('phone', e.target.value)}
              autoComplete="tel"
            />
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryButton} disabled={!profileDirty}>
              Save changes
            </button>
            {justSaved && (
              <span className={styles.savedNote} role="status">
                Saved
              </span>
            )}
          </div>
        </form>
      </section>

      <section className={styles.section} aria-labelledby={`${headingId}-notifications`}>
        <div className={styles.sectionHeading}>
          <h2 className={styles.sectionTitle} id={`${headingId}-notifications`}>
            Notification preferences
          </h2>
          <p className={styles.sectionDescription}>
            Choose what you'd like to be notified about.
          </p>
        </div>

        <ul className={styles.prefList}>
          {preferences.map((pref) => (
            <li className={styles.prefRow} key={pref.id}>
              <div className={styles.prefText}>
                <label className={styles.prefLabel} htmlFor={pref.id}>
                  {pref.label}
                </label>
                <p className={styles.prefDescription}>{pref.description}</p>
              </div>
              <Switch
                id={pref.id}
                checked={pref.enabled}
                onChange={(next) => togglePreference(pref.id, next)}
                label={pref.label}
              />
            </li>
          ))}
        </ul>
      </section>

      <section
        className={`${styles.section} ${styles.dangerSection}`}
        aria-labelledby={`${headingId}-danger`}
      >
        <div className={styles.sectionHeading}>
          <h2 className={styles.sectionTitle} id={`${headingId}-danger`}>
            Close account
          </h2>
          <p className={styles.sectionDescription}>
            Permanently close your account. This action can't be undone.
          </p>
        </div>

        <button
          type="button"
          className={styles.dangerButton}
          onClick={openConfirm}
          ref={closeButtonRef}
        >
          Close my account
        </button>
      </section>

      {confirmOpen && (
        <div className={styles.overlay} onClick={closeConfirm}>
          <div
            className={styles.dialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.dialogTitle} id={dialogTitleId}>
              Close your account?
            </h2>
            <p className={styles.dialogBody}>
              This can't be undone. Closing your account will permanently delete:
            </p>
            <ul className={styles.lossList}>
              {closureLosses.map((loss) => (
                <li key={loss}>{loss}</li>
              ))}
            </ul>

            <label className={styles.confirmCheckboxRow}>
              <input
                type="checkbox"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
              />
              <span>I understand this action is permanent and can't be undone.</span>
            </label>

            <div className={styles.dialogActions}>
              <button type="button" className={styles.secondaryButton} onClick={closeConfirm}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.dangerButton}
                disabled={!understood}
                onClick={handleCloseAccount}
              >
                Permanently close account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
