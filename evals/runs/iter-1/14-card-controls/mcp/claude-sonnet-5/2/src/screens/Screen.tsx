'use client';

import { useState } from 'react';
import { Alert, Badge, Card, CardContent, CardHeader, IconTile, Separator, Slider, Switch } from '@strata/react';
import { IconContactless, IconCreditCard, IconSnowflake, IconWorld } from '@strata/icons';
import styles from './Screen.module.css';

// Mock data: the debit card this screen controls.
const card = {
  name: 'Everyday Debit Card',
  lastFour: '4821',
  network: 'Visa',
};

const DAILY_LIMIT_MIN = 5000;
const DAILY_LIMIT_MAX = 200000;
const DAILY_LIMIT_STEP = 5000;
const DAILY_LIMIT_DEFAULT = 50000;

export default function Screen() {
  const [isFrozen, setIsFrozen] = useState(false);
  const [onlinePayments, setOnlinePayments] = useState(true);
  const [contactless, setContactless] = useState(true);
  const [international, setInternational] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(DAILY_LIMIT_DEFAULT);

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <CardHeader divider className={styles.header}>
          <div className={styles.identity}>
            <IconTile tint="brand" size="lg">
              <IconCreditCard />
            </IconTile>
            <div className={styles.identityText}>
              <span className={styles.cardName}>{card.name}</span>
              <span className={styles.cardMeta}>
                {card.network} · Debit ending in {card.lastFour}
              </span>
            </div>
          </div>
          <Badge tone={isFrozen ? 'danger' : 'success'} variant="soft">
            {isFrozen ? 'Frozen' : 'Active'}
          </Badge>
        </CardHeader>

        <CardContent className={styles.stack}>
          <Switch
            isSelected={isFrozen}
            onChange={setIsFrozen}
            description="Blocks all spending on this card until you unfreeze it."
            className={styles.switch}
          >
            <span className={styles.switchLabel}>
              <IconSnowflake aria-hidden className={styles.switchIcon} />
              Freeze card
            </span>
          </Switch>

          {isFrozen && (
            <Alert tone="warning" title="Card frozen">
              Online payments, contactless, international use and the daily limit below don&apos;t apply while the
              card is frozen. Unfreeze it to change them.
            </Alert>
          )}

          <Separator />

          <div className={styles.stack}>
            <Switch
              isSelected={onlinePayments}
              onChange={setOnlinePayments}
              isDisabled={isFrozen}
              description="Allow purchases on websites and apps."
              className={styles.switch}
            >
              Online payments
            </Switch>
            <Switch
              isSelected={contactless}
              onChange={setContactless}
              isDisabled={isFrozen}
              description="Allow tap-to-pay at terminals."
              className={styles.switch}
            >
              <span className={styles.switchLabel}>
                <IconContactless aria-hidden className={styles.switchIcon} />
                Contactless
              </span>
            </Switch>
            <Switch
              isSelected={international}
              onChange={setInternational}
              isDisabled={isFrozen}
              description="Allow payments outside your home country."
              className={styles.switch}
            >
              <span className={styles.switchLabel}>
                <IconWorld aria-hidden className={styles.switchIcon} />
                International use
              </span>
            </Switch>
          </div>

          <Separator />

          <Slider
            label="Daily spending limit"
            value={dailyLimit}
            onChange={(v) => setDailyLimit(Array.isArray(v) ? v[0] : v)}
            minValue={DAILY_LIMIT_MIN}
            maxValue={DAILY_LIMIT_MAX}
            step={DAILY_LIMIT_STEP}
            isDisabled={isFrozen}
            formatOptions={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }}
            className={styles.slider}
          />
        </CardContent>
      </Card>
    </div>
  );
}
