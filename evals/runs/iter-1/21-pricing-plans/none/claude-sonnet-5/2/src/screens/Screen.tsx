import { useState } from 'react';
import styles from './Screen.module.css';

type BillingCycle = 'monthly' | 'yearly';

interface Plan {
  id: string;
  name: string;
  summary: string;
  monthlyPrice: number;
  yearlyPrice: number;
  recommended: boolean;
  /** true/false for each entry in FEATURES, in order */
  features: boolean[];
}

const CURRENCY = '$';

const FEATURES: string[] = [
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
    summary: 'For individuals getting a new project off the ground.',
    monthlyPrice: 9,
    yearlyPrice: 90,
    recommended: false,
    features: [true, true, false, false, false, false],
  },
  {
    id: 'growth',
    name: 'Growth',
    summary: 'For growing teams that need more power and support.',
    monthlyPrice: 29,
    yearlyPrice: 290,
    recommended: true,
    features: [true, true, true, true, false, false],
  },
  {
    id: 'scale',
    name: 'Scale',
    summary: 'For organizations that need everything, everywhere.',
    monthlyPrice: 79,
    yearlyPrice: 790,
    recommended: false,
    features: [true, true, true, true, true, true],
  },
];

function formatPrice(amount: number): string {
  return `${CURRENCY}${amount.toLocaleString('en-US')}`;
}

function CheckIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M4 10.5 8 14.5 16 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DashIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M5 10h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Screen() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Compare plans</h1>
        <p className={styles.subtitle}>Choose the plan that fits your team. Switch to yearly billing and save.</p>

        <div className={styles.toggle} role="group" aria-label="Billing period">
          <button
            type="button"
            className={styles.toggleButton}
            aria-pressed={billingCycle === 'monthly'}
            data-active={billingCycle === 'monthly'}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button
            type="button"
            className={styles.toggleButton}
            aria-pressed={billingCycle === 'yearly'}
            data-active={billingCycle === 'yearly'}
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        {PLANS.map((plan) => {
          const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
          const perMonthEquivalent = Math.round((plan.yearlyPrice / 12) * 100) / 100;

          return (
            <article
              key={plan.id}
              className={styles.card}
              data-recommended={plan.recommended}
              aria-label={plan.recommended ? `${plan.name} plan, recommended` : `${plan.name} plan`}
            >
              {plan.recommended && <p className={styles.badge}>Recommended</p>}

              <h2 className={styles.planName}>{plan.name}</h2>
              <p className={styles.summary}>{plan.summary}</p>

              <div className={styles.priceRow}>
                <span className={styles.price}>{formatPrice(price)}</span>
                <span className={styles.period}>{billingCycle === 'monthly' ? '/month' : '/year'}</span>
              </div>
              <p className={styles.priceNote}>
                {billingCycle === 'monthly'
                  ? 'Billed monthly'
                  : `Equivalent to ${formatPrice(perMonthEquivalent)}/month, billed yearly`}
              </p>

              <button type="button" className={styles.cta} data-recommended={plan.recommended}>
                Choose {plan.name}
              </button>

              <ul className={styles.featureList}>
                {FEATURES.map((feature, index) => {
                  const included = plan.features[index];
                  return (
                    <li key={feature} className={styles.featureRow} data-included={included}>
                      {included ? <CheckIcon /> : <DashIcon />}
                      <span className={styles.featureLabel}>{feature}</span>
                      <span className={styles.visuallyHidden}>{included ? 'Included' : 'Not included'}</span>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
