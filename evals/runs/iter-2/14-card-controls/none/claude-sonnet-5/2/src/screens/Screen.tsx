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
  nickname: 'Everyday Debit Card',
  network: 'Visa Debit',
  last4: '4821',
};

const DAILY_LIMIT_MIN = 0;
const DAILY_LIMIT_MAX = 50000;
const DAILY_LIMIT_STEP = 1000;
const DAILY_LIMIT_CURRENCY = 'INR';

export default function Screen() {
  const [frozen, setFrozen] = useState(false);
  const [onlinePayments, setOnlinePayments] = useState(true);
  const [contactless, setContactless] = useState(true);
  const [international, setInternational] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(15000);

  return (
    <div className={styles.screen}>
      <Card rim className={styles.card}>
        <CardHeader divider className={styles.header}>
          <div className={styles.identity}>
            <IconTile size="lg" tint={frozen ? 'none' : 'solid'} alt="">
              <IconCreditCard />
            </IconTile>
            <div>
              <CardTitle level={1}>{card.nickname}</CardTitle>
              <CardDescription>
                {card.network} · •••• {card.last4}
              </CardDescription>
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
            <div className={styles.rowText}>
              <IconTile size="sm" tint={frozen ? 'info' : 'none'} alt="">
                <IconSnowflake />
              </IconTile>
              <div>
                <p className={styles.rowLabel}>Freeze card</p>
                <p className={styles.rowDescription}>
                  Instantly blocks new purchases, withdrawals and payments. Unfreeze any time.
                </p>
              </div>
            </div>
            <Switch aria-label="Freeze card" isSelected={frozen} onChange={setFrozen} className={styles.switch} />
          </div>

          {frozen && (
            <Alert tone="info" title="This card is frozen" className={styles.alert}>
              The controls below won't apply until you unfreeze it.
            </Alert>
          )}

          <Separator />

          <div className={styles.group} data-disabled={frozen || undefined}>
            <div className={styles.row}>
              <div className={styles.rowText}>
                <IconTile size="sm" tint="none" alt="">
                  <IconShoppingCart />
                </IconTile>
                <div>
                  <p className={styles.rowLabel}>Online payments</p>
                  <p className={styles.rowDescription}>Use this card for online and in-app purchases.</p>
                </div>
              </div>
              <Switch
                aria-label="Online payments"
                isSelected={onlinePayments}
                onChange={setOnlinePayments}
                isDisabled={frozen}
                className={styles.switch}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.rowText}>
                <IconTile size="sm" tint="none" alt="">
                  <IconWifi />
                </IconTile>
                <div>
                  <p className={styles.rowLabel}>Contactless</p>
                  <p className={styles.rowDescription}>Tap to pay in shops without a PIN.</p>
                </div>
              </div>
              <Switch
                aria-label="Contactless"
                isSelected={contactless}
                onChange={setContactless}
                isDisabled={frozen}
                className={styles.switch}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.rowText}>
                <IconTile size="sm" tint="none" alt="">
                  <IconWorld />
                </IconTile>
                <div>
                  <p className={styles.rowLabel}>International use</p>
                  <p className={styles.rowDescription}>Allow purchases and withdrawals outside your home country.</p>
                </div>
              </div>
              <Switch
                aria-label="International use"
                isSelected={international}
                onChange={setInternational}
                isDisabled={frozen}
                className={styles.switch}
              />
            </div>
          </div>

          <Separator />

          <div className={styles.limit} data-disabled={frozen || undefined}>
            <Slider
              label="Daily spending limit"
              showOutput
              minValue={DAILY_LIMIT_MIN}
              maxValue={DAILY_LIMIT_MAX}
              step={DAILY_LIMIT_STEP}
              value={dailyLimit}
              onChange={setDailyLimit}
              isDisabled={frozen}
              formatOptions={{ style: 'currency', currency: DAILY_LIMIT_CURRENCY, maximumFractionDigits: 0 }}
            />
            <p className={styles.limitHint}>The most you can spend on purchases and withdrawals in a day.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
