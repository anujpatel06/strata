import { useState } from 'react';
import styles from './Screen.module.css';

type StepStatus = 'done' | 'available' | 'in-progress' | 'locked';

interface Step {
  id: string;
  title: string;
  summary: string;
  details: string[];
  status: StepStatus;
  /** id of the step that must be done first, only set when status is 'locked' */
  requires?: string;
}

const initialSteps: Step[] = [
  {
    id: 'verify-email',
    title: 'Verify your email',
    summary: 'Confirm your email address to secure your account.',
    details: [
      'We sent a confirmation link to your inbox.',
      'Click the link to verify you own this email address.',
      'Takes less than a minute.',
    ],
    status: 'done',
  },
  {
    id: 'company-details',
    title: 'Add company details',
    summary: 'Tell us about your organisation.',
    details: [
      'Add your company name, size and industry.',
      'This helps us tailor your workspace.',
      'You can edit these details later in Settings.',
    ],
    status: 'done',
  },
  {
    id: 'invite-team',
    title: 'Invite your team',
    summary: 'Bring your colleagues into the workspace.',
    details: [
      'Add teammates by email address.',
      'Assign each person a role: admin, member or viewer.',
      'Invited teammates get an email with a join link.',
    ],
    status: 'available',
  },
  {
    id: 'connect-billing',
    title: 'Connect billing',
    summary: 'Add a payment method to keep your account active.',
    details: [
      'Add a card or bank account.',
      "You won't be charged until your trial ends.",
      'Billing details are handled by our PCI-compliant provider.',
    ],
    status: 'locked',
    requires: 'invite-team',
  },
  {
    id: 'security-policies',
    title: 'Set up security policies',
    summary: 'Configure sign-in and access rules for your workspace.',
    details: [
      'Require two-factor authentication for all members.',
      'Set session timeouts and allowed sign-in methods.',
      'Restrict access by IP range if needed.',
    ],
    status: 'available',
  },
];

function CheckIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M3 8.5l3 3 7-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`${styles.chevron} ${expanded ? styles.chevronExpanded : ''}`}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 6l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Screen() {
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [expandedId, setExpandedId] = useState<string | null>('invite-team');

  const doneCount = steps.filter((step) => step.status === 'done').length;
  const total = steps.length;
  const percent = Math.round((doneCount / total) * 100);

  function toggleExpanded(id: string) {
    setExpandedId((current) => (current === id ? null : id));
  }

  function startStep(id: string) {
    setSteps((current) =>
      current.map((step) => (step.id === id && step.status === 'available' ? { ...step, status: 'in-progress' } : step)),
    );
  }

  function titleFor(id: string | undefined) {
    return steps.find((step) => step.id === id)?.title ?? '';
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Finish setting up your account</h1>
        <p className={styles.subheading}>
          Complete these steps to get the most out of your new workspace.
        </p>
      </header>

      <div className={styles.progressCard}>
        <div className={styles.progressTop}>
          <span className={styles.progressLabel}>Overall progress</span>
          <span className={styles.progressCount}>
            {doneCount} of {total} complete
          </span>
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
        {steps.map((step, index) => {
          const isLocked = step.status === 'locked';
          const isDone = step.status === 'done';
          const isExpanded = expandedId === step.id;

          return (
            <li key={step.id} className={`${styles.step} ${isLocked ? styles.stepLocked : ''}`}>
              <button
                type="button"
                className={styles.stepHeader}
                aria-expanded={isExpanded}
                onClick={() => toggleExpanded(step.id)}
              >
                <span
                  className={`${styles.statusBadge} ${
                    isDone ? styles.statusDone : isLocked ? styles.statusLocked : styles.statusPending
                  }`}
                >
                  {isDone ? <CheckIcon /> : isLocked ? <LockIcon /> : index + 1}
                </span>

                <span className={styles.stepHeaderText}>
                  <span className={styles.stepTitle}>{step.title}</span>
                  <span className={styles.stepSummary}>{step.summary}</span>
                </span>

                <span className={styles.stepMeta}>
                  {isDone && <span className={styles.doneTag}>Done</span>}
                  {step.status === 'in-progress' && <span className={styles.progressTag}>In progress</span>}
                  {isLocked && <span className={styles.lockedTag}>Locked</span>}
                  <ChevronIcon expanded={isExpanded} />
                </span>
              </button>

              {isExpanded && (
                <div className={styles.stepBody}>
                  <p className={styles.stepBodyIntro}>This step involves:</p>
                  <ul className={styles.detailsList}>
                    {step.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>

                  {isLocked ? (
                    <p className={styles.lockedNote}>
                      <LockIcon /> Complete &ldquo;{titleFor(step.requires)}&rdquo; first to unlock this step.
                    </p>
                  ) : (
                    <button
                      type="button"
                      className={styles.startButton}
                      disabled={isDone || step.status === 'in-progress'}
                      onClick={() => startStep(step.id)}
                    >
                      {isDone ? 'Completed' : step.status === 'in-progress' ? 'Started' : 'Start'}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
