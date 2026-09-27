import { useState } from 'react';
import {
  Alert,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Slider,
  Switch,
} from '@strata/react';
import { IconCreditCard, IconSnowflake, IconWifi, IconWorld } from '@strata/icons';
import styles from './Screen.module.css';

// Mock data — no backend.
const card = {
  holder: 'Anuj Patel',
  nickname: 'Everyday debit card',
  last4: '4821',
  network: 'Visa',
};

const DAILY_LIMIT_MIN = 0;
const DAILY_LIMIT_MAX = 20000;
const DAILY_LIMIT_STEP = 500;
const DAILY_LIMIT_CURRENCY = 'INR';

export default function Screen() {
  const [frozen, setFrozen] = useState(false);
  const [onlinePayments, setOnlinePayments] = useState(true);
  const [contactless, setContactless] = useState(true);
  const [international, setInternational] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(7500);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Card controls</h1>
        <p className={styles.pageSubtitle}>Manage how this card can be used.</p>
      </header>

      <div
        className={styles.cardVisual}
        data-frozen={frozen || undefined}
        aria-label={`${card.network} debit card ending in ${card.last4}, ${frozen ? 'frozen' : 'active'}`}
      >
        <div className={styles.cardVisualTop}>
          <span className={styles.cardNetwork}>{card.network}</span>
          <Badge tone={frozen ? 'neutral' : 'success'} variant="status" dot>
            {frozen ? 'Frozen' : 'Active'}
          </Badge>
        </div>
        <span className={styles.cardChip} aria-hidden="true" />
        <p className={styles.cardNumber}>•••• •••• •••• {card.last4}</p>
        <div className={styles.cardVisualBottom}>
          <span className={styles.cardHolder}>{card.holder}</span>
          <span className={styles.cardNickname}>{card.nickname}</span>
        </div>
        {frozen && (
          <div className={styles.frozenOverlay}>
            <IconSnowflake aria-hidden />
            <span>Frozen</span>
          </div>
        )}
      </div>

      <Card className={styles.controlsCard}>
        <CardHeader divider>
          <CardTitle level={2}>Card controls</CardTitle>
          <CardDescription>Turn features on or off, or freeze the card entirely.</CardDescription>
        </CardHeader>
        <CardContent className={styles.content}>
          <Switch
            isSelected={frozen}
            onChange={setFrozen}
            description="Instantly blocks all new transactions until you unfreeze it."
          >
            <span className={styles.switchLabel}>
              <IconSnowflake aria-hidden />
              Freeze card
            </span>
          </Switch>

          {frozen && (
            <Alert tone="warning" title="This card is frozen" icon={<IconSnowflake aria-hidden />}>
              Payment types and the daily spending limit are locked while the card is frozen.
              Unfreeze it to change them.
            </Alert>
          )}

          <Separator />

          <fieldset className={styles.fieldset} disabled={frozen}>
            <legend className={styles.legend}>Payment types</legend>

            <Switch
              isSelected={onlinePayments}
              onChange={setOnlinePayments}
              isDisabled={frozen}
              description="Use this card for online and in-app purchases."
            >
              <span className={styles.switchLabel}>
                <IconCreditCard aria-hidden />
                Online payments
              </span>
            </Switch>

            <Switch
              isSelected={contactless}
              onChange={setContactless}
              isDisabled={frozen}
              description="Tap to pay in shops, restaurants and on transit."
            >
              <span className={styles.switchLabel}>
                <IconWifi aria-hidden />
                Contactless
              </span>
            </Switch>

            <Switch
              isSelected={international}
              onChange={setInternational}
              isDisabled={frozen}
              description="Allow purchases and withdrawals outside your home country."
            >
              <span className={styles.switchLabel}>
                <IconWorld aria-hidden />
                International use
              </span>
            </Switch>
          </fieldset>

          <Separator />

          <div className={styles.limitSection}>
            <Slider
              className={styles.slider}
              label="Daily spending limit"
              showOutput
              value={dailyLimit}
              onChange={setDailyLimit}
              minValue={DAILY_LIMIT_MIN}
              maxValue={DAILY_LIMIT_MAX}
              step={DAILY_LIMIT_STEP}
              isDisabled={frozen}
              formatOptions={{
                style: 'currency',
                currency: DAILY_LIMIT_CURRENCY,
                maximumFractionDigits: 0,
              }}
            />
            <p className={styles.limitHint}>Applies to purchases and cash withdrawals combined.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
