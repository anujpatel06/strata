import {
  Accordion,
  AccordionItem,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  IconTile,
  ProgressBar,
} from '@strata/react';
import {
  IconCircleCheck,
  IconCreditCard,
  IconLayoutDashboard,
  IconLock,
  IconMail,
  IconShieldLock,
  IconUsers,
} from '@strata/icons';
import type { Icon } from '@strata/icons';
import type { ReactNode } from 'react';
import styles from './Screen.module.css';

type StepStatus = 'done' | 'available' | 'locked';

interface OnboardingStep {
  id: string;
  title: string;
  summary: string;
  detail: string;
  tasks: string[];
  status: StepStatus;
  icon: Icon;
  /** Id of the step that must be done first. Only set for locked steps. */
  requiresId?: string;
}

const steps: OnboardingStep[] = [
  {
    id: 'verify-email',
    title: 'Verify your email',
    summary: 'Confirmed — you can sign in from any device.',
    detail:
      'We sent a confirmation link to your email address so we know it belongs to you. This keeps your account recoverable and lets us send you important notices.',
    tasks: [
      'Open the confirmation email in your inbox',
      'Click the verification link inside it',
      'Sign back in to confirm it worked',
    ],
    status: 'done',
    icon: IconMail,
  },
  {
    id: 'add-payment',
    title: 'Add a payment method',
    summary: 'Saved — you’re ready to send or receive money.',
    detail:
      'A saved card or bank account lets us bill you automatically and lets you pay out without re-entering details every time.',
    tasks: [
      'Add a card or bank account',
      'Confirm the small verification charge',
      'Set it as your default method',
    ],
    status: 'done',
    icon: IconCreditCard,
  },
  {
    id: 'invite-team',
    title: 'Invite your team',
    summary: 'Add the people who’ll work in this account with you.',
    detail:
      'Bring colleagues in so work isn’t stuck with one person. You can choose what each teammate can see and do.',
    tasks: [
      'Enter your teammates’ email addresses',
      'Choose a role for each person',
      'Send the invitations',
    ],
    status: 'available',
    icon: IconUsers,
  },
  {
    id: 'connect-workspace',
    title: 'Connect your workspace',
    summary: 'Link the tools you already use.',
    detail:
      'Connect your existing calendar, storage or messaging tools so information stays in sync without manual work.',
    tasks: ['Pick a tool to connect', 'Sign in and grant access', 'Choose what to sync'],
    status: 'available',
    icon: IconLayoutDashboard,
  },
  {
    id: 'backup-admin',
    title: 'Add a backup admin',
    summary: 'Name someone who can step in if you’re unavailable.',
    detail:
      'A backup admin can manage the account if you lose access or are away, so nothing gets stuck waiting on one person.',
    tasks: [
      'Pick a teammate you trust',
      'Grant them admin access',
      'Confirm the handover with them',
    ],
    status: 'locked',
    icon: IconShieldLock,
    requiresId: 'invite-team',
  },
];

const stepsById = new Map(steps.map((step) => [step.id, step]));

const badgeByStatus: Record<StepStatus, { label: string; tone: 'success' | 'neutral' }> = {
  done: { label: 'Completed', tone: 'success' },
  available: { label: 'Not started', tone: 'neutral' },
  locked: { label: 'Locked', tone: 'neutral' },
};

const actionLabelByStatus: Record<StepStatus, string> = {
  done: 'Review',
  available: 'Start',
  locked: 'Start',
};

function StepTitle({ step }: { step: OnboardingStep }) {
  const badge = badgeByStatus[step.status];
  const StepIcon = step.icon;

  return (
    <span className={styles.row}>
      <IconTile
        size="md"
        tint={step.status === 'done' ? 'success' : step.status === 'locked' ? 'none' : 'solid'}
      >
        {step.status === 'done' ? (
          <IconCircleCheck />
        ) : step.status === 'locked' ? (
          <IconLock />
        ) : (
          <StepIcon />
        )}
      </IconTile>
      <span className={styles.rowText}>
        <span className={styles.rowTitle}>{step.title}</span>
        <span className={styles.rowSummary}>{step.summary}</span>
      </span>
      <span className={styles.badgeSlot}>
        <Badge tone={badge.tone} variant="soft" size="sm">
          {badge.label}
        </Badge>
      </span>
    </span>
  );
}

function StepBody({ step }: { step: OnboardingStep }): ReactNode {
  const requiredStep = step.requiresId ? stepsById.get(step.requiresId) : undefined;

  return (
    <div className={styles.body}>
      <p className={styles.detail}>{step.detail}</p>
      <p className={styles.involvesLabel}>This involves:</p>
      <ul className={styles.taskList}>
        {step.tasks.map((task) => (
          <li key={task}>{task}</li>
        ))}
      </ul>
      {requiredStep && (
        <p className={styles.lockNote}>
          <IconLock size="1.1em" />
          Locked until you finish “{requiredStep.title}”.
        </p>
      )}
      <div className={styles.actions}>
        <Button
          variant={step.status === 'done' ? 'outline' : 'primary'}
          isDisabled={step.status === 'locked'}
        >
          {actionLabelByStatus[step.status]}
        </Button>
      </div>
    </div>
  );
}

export default function Screen() {
  const completedCount = steps.filter((step) => step.status === 'done').length;
  const totalCount = steps.length;

  return (
    <Card className={styles.card}>
      <CardHeader className={styles.header}>
        <CardTitle level={1}>Finish setting up your account</CardTitle>
        <CardDescription>
          Complete the steps below to unlock full access for you and your team.
        </CardDescription>
        <div className={styles.progressRow}>
          <ProgressBar
            label="Onboarding progress"
            value={completedCount}
            minValue={0}
            maxValue={totalCount}
            showValue
          />
          <span className={styles.progressCaption}>
            {completedCount} of {totalCount} steps complete
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion
          className={styles.accordion}
          aria-label="Onboarding steps"
          defaultExpandedKeys={['invite-team']}
        >
          {steps.map((step) => (
            <AccordionItem
              key={step.id}
              id={step.id}
              headingLevel={2}
              title={<StepTitle step={step} />}
            >
              <StepBody step={step} />
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
