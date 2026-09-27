import { useState } from 'react';
import type { Key } from 'react';
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

type BillingPeriod = 'monthly' | 'yearly';

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
      { label: 'Unlimited projects', included: true },
      { label: 'Basic analytics', included: true },
      { label: 'Priority support', included: false },
      { label: 'Custom domains', included: false },
      { label: 'Single sign-on', included: false },
      { label: 'Dedicated account manager', included: false },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    summary: 'For growing teams that need more room to work.',
    monthlyPrice: 29,
    yearlyPrice: 290,
    recommended: true,
    features: [
      { label: 'Unlimited projects', included: true },
      { label: 'Basic analytics', included: true },
      { label: 'Priority support', included: true },
      { label: 'Custom domains', included: true },
      { label: 'Single sign-on', included: false },
      { label: 'Dedicated account manager', included: false },
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    summary: 'For organisations running at scale, worldwide.',
    monthlyPrice: 79,
    yearlyPrice: 790,
    features: [
      { label: 'Unlimited projects', included: true },
      { label: 'Basic analytics', included: true },
      { label: 'Priority support', included: true },
      { label: 'Custom domains', included: true },
      { label: 'Single sign-on', included: true },
      { label: 'Dedicated account manager', included: true },
    ],
  },
];

export default function Screen() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  function handlePeriodChange(keys: Set<Key>) {
    const key = Array.from(keys)[0];
    if (key === 'monthly' || key === 'yearly') {
      setBillingPeriod(key);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Eyebrow>Pricing</Eyebrow>
        <h1 className={styles.title}>Compare plans</h1>
        <p className={styles.subtitle}>
          Choose the plan that fits your team. Switch between monthly and yearly billing.
        </p>
        <ToggleButtonGroup
          aria-label="Billing period"
          selectedKeys={[billingPeriod]}
          onSelectionChange={handlePeriodChange}
          disallowEmptySelection
        >
          <ToggleButton id="monthly">Monthly</ToggleButton>
          <ToggleButton id="yearly">Yearly</ToggleButton>
        </ToggleButtonGroup>
      </div>

      <div className={styles.grid}>
        {plans.map((plan) => (
          <Card
            key={plan.id}
            variant={plan.recommended ? 'feature' : 'default'}
            className={styles.card}
          >
            <CardHeader>
              {plan.recommended ? (
                <CardAction>
                  <Badge tone="brand">Recommended</Badge>
                </CardAction>
              ) : null}
              <CardTitle level={2}>{plan.name}</CardTitle>
              <CardDescription>{plan.summary}</CardDescription>
            </CardHeader>

            <CardContent className={styles.content}>
              <div className={styles.priceRow}>
                <Amount
                  value={billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  currency={CURRENCY}
                  size="lg"
                />
                <span className={styles.pricePeriod}>
                  {billingPeriod === 'monthly' ? '/ month' : '/ year'}
                </span>
              </div>

              <ul className={styles.featureList}>
                {plan.features.map((feature) => (
                  <li key={feature.label} className={styles.featureRow}>
                    <span
                      aria-hidden="true"
                      className={feature.included ? styles.iconIncluded : styles.iconExcluded}
                    >
                      {feature.included ? <IconCheck /> : <IconX />}
                    </span>
                    <span className={styles.visuallyHidden}>
                      {feature.included ? 'Included: ' : 'Not included: '}
                    </span>
                    <span className={feature.included ? styles.featureLabel : styles.featureLabelExcluded}>
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                variant={plan.recommended ? 'primary' : 'outline'}
                className={styles.cta}
              >
                Choose {plan.name}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
