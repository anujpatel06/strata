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
  IconCheck,
  IconCreditCard,
  IconLock,
  IconMail,
  IconShieldCheck,
  IconUser,
  IconUserPlus,
} from '@strata/icons';
import type { ReactNode } from 'react';
import styles from './Screen.module.css';

type Step = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  isDone: boolean;
  requires?: string;
};

const steps: Step[] = [
  {
    id: 'verify-email',
    title: 'Verify your email',
    description: 'Confirm the email address on your account so we can send receipts and security alerts to the right place.',
    icon: <IconMail />,
    isDone: true,
  },
  {
    id: 'complete-profile',
    title: 'Complete your profile',
    description: 'Add your name, role and a photo so your teammates recognise you across the account.',
    icon: <IconUser />,
    isDone: true,
  },
  {
    id: 'invite-team',
    title: 'Invite your team',
    description: 'Bring in teammates by email. They can accept the invite and start collaborating right away.',
    icon: <IconUserPlus />,
    isDone: false,
  },
  {
    id: 'add-billing',
    title: 'Add billing details',
    description: 'Add a payment method so your plan keeps running once the trial ends.',
    icon: <IconCreditCard />,
    isDone: false,
  },
  {
    id: 'two-factor',
    title: 'Turn on two-factor authentication',
    description: 'Add a verification code at sign-in for an extra layer of protection on your account.',
    icon: <IconShieldCheck />,
    isDone: false,
    requires: 'add-billing',
  },
];

const stepsById = new Map(steps.map((step) => [step.id, step]));
const doneCount = steps.filter((step) => step.isDone).length;

export default function Screen() {
  return (
    <div className={styles.page}>
      <Card>
        <CardHeader>
          <CardTitle level={1}>Finish setting up your account</CardTitle>
          <CardDescription>Complete these steps to unlock full access for your team.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressBar
            label="Setup progress"
            value={doneCount}
            maxValue={steps.length}
            valueLabel={`${doneCount} of ${steps.length} steps`}
            showValue
          />
        </CardContent>
      </Card>

      <Accordion allowsMultipleExpanded className={styles.accordion}>
        {steps.map((step) => {
          const requiredStep = step.requires ? stepsById.get(step.requires) : undefined;
          const isLocked = Boolean(requiredStep && !requiredStep.isDone);

          return (
            <AccordionItem
              key={step.id}
              id={step.id}
              headingLevel={2}
              title={
                <span className={styles.stepTitle}>
                  <IconTile size="sm" tint={step.isDone ? 'success' : isLocked ? 'none' : 'brand'}>
                    {step.icon}
                  </IconTile>
                  <span className={styles.stepTitleText}>{step.title}</span>
                  {step.isDone ? (
                    <Badge tone="success" icon={<IconCheck />}>
                      Done
                    </Badge>
                  ) : isLocked ? (
                    <Badge tone="neutral" icon={<IconLock />}>
                      Locked
                    </Badge>
                  ) : (
                    <Badge tone="info">To do</Badge>
                  )}
                </span>
              }
            >
              <div className={styles.stepBody}>
                <p className={styles.stepDescription}>{step.description}</p>
                {isLocked && requiredStep && (
                  <p className={styles.lockedNote}>
                    <IconLock aria-hidden />
                    Unlocks once you finish &ldquo;{requiredStep.title}&rdquo;.
                  </p>
                )}
                <Button variant={step.isDone ? 'secondary' : 'primary'} isDisabled={isLocked}>
                  {step.isDone ? 'Review step' : 'Start'}
                </Button>
              </div>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
