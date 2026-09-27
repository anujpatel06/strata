import { useId, useState } from 'react';
import styles from './Screen.module.css';

// Mock data — no backend.
const CARD = {
  name: 'Everyday Debit Card',
  last4: '4821',
};

const DAILY_LIMIT_MIN = 0;
const DAILY_LIMIT_MAX = 5000;
const DAILY_LIMIT_STEP = 50;

function formatCurrency(amount: number) {
  return amount.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={styles.switch}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.switchThumb} />
    </button>
  );
}

function ControlRow({
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled: boolean;
}) {
  const descriptionId = useId();
  return (
    <div className={styles.controlRow}>
      <div className={styles.controlText}>
        <span className={styles.controlLabel}>{title}</span>
        <span id={descriptionId} className={styles.controlDescription}>
          {description}
        </span>
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} label={title} />
    </div>
  );
}

export default function Screen() {
  const [frozen, setFrozen] = useState(false);
  const [onlinePayments, setOnlinePayments] = useState(true);
  const [contactless, setContactless] = useState(true);
  const [international, setInternational] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(500);

  const limitLabelId = useId();

  return (
    <div className={styles.screen}>
      <div className={styles.cardVisual}>
        <span className={styles.cardNetwork}>Debit card</span>
        <span className={styles.cardName}>{CARD.name}</span>
        <span className={styles.cardNumber}>•••• •••• •••• {CARD.last4}</span>
      </div>

      <section className={styles.freezeSection}>
        <div className={styles.controlText}>
          <h2 className={styles.sectionHeading}>Freeze card</h2>
          <p className={styles.controlDescription}>
            Instantly block new purchases, payments and withdrawals.
          </p>
        </div>
        <Switch checked={frozen} onChange={setFrozen} label="Freeze card" />
      </section>

      {frozen && (
        <p className={styles.frozenNotice} role="status">
          Your card is frozen. The controls below don&rsquo;t apply until you unfreeze it.
        </p>
      )}

      <section className={styles.controlsSection} aria-disabled={frozen}>
        <h2 className={styles.sectionHeading}>Card controls</h2>

        <ControlRow
          title="Online payments"
          description="Allow purchases on websites and apps."
          checked={onlinePayments}
          onChange={setOnlinePayments}
          disabled={frozen}
        />
        <ControlRow
          title="Contactless"
          description="Allow tap-to-pay at terminals."
          checked={contactless}
          onChange={setContactless}
          disabled={frozen}
        />
        <ControlRow
          title="International use"
          description="Allow transactions outside your home country."
          checked={international}
          onChange={setInternational}
          disabled={frozen}
        />

        <div className={styles.limitRow}>
          <div className={styles.limitLabelRow}>
            <span id={limitLabelId} className={styles.controlLabel}>
              Daily spending limit
            </span>
            <span className={styles.limitValue}>{formatCurrency(dailyLimit)}</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            aria-labelledby={limitLabelId}
            min={DAILY_LIMIT_MIN}
            max={DAILY_LIMIT_MAX}
            step={DAILY_LIMIT_STEP}
            value={dailyLimit}
            disabled={frozen}
            onChange={(event) => setDailyLimit(Number(event.target.value))}
          />
          <div className={styles.limitBounds}>
            <span>{formatCurrency(DAILY_LIMIT_MIN)}</span>
            <span>{formatCurrency(DAILY_LIMIT_MAX)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
