'use client';

import { useId, useState } from 'react';
import {
  Alert,
  Badge,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  IconTile,
  Separator,
  Slider,
  Switch,
} from '@strata/react';
import { IconCreditCard, IconLock } from '@strata/icons';
import styles from './Screen.module.css';

const card = {
  name: 'Everyday Debit Card',
  last4: '4821',
};

const initialControls = {
  frozen: false,
  onlinePayments: true,
  contactless: true,
  international: false,
  dailyLimit: 15000,
};

const DAILY_LIMIT_MIN = 1000;
const DAILY_LIMIT_MAX = 50000;
const DAILY_LIMIT_STEP = 500;

export default function Screen() {
  const uid = useId();
  const [frozen, setFrozen] = useState(initialControls.frozen);
  const [onlinePayments, setOnlinePayments] = useState(initialControls.onlinePayments);
  const [contactless, setContactless] = useState(initialControls.contactless);
  const [international, setInternational] = useState(initialControls.international);
  const [dailyLimit, setDailyLimit] = useState(initialControls.dailyLimit);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Card controls</h1>
        <p className={styles.description}>Manage how your debit card can be used.</p>
      </div>

      <Card>
        <CardHeader>
          <div className={styles.cardIdentity}>
            <IconTile tint="brand">
              <IconCreditCard aria-hidden />
            </IconTile>
            <div className={styles.cardIdentityText}>
              <CardTitle level={2}>{card.name}</CardTitle>
              <CardDescription className={styles.cardNumber}>•••• •••• •••• {card.last4}</CardDescription>
            </div>
          </div>
          <CardAction>
            <Badge tone={frozen ? 'warning' : 'success'} variant="soft" dot>
              {frozen ? 'Frozen' : 'Active'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className={styles.freezeRow}>
          <Switch
            isSelected={frozen}
            onChange={setFrozen}
            description="Blocks all payments and the controls below until you unfreeze it."
          >
            Freeze card
          </Switch>
        </CardContent>
      </Card>

      <Card>
        <CardHeader divider>
          <CardTitle level={2}>Payment controls</CardTitle>
        </CardHeader>
        <CardContent className={styles.controlsBody}>
          {frozen && (
            <Alert tone="warning" icon={<IconLock aria-hidden />} title="Card is frozen">
              Unfreeze the card to change the settings below.
            </Alert>
          )}

          <div className={styles.switches}>
            <Switch
              isSelected={onlinePayments}
              onChange={setOnlinePayments}
              isDisabled={frozen}
              description="Allow purchases on websites and in apps."
            >
              Online payments
            </Switch>
            <Switch
              isSelected={contactless}
              onChange={setContactless}
              isDisabled={frozen}
              description="Allow tap-to-pay at terminals and readers."
            >
              Contactless payments
            </Switch>
            <Switch
              isSelected={international}
              onChange={setInternational}
              isDisabled={frozen}
              description="Allow purchases and withdrawals outside your home country."
            >
              International use
            </Switch>
          </div>

          <Separator />

          <div className={styles.limitRow}>
            <Slider
              label="Daily spending limit"
              value={dailyLimit}
              onChange={(value) => setDailyLimit(Array.isArray(value) ? value[0] : value)}
              minValue={DAILY_LIMIT_MIN}
              maxValue={DAILY_LIMIT_MAX}
              step={DAILY_LIMIT_STEP}
              isDisabled={frozen}
              formatOptions={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }}
              aria-describedby={`${uid}-limit-hint`}
            />
            <p id={`${uid}-limit-hint`} className={styles.limitHint}>
              The most this card can spend in one day, across every payment type above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
