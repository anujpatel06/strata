import { useState, type Key } from 'react';
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
import { IconCheck, IconStar, IconX } from '@strata/icons';
import styles from './Screen.module.css';

type BillingPeriod = 'monthly' | 'yearly';

type Plan = {
  id: string;
  name: string;
  summary: string;
  monthlyPrice: number;
  yearlyPrice: number;
  recommended: boolean;
  features: [boolean, boolean, boolean, boolean, boolean, boolean];
};

const FEATURE_NAMES = [
  'Unlimited projects',
  'Team collaboration',
  'Priority support',
  'Advanced analytics',
  'Custom integrations',
  'Dedicated account manager',
] as const;

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    summary: 'For individuals trying things out.',
    monthlyPrice: 9,
    yearlyPrice: 90,
    recommended: false,
    features: [true, true, false, false, false, false],
  },
  {
    id: 'growth',
    name: 'Growth',
    summary: 'For small teams shipping every week.',
    monthlyPrice: 29,
    yearlyPrice: 288,
    recommended: true,
    features: [true, true, true, true, true, false],
  },
  {
    id: 'scale',
    name: 'Scale',
    summary: 'For organizations that need more control.',
    monthlyPrice: 79,
    yearlyPrice: 780,
    recommended: false,
    features: [true, true, true, true, true, true],
  },
];

const CURRENCY = 'USD';

export default function Screen() {
  const [billing, setBilling] = useState<BillingPeriod>('monthly');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <Eyebrow>Pricing</Eyebrow>
          <h1 className={styles.title}>Choose your plan</h1>
          <p className={styles.subtitle}>
            Simple pricing that scales with your team. Switch to yearly billing and save.
          </p>
        </div>
        <ToggleButtonGroup
          aria-label="Billing period"
          selectedKeys={[billing]}
          disallowEmptySelection
          onSelectionChange={(keys: Set<Key>) => {
            const [next] = keys;
            if (next === 'monthly' || next === 'yearly') {
              setBilling(next);
            }
          }}
        >
          <ToggleButton id="monthly">Monthly</ToggleButton>
          <ToggleButton id="yearly">Yearly</ToggleButton>
        </ToggleButtonGroup>
      </header>

      <div className={styles.grid}>
        {PLANS.map((plan) => {
          const price = billing === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12);

          return (
            <Card
              key={plan.id}
              variant={plan.recommended ? 'feature' : 'default'}
              className={styles.card}
            >
              <CardHeader>
                <CardTitle level={2}>{plan.name}</CardTitle>
                <CardDescription>{plan.summary}</CardDescription>
                {plan.recommended && (
                  <CardAction>
                    <Badge tone="brand" variant="solid" icon={<IconStar aria-hidden />}>
                      Recommended
                    </Badge>
                  </CardAction>
                )}
              </CardHeader>

              <CardContent className={styles.cardContent}>
                <div className={styles.priceRow}>
                  <Amount value={price} currency={CURRENCY} size="lg" />
                  <span className={styles.pricePeriod}>/mo</span>
                </div>
                <p className={styles.priceCaption}>
                  {billing === 'monthly' ? 'Billed monthly' : 'Billed annually'}
                </p>

                <ul className={styles.featureList} aria-label={`${plan.name} features`}>
                  {FEATURE_NAMES.map((name, index) => {
                    const included = plan.features[index];
                    return (
                      <li key={name} className={styles.featureItem}>
                        {included ? (
                          <IconCheck aria-hidden className={styles.iconIncluded} />
                        ) : (
                          <IconX aria-hidden className={styles.iconExcluded} />
                        )}
                        <span className={included ? undefined : styles.textExcluded}>
                          {name}
                          {!included && <span className={styles.visuallyHidden}> (not included)</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  variant={plan.recommended ? 'primary' : 'outline'}
                  className={styles.choiceButton}
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
