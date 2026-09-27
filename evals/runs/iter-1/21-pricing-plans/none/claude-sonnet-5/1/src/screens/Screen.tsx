import { useId, useState } from 'react';
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

type BillingCycle = 'monthly' | 'yearly';

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    summary: 'For individuals getting a project off the ground.',
    monthlyPrice: 9,
    yearlyPrice: 90,
    features: [
      { label: 'Unlimited projects', included: false },
      { label: 'Advanced analytics', included: false },
      { label: 'Priority support', included: false },
      { label: 'Custom domains', included: false },
      { label: 'Team roles & permissions', included: false },
      { label: 'API access', included: true },
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
      { label: 'Advanced analytics', included: true },
      { label: 'Priority support', included: true },
      { label: 'Custom domains', included: true },
      { label: 'Team roles & permissions', included: false },
      { label: 'API access', included: true },
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    summary: 'For organizations that need full control at scale.',
    monthlyPrice: 79,
    yearlyPrice: 790,
    features: [
      { label: 'Unlimited projects', included: true },
      { label: 'Advanced analytics', included: true },
      { label: 'Priority support', included: true },
      { label: 'Custom domains', included: true },
      { label: 'Team roles & permissions', included: true },
      { label: 'API access', included: true },
    ],
  },
];

function CheckIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="10" className={styles.iconIncludedBg} />
      <path
        d="M6 10.2l2.6 2.6L14.2 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DashIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="10" className={styles.iconExcludedBg} />
      <line x1="6.5" y1="10" x2="13.5" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Screen() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const groupId = useId();

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.title}>Choose your plan</h1>
        <p className={styles.subtitle}>Compare features across plans and pick what fits your team.</p>

        <div className={styles.billingToggle} role="radiogroup" aria-label="Billing cycle">
          <label className={styles.billingOption}>
            <input
              type="radio"
              name={`${groupId}-billing`}
              value="monthly"
              checked={billingCycle === 'monthly'}
              onChange={() => setBillingCycle('monthly')}
              className={styles.billingInput}
            />
            <span>Monthly</span>
          </label>
          <label className={styles.billingOption}>
            <input
              type="radio"
              name={`${groupId}-billing`}
              value="yearly"
              checked={billingCycle === 'yearly'}
              onChange={() => setBillingCycle('yearly')}
              className={styles.billingInput}
            />
            <span>Yearly</span>
            <span className={styles.savingsBadge}>Save ~17%</span>
          </label>
        </div>
      </header>

      <div className={styles.grid}>
        {plans.map((plan) => {
          const monthlyEquivalent =
            billingCycle === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12);

          return (
            <article
              key={plan.id}
              className={plan.recommended ? `${styles.card} ${styles.cardRecommended}` : styles.card}
              aria-label={plan.recommended ? `${plan.name} (recommended)` : plan.name}
            >
              {plan.recommended && <span className={styles.badge}>Recommended</span>}

              <h2 className={styles.planName}>{plan.name}</h2>
              <p className={styles.planSummary}>{plan.summary}</p>

              <div className={styles.price}>
                <span className={styles.priceValue}>{formatPrice(monthlyEquivalent)}</span>
                <span className={styles.priceUnit}>/mo</span>
              </div>
              <p className={styles.priceNote}>
                {billingCycle === 'yearly'
                  ? `Billed ${formatPrice(plan.yearlyPrice)} per year`
                  : 'Billed monthly'}
              </p>

              <ul className={styles.featureList}>
                {plan.features.map((feature) => (
                  <li
                    key={feature.label}
                    className={feature.included ? styles.featureIncluded : styles.featureExcluded}
                  >
                    {feature.included ? <CheckIcon /> : <DashIcon />}
                    <span>{feature.label}</span>
                    <span className={styles.srOnly}>{feature.included ? ' (included)' : ' (not included)'}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
