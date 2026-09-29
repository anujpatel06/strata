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
  Slider,
  Switch,
} from '@syntara/react';
import { IconCreditCard, IconShoppingCart, IconSnowflake, IconWifi, IconWorld } from '@syntara/icons';
import styles from './Screen.module.css';

const card = {
  name: "Anuj's Debit Card",
  lastFour: '4821',
};

export default function Screen() {
  const [isFrozen, setIsFrozen] = useState(false);
  const [onlinePayments, setOnlinePayments] = useState(true);
  const [contactless, setContactless] = useState(true);
  const [international, setInternational] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(25000);

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <CardHeader className={styles.identityHeader}>
          <IconTile tint="brand">
            <IconCreditCard />
          </IconTile>
          <div className={styles.identityText}>
            <CardTitle>{card.name}</CardTitle>
            <CardDescription>Debit card ending {card.lastFour}</CardDescription>
          </div>
          <CardAction>
            <Badge tone={isFrozen ? 'neutral' : 'success'} icon={isFrozen ? <IconSnowflake /> : undefined}>
              {isFrozen ? 'Frozen' : 'Active'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className={styles.freezeRow}>
          <Switch
            isSelected={isFrozen}
            onChange={setIsFrozen}
            description="Blocks all spending on this card until you unfreeze it."
          >
            Freeze card
          </Switch>
        </CardContent>
      </Card>

      {isFrozen ? (
        <Alert tone="warning" title="Card frozen">
          Online payments, contactless, international use and the spending limit don't apply while
          the card is frozen. Unfreeze it to change them.
        </Alert>
      ) : null}

      <Card className={styles.card}>
        <CardHeader>
          <CardTitle level={4}>Card controls</CardTitle>
        </CardHeader>
        <CardContent className={styles.controls}>
          <Switch
            isSelected={onlinePayments}
            onChange={setOnlinePayments}
            isDisabled={isFrozen}
            description="Allow payments on websites and apps."
          >
            <span className={styles.switchLabel}>
              <IconShoppingCart aria-hidden />
              Online payments
            </span>
          </Switch>
          <Switch
            isSelected={contactless}
            onChange={setContactless}
            isDisabled={isFrozen}
            description="Allow tap-to-pay at terminals."
          >
            <span className={styles.switchLabel}>
              <IconWifi aria-hidden />
              Contactless
            </span>
          </Switch>
          <Switch
            isSelected={international}
            onChange={setInternational}
            isDisabled={isFrozen}
            description="Allow payments outside your home country."
          >
            <span className={styles.switchLabel}>
              <IconWorld aria-hidden />
              International use
            </span>
          </Switch>
          <div className={styles.limit}>
            <Slider
              label="Daily spending limit"
              value={dailyLimit}
              onChange={(value) => setDailyLimit(value as number)}
              isDisabled={isFrozen}
              minValue={1000}
              maxValue={100000}
              step={1000}
              formatOptions={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
