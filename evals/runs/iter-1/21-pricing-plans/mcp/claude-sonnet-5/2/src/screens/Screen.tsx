import { useState } from 'react';
import {
  Amount,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Eyebrow,
  ToggleButton,
  ToggleButtonGroup,
} from '@strata/react';
import { IconCheck, IconX } from '@strata/icons';
import styles from './Screen.module.css';

type Period = 'monthly' | 'yearly';

interface Feature {
  label: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  summary: string;
  monthlyPrice: number;
  yearlyPrice: number;
  recommended?: boolean;
  features: Feature[];
}

const CURRENCY = 'USD';

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    summary: 'For individuals trying things out on their own.',
    monthlyPrice: 9,
    yearlyPrice: 90,
    features: [
      { label: 'Up to 3 projects', included: true },
      { label: '5 GB storage', included: true },
      { label: 'Community support', included: true },
      { label: 'Custom domains', included: false },
      { label: 'Team roles and permissions', included: false },
      { label: 'Priority support', included: false },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    summary: 'For small teams who need more room to work.',
    monthlyPrice: 29,
    yearlyPrice: 290,
    recommended: true,
    features: [
      { label: 'Unlimited projects', included: true },
      { label: '100 GB storage', included: true },
      { label: 'Community support', included: true },
      { label: 'Custom domains', included: true },
      { label: 'Team roles and permissions', included: true },
      { label: 'Priority support', included: false },
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    summary: 'For organisations that need control at scale.',
    monthlyPrice: 79,
    yearlyPrice: 790,
    features: [
      { label: 'Unlimited projects', included: true },
      { label: '1 TB storage', included: true },
      { label: 'Community support', included: true },
      { label: 'Custom domains', included: true },
      { label: 'Team roles and permissions', included: true },
      { label: 'Priority support', included: true },
    ],
  },
];

export default function Screen() {
  const [period, setPeriod] = useState<Period>('monthly');

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <Eyebrow>Pricing</Eyebrow>
          <h1 className={styles.heading}>Choose your plan</h1>
          <p className={styles.subheading}>
            Every plan covers the essentials. Upgrade any time as your team grows.
          </p>
        </div>
        <ToggleButtonGroup
          aria-label="Billing period"
          selectedKeys={[period]}
          disallowEmptySelection
          onSelectionChange={(keys) => {
            const [key] = keys;
            if (key) setPeriod(key as Period);
          }}
        >
          <ToggleButton id="monthly">Monthly</ToggleButton>
          <ToggleButton id="yearly">Yearly</ToggleButton>
        </ToggleButtonGroup>
      </header>

      <div className={styles.grid}>
        {plans.map((plan) => {
          const price = period === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
          return (
            <Card
              key={plan.id}
              variant={plan.recommended ? 'feature' : 'outline'}
              className={styles.card}
            >
              <CardHeader>
                {plan.recommended ? (
                  <CardAction>
                    <Badge tone="brand" variant="solid">
                      Recommended
                    </Badge>
                  </CardAction>
                ) : null}
                <CardTitle level={2}>{plan.name}</CardTitle>
                <CardDescription>{plan.summary}</CardDescription>
              </CardHeader>

              <CardContent className={styles.content}>
                <div className={styles.price}>
                  <Amount value={price} currency={CURRENCY} size="lg" />
                  <span className={styles.period}>per {period === 'monthly' ? 'month' : 'year'}</span>
                </div>

                <ul className={styles.featureList}>
                  {plan.features.map((feature) => (
                    <li key={feature.label} className={styles.featureRow}>
                      <span
                        className={
                          feature.included ? styles.featureIcon : `${styles.featureIcon} ${styles.featureIconMuted}`
                        }
                      >
                        {feature.included ? <IconCheck /> : <IconX />}
                      </span>
                      <span
                        className={
                          feature.included ? styles.featureText : `${styles.featureText} ${styles.featureTextMuted}`
                        }
                      >
                        <span className={styles.visuallyHidden}>
                          {feature.included ? 'Included: ' : 'Not included: '}
                        </span>
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button variant={plan.recommended ? 'primary' : 'secondary'} className={styles.cta}>
                  Choose {plan.name}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
