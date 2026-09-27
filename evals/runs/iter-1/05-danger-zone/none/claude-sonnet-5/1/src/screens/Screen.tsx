import { useEffect, useId, useRef, useState } from 'react';
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
  name: 'Priya Sharma',
  email: 'priya.sharma@example.com',
  phone: '+91 98765 43210',
};

const initialNotifications: NotificationPreference[] = [
  {
    id: 'product-updates',
    label: 'Product updates',
    description: 'New features, improvements and announcements.',
    enabled: true,
  },
  {
    id: 'security-alerts',
    label: 'Security alerts',
    description: 'Sign-ins from new devices and account changes.',
    enabled: true,
  },
  {
    id: 'billing-emails',
    label: 'Billing emails',
    description: 'Receipts, invoices and payment reminders.',
    enabled: false,
  },
  {
    id: 'marketing',
    label: 'Marketing & promotions',
    description: 'Offers, tips and product recommendations.',
    enabled: false,
  },
];

const whatWillBeLost = [
  'Your profile details and saved preferences',
  'Your notification history and settings',
  'Any active subscriptions tied to this account',
  'Access to items you have shared with others',
];

function ToggleSwitch({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={styles.switchTrack}
      data-on={checked}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.switchThumb} />
    </button>
  );
}

export default function Screen() {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [profileDraft, setProfileDraft] = useState<Profile>(initialProfile);
  const [profileSaved, setProfileSaved] = useState(false);

  const [notifications, setNotifications] = useState<NotificationPreference[]>(initialNotifications);

  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [understandsLoss, setUnderstandsLoss] = useState(false);
  const [accountClosed, setAccountClosed] = useState(false);

  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const dialogTitleId = useId();
  const dialogDescId = useId();

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (isConfirmOpen) {
      dialogHeadingRef.current?.focus();
    }
  }, [isConfirmOpen]);

  const hasProfileChanges =
    profileDraft.name !== profile.name ||
    profileDraft.email !== profile.email ||
    profileDraft.phone !== profile.phone;

  function handleProfileSubmit(event: React.FormEvent) {
    event.preventDefault();
    setProfile(profileDraft);
    setProfileSaved(true);
    window.setTimeout(() => setProfileSaved(false), 3000);
  }

  function toggleNotification(id: string, enabled: boolean) {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, enabled } : item)));
  }

  function openConfirm() {
    setUnderstandsLoss(false);
    setConfirmOpen(true);
  }

  function cancelConfirm() {
    setConfirmOpen(false);
    closeButtonRef.current?.focus();
  }

  function confirmClose() {
    setConfirmOpen(false);
    setAccountClosed(true);
  }

  function handleDialogKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      cancelConfirm();
    }
  }

  if (accountClosed) {
    return (
      <div className={styles.page}>
        <div className={styles.closedState}>
          <h1 className={styles.title}>Your account has been closed</h1>
          <p className={styles.subtitle}>
            We&apos;re sorry to see you go. Your data will be permanently removed and you&apos;ll be signed out
            shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Account settings</h1>
        <p className={styles.subtitle}>Manage your profile, notifications and account.</p>
      </header>

      <section className={styles.section} aria-labelledby="profile-heading">
        <div className={styles.sectionHeader}>
          <h2 id="profile-heading" className={styles.sectionTitle}>
            Profile details
          </h2>
          <p className={styles.sectionDescription}>Your basic contact information.</p>
        </div>

        <form className={styles.form} onSubmit={handleProfileSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={nameId}>
              Name
            </label>
            <input
              id={nameId}
              className={styles.input}
              type="text"
              value={profileDraft.name}
              onChange={(event) => setProfileDraft((prev) => ({ ...prev, name: event.target.value }))}
              autoComplete="name"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor={emailId}>
              Email
            </label>
            <input
              id={emailId}
              className={styles.input}
              type="email"
              value={profileDraft.email}
              onChange={(event) => setProfileDraft((prev) => ({ ...prev, email: event.target.value }))}
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor={phoneId}>
              Phone
            </label>
            <input
              id={phoneId}
              className={styles.input}
              type="tel"
              value={profileDraft.phone}
              onChange={(event) => setProfileDraft((prev) => ({ ...prev, phone: event.target.value }))}
              autoComplete="tel"
            />
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.buttonPrimary} disabled={!hasProfileChanges}>
              Save changes
            </button>
            {profileSaved && <span className={styles.savedMessage}>Saved</span>}
          </div>
        </form>
      </section>

      <section className={styles.section} aria-labelledby="notifications-heading">
        <div className={styles.sectionHeader}>
          <h2 id="notifications-heading" className={styles.sectionTitle}>
            Notification preferences
          </h2>
          <p className={styles.sectionDescription}>Choose what you want to be notified about.</p>
        </div>

        <ul className={styles.toggleList}>
          {notifications.map((item) => (
            <li key={item.id} className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <label className={styles.toggleLabel} htmlFor={item.id}>
                  {item.label}
                </label>
                <p className={styles.toggleDescription}>{item.description}</p>
              </div>
              <ToggleSwitch
                id={item.id}
                checked={item.enabled}
                onChange={(enabled) => toggleNotification(item.id, enabled)}
                label={item.label}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.dangerSection} aria-labelledby="danger-heading">
        <div className={styles.sectionHeader}>
          <h2 id="danger-heading" className={styles.sectionTitle}>
            Close account
          </h2>
          <p className={styles.sectionDescription}>
            Permanently close your account. This action can&apos;t be undone.
          </p>
        </div>

        <button ref={closeButtonRef} type="button" className={styles.buttonDanger} onClick={openConfirm}>
          Close account
        </button>
      </section>

      {isConfirmOpen && (
        <div className={styles.overlay} onClick={cancelConfirm}>
          <div
            className={styles.dialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            aria-describedby={dialogDescId}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={handleDialogKeyDown}
          >
            <h3 id={dialogTitleId} className={styles.dialogTitle} tabIndex={-1} ref={dialogHeadingRef}>
              Close your account?
            </h3>
            <p id={dialogDescId} className={styles.dialogDescription}>
              This can&apos;t be undone. Closing your account will permanently remove:
            </p>
            <ul className={styles.dialogList}>
              {whatWillBeLost.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <label className={styles.dialogCheckboxRow}>
              <input
                type="checkbox"
                checked={understandsLoss}
                onChange={(event) => setUnderstandsLoss(event.target.checked)}
              />
              <span>I understand this action is permanent and can&apos;t be undone.</span>
            </label>

            <div className={styles.dialogActions}>
              <button type="button" className={styles.buttonSecondary} onClick={cancelConfirm}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.buttonDanger}
                disabled={!understandsLoss}
                onClick={confirmClose}
              >
                Close account permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
