'use client';

import { useState } from 'react';
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
import { IconCreditCard, IconShoppingCart, IconSnowflake, IconWifi, IconWorld } from '@strata/icons';
import styles from './Screen.module.css';

const card = {
  name: 'Everyday Debit Card',
  lastFour: '4821',
};

export default function Screen() {
  const [frozen, setFrozen] = useState(false);
  const [onlinePayments, setOnlinePayments] = useState(true);
  const [contactless, setContactless] = useState(true);
  const [international, setInternational] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(25000);

  const controlsDisabled = frozen;

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <CardHeader divider>
          <div className={styles.identity}>
            <IconTile size="lg">
              <IconCreditCard />
            </IconTile>
            <div>
              <CardTitle>{card.name}</CardTitle>
              <CardDescription>•••• {card.lastFour}</CardDescription>
            </div>
          </div>
          <CardAction>
            <Badge tone={frozen ? 'neutral' : 'success'} variant="status">
              {frozen ? 'Frozen' : 'Active'}
            </Badge>
          </CardAction>
        </CardHeader>

        <CardContent className={styles.content}>
          <div className={styles.row}>
            <IconTile size="sm" tint="none">
              <IconSnowflake />
            </IconTile>
            <Switch
              className={styles.switch}
              isSelected={frozen}
              onChange={setFrozen}
              description="Blocks all spending on this card until you unfreeze it."
            >
              Freeze card
            </Switch>
          </div>

          {frozen ? (
            <Alert tone="warning" title="Card frozen">
              Online payments, contactless, international use and the daily limit don't apply
              while the card is frozen. Unfreeze the card to change them.
            </Alert>
          ) : null}

          <Separator />

          <div className={styles.controls}>
            <div className={styles.row}>
              <IconTile size="sm" tint="none">
                <IconShoppingCart />
              </IconTile>
              <Switch
                className={styles.switch}
                isSelected={onlinePayments}
                onChange={setOnlinePayments}
                isDisabled={controlsDisabled}
                description="Allow purchases on websites and apps."
              >
                Online payments
              </Switch>
            </div>

            <div className={styles.row}>
              <IconTile size="sm" tint="none">
                <IconWifi />
              </IconTile>
              <Switch
                className={styles.switch}
                isSelected={contactless}
                onChange={setContactless}
                isDisabled={controlsDisabled}
                description="Allow tap-to-pay at terminals."
              >
                Contactless
              </Switch>
            </div>

            <div className={styles.row}>
              <IconTile size="sm" tint="none">
                <IconWorld />
              </IconTile>
              <Switch
                className={styles.switch}
                isSelected={international}
                onChange={setInternational}
                isDisabled={controlsDisabled}
                description="Allow payments and withdrawals outside your home country."
              >
                International use
              </Switch>
            </div>
          </div>

          <Separator />

          <div className={styles.limit}>
            <Slider
              label="Daily spending limit"
              value={dailyLimit}
              onChange={(value) => setDailyLimit(Array.isArray(value) ? value[0] : value)}
              minValue={1000}
              maxValue={100000}
              step={1000}
              isDisabled={controlsDisabled}
              formatOptions={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
