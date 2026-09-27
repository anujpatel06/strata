import { useState } from 'react';
import styles from './Screen.module.css';

interface StepData {
  id: string;
  title: string;
  description: string;
  done: boolean;
  /** id of a step that must be completed before this one unlocks */
  requires?: string;
}

// Mock data — no backend.
const STEPS: StepData[] = [
  {
    id: 'verify-email',
    title: 'Verify your email address',
    description:
      'We sent a confirmation link to your inbox. Click it to confirm this address is yours and secure your account recovery options.',
    done: true,
  },
  {
    id: 'secure-account',
    title: 'Secure your account',
    description:
      'Set a strong password and, optionally, turn on two-factor authentication so only you can sign in.',
    done: true,
  },
  {
    id: 'create-project',
    title: 'Create your first project',
    description:
      'Projects are where your work lives. Give it a name and pick a template to get going in under a minute.',
    done: false,
  },
  {
    id: 'invite-team',
    title: 'Invite your team',
    description:
      'Bring in teammates so you can assign work and collaborate in real time. You can always invite more people later.',
    done: false,
    requires: 'create-project',
  },
  {
    id: 'billing',
    title: 'Set up billing details',
    description:
      'Add a payment method to keep your account active after your trial ends. You will not be charged today.',
    done: false,
  },
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M4 10.5l3.5 3.5L16 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" width="12" height="12" aria-hidden="true" focusable="false">
      <rect x="4.5" y="9" width="11" height="8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
      className={styles.chevron}
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
    >
      <path
        d="M5 7.5l5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Screen() {
  const [openId, setOpenId] = useState<string | null>('create-project');

  const doneIds = new Set(STEPS.filter((s) => s.done).map((s) => s.id));
  const doneCount = doneIds.size;
  const percent = Math.round((doneCount / STEPS.length) * 100);

  const toggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <section className={styles.screen} aria-labelledby="onboarding-heading">
      <header className={styles.header}>
        <h1 id="onboarding-heading" className={styles.title}>
          Set up your account
        </h1>
        <p className={styles.subtitle}>Finish these steps to get the most out of your new account.</p>
      </header>

      <div className={styles.progressSection}>
        <div className={styles.progressLabelRow}>
          <span className={styles.progressLabel}>
            {doneCount} of {STEPS.length} steps complete
          </span>
          <span className={styles.progressPercent}>{percent}%</span>
        </div>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Onboarding progress"
        >
          <div className={styles.progressFill} style={{ inlineSize: `${percent}%` }} />
        </div>
      </div>

      <ol className={styles.list}>
        {STEPS.map((step, index) => {
          const requiredStep = step.requires ? STEPS.find((s) => s.id === step.requires) : undefined;
          const isLocked = Boolean(requiredStep && !doneIds.has(requiredStep.id));
          const status: 'done' | 'locked' | 'available' = step.done ? 'done' : isLocked ? 'locked' : 'available';
          const isOpen = openId === step.id;
          const panelId = `${step.id}-panel`;
          const titleId = `${step.id}-title`;

          return (
            <li key={step.id} className={styles.step} data-status={status}>
              <h2 className={styles.stepHeading}>
                <button
                  type="button"
                  className={styles.stepHeader}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(step.id)}
                >
                  <span className={styles.stepIcon} aria-hidden="true">
                    {status === 'done' ? <CheckIcon /> : status === 'locked' ? <LockIcon /> : index + 1}
                  </span>
                  <span className={styles.stepTitleGroup}>
                    <span id={titleId} className={styles.stepTitle}>
                      {step.title}
                    </span>
                    <span className={styles.stepStatusText}>
                      {status === 'done' ? 'Completed' : status === 'locked' ? 'Locked' : 'Not started'}
                    </span>
                  </span>
                  <ChevronIcon open={isOpen} />
                </button>
              </h2>

              {isOpen && (
                <div id={panelId} role="region" aria-labelledby={titleId} className={styles.stepBody}>
                  <p className={styles.stepDescription}>{step.description}</p>

                  {isLocked && requiredStep && (
                    <p className={styles.lockedNote}>
                      <LockIcon /> Complete “{requiredStep.title}” first to unlock this step.
                    </p>
                  )}

                  <button
                    type="button"
                    className={
                      status === 'done'
                        ? `${styles.button} ${styles.buttonSecondary}`
                        : status === 'locked'
                          ? `${styles.button} ${styles.buttonDisabled}`
                          : `${styles.button} ${styles.buttonPrimary}`
                    }
                    disabled={status === 'locked'}
                    aria-disabled={status === 'locked'}
                  >
                    {status === 'done' ? 'Review step' : status === 'locked' ? 'Start step' : 'Start step'}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
