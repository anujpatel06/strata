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
import { IconCreditCard } from '@strata/icons';
import styles from './Screen.module.css';

const card = {
  holder: 'Anuj Patel',
  network: 'Visa Debit',
  last4: '4821',
};

const limitRange = { min: 1000, max: 50000, step: 500 };

export default function Screen() {
  const [isFrozen, setIsFrozen] = useState(false);
  const [onlinePayments, setOnlinePayments] = useState(true);
  const [contactless, setContactless] = useState(true);
  const [international, setInternational] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(15000);

  return (
    <div className={styles.page}>
      <Card className={styles.card} rim>
        <CardHeader>
          <div className={styles.identity}>
            <IconTile tint="solid">
              <IconCreditCard />
            </IconTile>
            <div className={styles.identityText}>
              <CardTitle>{card.holder}</CardTitle>
              <CardDescription>
                {card.network} {'••••'} {card.last4}
              </CardDescription>
            </div>
          </div>
          <CardAction>
            <Badge variant="status" tone={isFrozen ? 'neutral' : 'success'}>
              {isFrozen ? 'Frozen' : 'Active'}
            </Badge>
          </CardAction>
        </CardHeader>

        <CardContent className={styles.content}>
          {isFrozen ? (
            <Alert tone="warning" title="Card frozen">
              Online payments, contactless and international use are turned off and can&apos;t be changed until you
              unfreeze the card. Your daily limit stays saved.
            </Alert>
          ) : null}

          <Switch
            isSelected={isFrozen}
            onChange={setIsFrozen}
            description="Blocks every payment on this card until you unfreeze it."
          >
            Freeze card
          </Switch>

          <Separator />

          <div className={styles.controls}>
            <Switch
              isSelected={onlinePayments}
              onChange={setOnlinePayments}
              isDisabled={isFrozen}
              description="Use this card for purchases on websites and apps."
            >
              Online payments
            </Switch>
            <Switch
              isSelected={contactless}
              onChange={setContactless}
              isDisabled={isFrozen}
              description="Tap to pay in shops without inserting the card."
            >
              Contactless
            </Switch>
            <Switch
              isSelected={international}
              onChange={setInternational}
              isDisabled={isFrozen}
              description="Allow payments made outside your home country."
            >
              International use
            </Switch>
          </div>

          <Separator />

          <Slider
            label="Daily spending limit"
            value={dailyLimit}
            onChange={(value) => setDailyLimit(value as number)}
            minValue={limitRange.min}
            maxValue={limitRange.max}
            step={limitRange.step}
            isDisabled={isFrozen}
            formatOptions={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
