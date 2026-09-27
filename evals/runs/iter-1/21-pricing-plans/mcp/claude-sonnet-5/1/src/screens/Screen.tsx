import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Amount,
  ToggleButton,
  ToggleButtonGroup,
} from '@strata/react';
import { IconCheck } from '@strata/icons';
import styles from './Screen.module.css';

type Period = 'month' | 'year';

interface Plan {
  id: string;
  name: string;
  summary: string;
  monthlyPrice: number;
  yearlyPrice: number;
  recommended?: boolean;
  included: boolean[];
}

const CURRENCY = 'USD';

const FEATURES = [
  'Up to 20 projects',
  'Advanced analytics',
  'Team collaboration',
  'Custom integrations',
  'Priority support',
  'Dedicated account manager',
];

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    summary: 'For individuals getting a project off the ground.',
    monthlyPrice: 9,
    yearlyPrice: 90,
    included: [true, true, false, false, false, false],
  },
  {
    id: 'growth',
    name: 'Growth',
    summary: 'For growing teams that need more room to work.',
    monthlyPrice: 29,
    yearlyPrice: 290,
    recommended: true,
    included: [true, true, true, true, false, false],
  },
  {
    id: 'scale',
    name: 'Scale',
    summary: 'For organisations that need everything, everywhere.',
    monthlyPrice: 79,
    yearlyPrice: 790,
    included: [true, true, true, true, true, true],
  },
];

export default function Screen() {
  const [period, setPeriod] = useState<Period>('month');

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <h1 className={styles.title}>Compare plans</h1>
        <p className={styles.subtitle}>Pick the plan that fits your team. Switch to yearly billing for a lower rate.</p>
        <ToggleButtonGroup
          aria-label="Billing period"
          selectedKeys={[period]}
          disallowEmptySelection
          onSelectionChange={(keys) => {
            const [key] = keys;
            if (key === 'month' || key === 'year') {
              setPeriod(key);
            }
          }}
        >
          <ToggleButton id="month">Monthly</ToggleButton>
          <ToggleButton id="year">Yearly</ToggleButton>
        </ToggleButtonGroup>
      </header>

      <div className={styles.grid}>
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            variant={plan.recommended ? 'feature' : 'outline'}
            className={styles.card}
          >
            <CardHeader>
              {plan.recommended && (
                <CardAction>
                  <Badge tone="brand" variant="solid">
                    Recommended
                  </Badge>
                </CardAction>
              )}
              <CardTitle level={2}>{plan.name}</CardTitle>
              <CardDescription>{plan.summary}</CardDescription>
            </CardHeader>

            <CardContent className={styles.priceBlock}>
              <Amount
                value={period === 'month' ? plan.monthlyPrice : plan.yearlyPrice}
                currency={CURRENCY}
                size="lg"
              />
              <span className={styles.pricePeriod}>per {period}</span>
            </CardContent>

            <CardContent>
              <ul className={styles.featureList}>
                {FEATURES.map((feature, index) => {
                  const included = plan.included[index];
                  return (
                    <li key={feature} className={styles.featureRow}>
                      <span className={styles.featureName}>{feature}</span>
                      <span className={included ? styles.included : styles.notIncluded}>
                        {included && <IconCheck aria-hidden className={styles.checkIcon} />}
                        {included ? 'Included' : 'Not included'}
                      </span>
                    </li>
                  );
                })}
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
