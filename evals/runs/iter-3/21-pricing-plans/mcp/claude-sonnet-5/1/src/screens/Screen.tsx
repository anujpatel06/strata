import { useState } from 'react';
import {
  Amount,
  Badge,
  Button,
  Card,
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
import { IconCheck, IconX } from '@syntara/icons';
import styles from './Screen.module.css';

type BillingPeriod = 'monthly' | 'yearly';

interface Plan {
  id: string;
  name: string;
  summary: string;
  monthlyPrice: number;
  yearlyPrice: number;
  recommended?: boolean;
  features: boolean[];
}

const CURRENCY = 'USD';

const FEATURES = [
  'Unlimited projects',
  'Team collaboration',
  'Priority support',
  'Advanced analytics',
  'Custom integrations',
  'Dedicated account manager',
];

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    summary: 'For individuals getting started.',
    monthlyPrice: 19,
    yearlyPrice: 190,
    features: [true, true, false, false, false, false],
  },
  {
    id: 'growth',
    name: 'Growth',
    summary: 'For growing teams that need more power.',
    monthlyPrice: 49,
    yearlyPrice: 490,
    recommended: true,
    features: [true, true, true, true, false, false],
  },
  {
    id: 'scale',
    name: 'Scale',
    summary: 'For organizations that need everything.',
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: [true, true, true, true, true, true],
  },
];

export default function Screen() {
  const [period, setPeriod] = useState<Set<Key>>(new Set(['monthly']));
  const billingPeriod = (String([...period][0] ?? 'monthly') as BillingPeriod);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Eyebrow>Pricing</Eyebrow>
        <h1 className={styles.title}>Choose your plan</h1>
        <p className={styles.subtitle}>Switch between monthly and yearly billing to see what you'll pay.</p>
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
      </div>

      <div className={styles.grid}>
        {PLANS.map((plan) => {
          const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
          return (
            <Card
              key={plan.id}
              variant={plan.recommended ? 'feature' : 'outline'}
              className={styles.card}
            >
              <CardHeader>
                {plan.recommended ? (
                  <Badge tone="brand" className={styles.badge}>Recommended</Badge>
                ) : null}
                <CardTitle level={2}>{plan.name}</CardTitle>
                <CardDescription>{plan.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={styles.priceRow}>
                  <Amount
                    value={price}
                    currency={CURRENCY}
                    size="lg"
                    tone={plan.recommended ? 'brand' : 'neutral'}
                  />
                  <span className={styles.pricePeriod}>
                    {billingPeriod === 'monthly' ? 'per month' : 'per year'}
                  </span>
                </div>
                <ul className={styles.featureList}>
                  {FEATURES.map((feature, index) => {
                    const included = plan.features[index];
                    return (
                      <li key={feature} className={styles.featureRow}>
                        {included ? (
                          <IconCheck aria-hidden className={styles.iconIncluded} />
                        ) : (
                          <IconX aria-hidden className={styles.iconExcluded} />
                        )}
                        <span className={included ? styles.featureText : styles.featureTextMuted}>
                          {feature}
                        </span>
                        <span className={styles.visuallyHidden}>
                          {included ? ' — included' : ' — not included'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  variant={plan.recommended ? 'primary' : 'outline'}
                  className={styles.chooseButton}
                >
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
