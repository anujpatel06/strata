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

type BillingPeriod = 'monthly' | 'yearly';

interface Feature {
  id: string;
  label: string;
}

interface Plan {
  id: string;
  name: string;
  summary: string;
  monthlyPrice: number;
  recommended?: boolean;
  /** Aligned with FEATURES: whether each feature is included in this plan. */
  included: boolean[];
}

const CURRENCY = 'USD';
const YEARLY_DISCOUNT = 0.2;

const FEATURES: Feature[] = [
  { id: 'projects', label: 'Unlimited projects' },
  { id: 'collaboration', label: 'Team collaboration' },
  { id: 'support', label: 'Priority support' },
  { id: 'analytics', label: 'Advanced analytics' },
  { id: 'integrations', label: 'Custom integrations' },
  { id: 'sso', label: 'SSO & audit logs' },
];

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    summary: 'For individuals and small teams just getting started.',
    monthlyPrice: 15,
    included: [true, false, false, false, false, false],
  },
  {
    id: 'growth',
    name: 'Growth',
    summary: 'For growing teams that need more control and support.',
    monthlyPrice: 39,
    recommended: true,
    included: [true, true, true, true, false, false],
  },
  {
    id: 'scale',
    name: 'Scale',
    summary: 'For organizations that need security, scale and priority support.',
    monthlyPrice: 89,
    included: [true, true, true, true, true, true],
  },
];

function priceFor(plan: Plan, billing: BillingPeriod): number {
  if (billing === 'monthly') return plan.monthlyPrice;
  return Math.round(plan.monthlyPrice * (1 - YEARLY_DISCOUNT));
}

export default function Screen() {
  const [billing, setBilling] = useState<BillingPeriod>('monthly');

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div>
          <Eyebrow>Pricing</Eyebrow>
          <h1 className={styles.title}>Compare plans</h1>
          <p className={styles.subtitle}>
            Pick the plan that fits your team. Switch to yearly billing to save.
          </p>
        </div>
        <div className={styles.billing}>
          <ToggleButtonGroup
            aria-label="Billing period"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([billing])}
            onSelectionChange={(keys) => {
              const [next] = keys;
              if (next === 'monthly' || next === 'yearly') setBilling(next);
            }}
          >
            <ToggleButton id="monthly">Monthly</ToggleButton>
            <ToggleButton id="yearly">Yearly</ToggleButton>
          </ToggleButtonGroup>
          <Badge tone="success" variant="soft" size="sm">
            Save {Math.round(YEARLY_DISCOUNT * 100)}% yearly
          </Badge>
        </div>
      </header>

      <div className={styles.grid}>
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            variant={plan.recommended ? 'feature' : 'outline'}
            rim={!plan.recommended}
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
              <div>
                <div className={styles.priceRow}>
                  <Amount value={priceFor(plan, billing)} currency={CURRENCY} size="lg" />
                  <span className={styles.pricePeriod}>/mo</span>
                </div>
                <p className={styles.priceNote}>
                  {billing === 'yearly' ? 'Billed annually' : 'Billed monthly'}
                </p>
              </div>
              <ul className={styles.features}>
                {FEATURES.map((feature, index) => {
                  const included = plan.included[index];
                  return (
                    <li
                      key={feature.id}
                      className={included ? styles.featureIncluded : styles.featureExcluded}
                    >
                      {included ? <IconCheck /> : <IconX />}
                      <span>
                        <span className={styles.srOnly}>
                          {included ? 'Included: ' : 'Not included: '}
                        </span>
                        {feature.label}
                      </span>
                    </li>
                  );
                })}
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
