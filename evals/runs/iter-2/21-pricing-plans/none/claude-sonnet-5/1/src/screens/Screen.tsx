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
  Tag,
  ToggleButton,
  ToggleButtonGroup,
} from '@strata/react';
import { IconCircleCheck, IconCircleX } from '@strata/icons';
import styles from './Screen.module.css';

type Billing = 'monthly' | 'yearly';

interface PlanFeature {
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
  features: PlanFeature[];
}

const CURRENCY = 'USD';

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    summary: 'For individuals trying things out.',
    monthlyPrice: 9,
    yearlyPrice: 90,
    features: [
      { label: 'Up to 3 projects', included: true },
      { label: 'Basic analytics', included: true },
      { label: 'Community support', included: true },
      { label: 'Custom domains', included: false },
      { label: 'Team roles & permissions', included: false },
      { label: 'Priority support', included: false },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    summary: 'For growing teams that need more room to work.',
    monthlyPrice: 29,
    yearlyPrice: 278,
    recommended: true,
    features: [
      { label: 'Up to 25 projects', included: true },
      { label: 'Advanced analytics', included: true },
      { label: 'Community support', included: true },
      { label: 'Custom domains', included: true },
      { label: 'Team roles & permissions', included: true },
      { label: 'Priority support', included: false },
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    summary: 'For organisations that need it all, without limits.',
    monthlyPrice: 79,
    yearlyPrice: 758,
    features: [
      { label: 'Unlimited projects', included: true },
      { label: 'Advanced analytics', included: true },
      { label: 'Community support', included: true },
      { label: 'Custom domains', included: true },
      { label: 'Team roles & permissions', included: true },
      { label: 'Priority support', included: true },
    ],
  },
];

export default function Screen() {
  const [billing, setBilling] = useState<Billing>('monthly');

  return (
    <div className={styles.screen}>
      <div className={styles.intro}>
        <Eyebrow>Pricing</Eyebrow>
        <h1 className={styles.heading}>Compare plans</h1>
        <p className={styles.subheading}>
          Pick the plan that fits your team. Switch to yearly billing to save.
        </p>
      </div>

      <ToggleButtonGroup
        aria-label="Billing period"
        className={styles.billingToggle}
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[billing]}
        onSelectionChange={(keys) => {
          if (keys === 'all') return;
          const [key] = [...keys];
          if (key) setBilling(key as Billing);
        }}
      >
        <ToggleButton id="monthly">Monthly</ToggleButton>
        <ToggleButton id="yearly">Yearly</ToggleButton>
      </ToggleButtonGroup>

      <div className={styles.grid}>
        {plans.map((plan) => {
          const monthlyEquivalent = billing === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice / 12;
          const savingsPercent = Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100);

          return (
            <Card
              key={plan.id}
              variant={plan.recommended ? 'feature' : 'outline'}
              rim
              className={styles.planCard}
            >
              <CardHeader divider className={styles.planHeader}>
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

              <CardContent className={styles.planContent}>
                <div className={styles.priceBlock}>
                  <div className={styles.priceRow}>
                    <Amount value={monthlyEquivalent} currency={CURRENCY} size="lg" />
                    <span className={styles.pricePeriod}>/month</span>
                  </div>
                  {billing === 'yearly' ? (
                    <Tag tone="success" size="sm" className={styles.savingsTag}>
                      Save {savingsPercent}%, billed yearly
                    </Tag>
                  ) : (
                    <span className={styles.priceNote}>Billed monthly</span>
                  )}
                </div>

                <ul className={styles.featureList}>
                  {plan.features.map((feature) => (
                    <li
                      key={feature.label}
                      className={
                        feature.included
                          ? styles.featureItem
                          : `${styles.featureItem} ${styles.featureItemExcluded}`
                      }
                    >
                      {feature.included ? (
                        <IconCircleCheck className={styles.featureIconIncluded} />
                      ) : (
                        <IconCircleX className={styles.featureIconExcluded} />
                      )}
                      <span>{feature.label}</span>
                    </li>
                  ))}
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
