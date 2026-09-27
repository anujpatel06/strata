import { useId, useState, type ReactNode } from 'react';
import styles from './Screen.module.css';

// Mock data - stands in for the account/card service.
const CARD = {
  name: 'Everyday Debit Card',
  network: 'Visa',
  last4: '4821',
};

type ControlKey = 'online' | 'contactless' | 'international';

type ControlState = Record<ControlKey, boolean>;

const CONTROL_COPY: Record<ControlKey, { title: string; description: string; icon: ReactNode }> = {
  online: {
    title: 'Online payments',
    description: 'Allow purchases on websites and in apps.',
    icon: <IconGlobe />,
  },
  contactless: {
    title: 'Contactless',
    description: 'Allow tap-to-pay at card terminals.',
    icon: <IconWave />,
  },
  international: {
    title: 'International use',
    description: 'Allow transactions outside your home country.',
    icon: <IconPlane />,
  },
};

const MIN_LIMIT = 100;
const MAX_LIMIT = 10000;
const LIMIT_STEP = 100;

export default function Screen() {
  const [frozen, setFrozen] = useState(false);
  const [controls, setControls] = useState<ControlState>({
    online: true,
    contactless: true,
    international: false,
  });
  const [dailyLimit, setDailyLimit] = useState(2500);

  const freezeLabelId = useId();
  const bannerId = useId();

  function toggleControl(key: ControlKey) {
    setControls((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className={styles.screen}>
      <header className={styles.cardHeader}>
        <div className={styles.cardChip} aria-hidden="true">
          <IconChip />
        </div>
        <div>
          <p className={styles.cardNetwork}>{CARD.network} debit</p>
          <h1 className={styles.cardName}>{CARD.name}</h1>
          <p className={styles.cardNumber}>
            <span aria-hidden="true">•••• •••• •••• </span>
            <span>{CARD.last4}</span>
            <span className={styles.srOnly}>, card ending in {CARD.last4}</span>
          </p>
        </div>
      </header>

      <section
        className={`${styles.section} ${styles.freezeSection} ${frozen ? styles.freezeSectionActive : ''}`}
      >
        <div className={styles.controlRow}>
          <div className={styles.controlInfo}>
            <span className={styles.controlIcon} aria-hidden="true">
              <IconSnowflake />
            </span>
            <div>
              <p className={styles.controlTitle} id={freezeLabelId}>
                Freeze card
              </p>
              <p className={styles.controlDescription}>
                {frozen
                  ? 'Your card is frozen. Unfreeze it to use the controls below.'
                  : 'Instantly block all new purchases, payments and withdrawals.'}
              </p>
            </div>
          </div>
          <Switch
            checked={frozen}
            onChange={setFrozen}
            labelledBy={freezeLabelId}
          />
        </div>
      </section>

      {frozen && (
        <p className={styles.frozenBanner} role="status" id={bannerId}>
          Card controls are unavailable while this card is frozen.
        </p>
      )}

      <fieldset
        className={styles.fieldset}
        disabled={frozen}
        aria-describedby={frozen ? bannerId : undefined}
      >
        <legend className={styles.sectionTitle}>Card controls</legend>

        <section className={styles.section}>
          {(Object.keys(CONTROL_COPY) as ControlKey[]).map((key) => (
            <ControlRow
              key={key}
              id={key}
              title={CONTROL_COPY[key].title}
              description={CONTROL_COPY[key].description}
              icon={CONTROL_COPY[key].icon}
              checked={controls[key]}
              onChange={() => toggleControl(key)}
            />
          ))}
        </section>

        <section className={styles.section}>
          <div className={styles.limitHeader}>
            <div>
              <p className={styles.controlTitle} id="daily-limit-label">
                Daily spending limit
              </p>
              <p className={styles.controlDescription}>
                Maximum amount that can be spent per day on this card.
              </p>
            </div>
            <p className={styles.limitValue}>${dailyLimit.toLocaleString('en-US')}</p>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={MIN_LIMIT}
            max={MAX_LIMIT}
            step={LIMIT_STEP}
            value={dailyLimit}
            onChange={(event) => setDailyLimit(Number(event.target.value))}
            aria-labelledby="daily-limit-label"
            aria-valuetext={`$${dailyLimit.toLocaleString('en-US')}`}
          />
          <div className={styles.limitRange} aria-hidden="true">
            <span>${MIN_LIMIT.toLocaleString('en-US')}</span>
            <span>${MAX_LIMIT.toLocaleString('en-US')}</span>
          </div>
        </section>
      </fieldset>
    </div>
  );
}

function ControlRow({
  id,
  title,
  description,
  icon,
  checked,
  onChange,
}: {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  checked: boolean;
  onChange: () => void;
}) {
  const labelId = `${id}-label`;

  return (
    <div className={styles.controlRow}>
      <div className={styles.controlInfo}>
        <span className={styles.controlIcon} aria-hidden="true">
          {icon}
        </span>
        <div>
          <p className={styles.controlTitle} id={labelId}>
            {title}
          </p>
          <p className={styles.controlDescription}>{description}</p>
        </div>
      </div>
      <Switch checked={checked} onChange={onChange} labelledBy={labelId} />
    </div>
  );
}

function Switch({
  checked,
  onChange,
  labelledBy,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  labelledBy: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      data-checked={checked}
      className={styles.switch}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.switchThumb} />
    </button>
  );
}

function IconChip() {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.75" y="0.75" width="26.5" height="18.5" rx="3.25" stroke="currentColor" strokeWidth="1.5" opacity="0.9" />
      <line x1="0.75" y1="7" x2="27.25" y2="7" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <line x1="10" y1="7" x2="10" y2="19.25" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
    </svg>
  );
}

function IconSnowflake() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <line x1="12" y1="2" x2="12" y2="22" />
        <line x1="4.5" y1="6" x2="19.5" y2="18" />
        <line x1="19.5" y1="6" x2="4.5" y2="18" />
        <path d="M12 2 L9.5 4.5 M12 2 L14.5 4.5" />
        <path d="M12 22 L9.5 19.5 M12 22 L14.5 19.5" />
        <path d="M4.5 6 L4.5 9 M4.5 6 L7.2 6" />
        <path d="M19.5 18 L19.5 15 M19.5 18 L16.8 18" />
        <path d="M19.5 6 L19.5 9 M19.5 6 L16.8 6" />
        <path d="M4.5 18 L4.5 15 M4.5 18 L7.2 18" />
      </g>
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
        <line x1="3" y1="12" x2="21" y2="12" />
      </g>
    </svg>
  );
}

function IconWave() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M8.5 10.5a5 5 0 0 1 7 0" />
        <path d="M5.8 7.8a9 9 0 0 1 12.4 0" />
        <circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

function IconPlane() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 13.5 21 6l-6.5 8.5 1 5-3-2.5-1.5 2-1-4.5L3 13.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
