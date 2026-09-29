'use client';

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
  type Key,
} from '@syntara/react';
import { IconCheck, IconStar, IconX } from '@syntara/icons';
import styles from './Screen.module.css';

type Feature = {
  label: string;
  included: boolean;
};

type Plan = {
  id: string;
  name: string;
  summary: string;
  monthlyPrice: number;
  yearlyPrice: number;
  recommended?: boolean;
  features: Feature[];
};

const CURRENCY = 'USD';

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    summary: 'Everything a small team needs to get going.',
    monthlyPrice: 12,
    yearlyPrice: 120,
    features: [
      { label: 'Up to 5 team members', included: true },
      { label: '10 GB storage', included: true },
      { label: 'Analytics dashboard', included: false },
      { label: 'Priority support', included: false },
      { label: 'Custom integrations', included: false },
      { label: 'Advanced security controls', included: false },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    summary: 'More room to grow, with support to match.',
    monthlyPrice: 32,
    yearlyPrice: 320,
    recommended: true,
    features: [
      { label: 'Up to 25 team members', included: true },
      { label: '100 GB storage', included: true },
      { label: 'Analytics dashboard', included: true },
      { label: 'Priority support', included: true },
      { label: 'Custom integrations', included: false },
      { label: 'Advanced security controls', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    summary: 'Unlimited scale with dedicated security controls.',
    monthlyPrice: 80,
    yearlyPrice: 800,
    features: [
      { label: 'Unlimited team members', included: true },
      { label: '1 TB storage', included: true },
      { label: 'Analytics dashboard', included: true },
      { label: 'Priority support', included: true },
      { label: 'Custom integrations', included: true },
      { label: 'Advanced security controls', included: true },
    ],
  },
];

export default function Screen() {
  const [period, setPeriod] = useState<Set<Key>>(new Set(['monthly']));
  const isYearly = period.has('yearly');

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <Eyebrow>Pricing</Eyebrow>
        <h1 className={styles.heading}>Find the plan that fits your team</h1>
        <p className={styles.subheading}>Switch between monthly and yearly billing at any time.</p>
      </div>

      <ToggleButtonGroup
        aria-label="Billing period"
        selectedKeys={period}
        onSelectionChange={setPeriod}
        disallowEmptySelection
        className={styles.periodToggle}
      >
        <ToggleButton id="monthly">Monthly</ToggleButton>
        <ToggleButton id="yearly">Yearly</ToggleButton>
      </ToggleButtonGroup>

      <div className={styles.grid}>
        {plans.map((plan) => (
          <Card key={plan.id} variant={plan.recommended ? 'default' : 'outline'} rim className={styles.card}>
            <CardHeader>
              {plan.recommended ? (
                <CardAction>
                  <Badge tone="brand" variant="solid" icon={<IconStar aria-hidden />}>
                    Recommended
                  </Badge>
                </CardAction>
              ) : null}
              <CardTitle level={2}>{plan.name}</CardTitle>
              <CardDescription>{plan.summary}</CardDescription>
            </CardHeader>

            <CardContent className={styles.priceBlock}>
              <div className={styles.priceRow}>
                <Amount value={isYearly ? plan.yearlyPrice : plan.monthlyPrice} currency={CURRENCY} size="lg" />
                <span className={styles.period}>{isYearly ? 'per year' : 'per month'}</span>
              </div>
              <p className={styles.priceNote}>
                {isYearly ? (
                  <>
                    <Amount value={Math.round(plan.yearlyPrice / 12)} currency={CURRENCY} size="sm" /> per month, billed yearly
                  </>
                ) : (
                  'Billed monthly'
                )}
              </p>
            </CardContent>

            <CardContent className={styles.featureBlock}>
              <ul className={styles.featureList}>
                {plan.features.map((feature) => (
                  <li key={feature.label} className={styles.featureRow}>
                    {feature.included ? (
                      <IconCheck aria-hidden className={styles.includedIcon} />
                    ) : (
                      <IconX aria-hidden className={styles.excludedIcon} />
                    )}
                    <span className={feature.included ? undefined : styles.excludedLabel}>
                      <span className={styles.srOnly}>{feature.included ? 'Included: ' : 'Not included: '}</span>
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button variant={plan.recommended ? 'primary' : 'outline'} className={styles.cta}>
                Choose {plan.name}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
