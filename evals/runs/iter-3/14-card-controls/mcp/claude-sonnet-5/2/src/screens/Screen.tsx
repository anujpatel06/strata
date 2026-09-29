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
} from '@syntara/react';
import { IconCreditCard, IconShoppingCart, IconSnowflake, IconWifi, IconWorld } from '@syntara/icons';
import styles from './Screen.module.css';

const card = {
  name: 'Everyday Debit Card',
  last4: '4821',
};

export default function Screen() {
  const [isFrozen, setIsFrozen] = useState(false);
  const [onlinePayments, setOnlinePayments] = useState(true);
  const [contactless, setContactless] = useState(true);
  const [international, setInternational] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(25000);

  const noticeId = useId();

  return (
    <div className={styles.screen}>
      <Card className={styles.card}>
        <CardHeader>
          <div className={styles.identity}>
            <IconTile tint={isFrozen ? 'info' : 'brand'}>
              <IconCreditCard />
            </IconTile>
            <div>
              <CardTitle>{card.name}</CardTitle>
              <CardDescription>•••• {card.last4}</CardDescription>
            </div>
          </div>
          <CardAction>
            <Badge variant="status" tone={isFrozen ? 'info' : 'success'} icon={isFrozen ? <IconSnowflake aria-hidden /> : undefined}>
              {isFrozen ? 'Frozen' : 'Active'}
            </Badge>
          </CardAction>
        </CardHeader>

        <CardContent className={styles.content}>
          <div className={styles.controlRow}>
            <IconTile size="sm" tint="none">
              <IconSnowflake />
            </IconTile>
            <Switch
              isSelected={isFrozen}
              onChange={setIsFrozen}
              description="Blocks all card use until you turn it off."
              aria-describedby={isFrozen ? noticeId : undefined}
            >
              Freeze card
            </Switch>
          </div>

          {isFrozen ? (
            <Alert id={noticeId} tone="info" title="Card frozen" live="polite">
              Online payments, contactless, international use and the spending limit don't apply while the card is frozen.
            </Alert>
          ) : null}

          <Separator />

          <div className={styles.controlRow}>
            <IconTile size="sm" tint="none">
              <IconShoppingCart />
            </IconTile>
            <Switch isSelected={onlinePayments} onChange={setOnlinePayments} isDisabled={isFrozen} description="Allow payments on websites and apps.">
              Online payments
            </Switch>
          </div>

          <div className={styles.controlRow}>
            <IconTile size="sm" tint="none">
              <IconWifi />
            </IconTile>
            <Switch isSelected={contactless} onChange={setContactless} isDisabled={isFrozen} description="Allow tap-to-pay at terminals.">
              Contactless
            </Switch>
          </div>

          <div className={styles.controlRow}>
            <IconTile size="sm" tint="none">
              <IconWorld />
            </IconTile>
            <Switch isSelected={international} onChange={setInternational} isDisabled={isFrozen} description="Allow payments outside your home country.">
              International use
            </Switch>
          </div>

          <Separator />

          <Slider
            label="Daily spending limit"
            value={dailyLimit}
            onChange={(value) => setDailyLimit(Array.isArray(value) ? value[0] : value)}
            minValue={5000}
            maxValue={200000}
            step={5000}
            formatOptions={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }}
            isDisabled={isFrozen}
          />
        </CardContent>
      </Card>
    </div>
  );
}
