import { useMemo, useState } from 'react';
import { useLocale } from 'react-aria-components';
import {
  Amount,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  IconTile,
  Link,
  Radio,
  RadioGroup,
  Separator,
  Tag,
  TextField,
} from '@strata/react';
import { IconMapPin, IconPlus, IconX } from '@strata/icons';
import styles from './Screen.module.css';

const CURRENCY = 'INR';

const address = {
  name: 'Aditi Rao',
  line1: '204, Silver Oak Residency, 12th Cross Road',
  line2: 'Indiranagar, Bengaluru 560038',
  phone: '+91 98765 43210',
};

const slots = [
  { id: 'today-evening', label: 'Today, 4:00 – 6:00 PM', fee: 0 },
  { id: 'today-night', label: 'Today, 7:00 – 9:00 PM', fee: 0 },
  { id: 'tomorrow-morning', label: 'Tomorrow, 8:00 – 10:00 AM', fee: 29 },
] as const;

interface LineItem {
  id: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
  emoji: string;
}

const initialItems: LineItem[] = [
  { id: 'bananas', name: 'Robusta bananas', unit: '1 kg', price: 49, qty: 2, emoji: '🍌' },
  { id: 'milk', name: 'Toned milk', unit: '1 L, pack of 2', price: 68, qty: 1, emoji: '🥛' },
  { id: 'eggs', name: 'Brown eggs', unit: 'Tray of 12', price: 119, qty: 1, emoji: '🥚' },
  { id: 'bread', name: 'Multigrain bread', unit: '400 g loaf', price: 55, qty: 2, emoji: '🍞' },
  { id: 'tomatoes', name: 'Local tomatoes', unit: '1 kg', price: 38, qty: 1, emoji: '🍅' },
];

const promoCodes: Record<string, number> = {
  FRESH50: 50,
  WELCOME10: 10,
};

const MIN_QTY = 1;
const MAX_QTY = 9;

export default function Screen() {
  const { locale } = useLocale();
  const [items, setItems] = useState(initialItems);
  const [slotId, setSlotId] = useState<string>(slots[0].id);
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<{ code: string; amount: number } | null>({
    code: 'FRESH50',
    amount: 50,
  });
  const [promoError, setPromoError] = useState(false);

  const changeQty = (id: string, delta: number) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, qty: Math.min(MAX_QTY, Math.max(MIN_QTY, item.qty + delta)) }
          : item,
      ),
    );
  };

  const slot = slots.find((s) => s.id === slotId) ?? slots[0];
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.qty, 0), [items]);
  const discount = promo?.amount ?? 0;
  const total = Math.max(0, subtotal + slot.fee - discount);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 }).format(
      value,
    );

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    const amount = promoCodes[code];
    if (amount) {
      setPromo({ code, amount });
      setPromoInput('');
      setPromoError(false);
    } else {
      setPromoError(true);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Checkout</h1>
        <p className={styles.subtitle}>Review your order before you place it</p>
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          <Card variant="outline" className={styles.card}>
            <CardHeader className={styles.addressHeader}>
              <div className={styles.addressMain}>
                <IconTile tint="brand" size="md">
                  <IconMapPin />
                </IconTile>
                <div className={styles.addressText}>
                  <CardTitle level={2} className={styles.cardTitle}>
                    Delivering to {address.name}
                  </CardTitle>
                  <p className={styles.addressLine}>{address.line1}</p>
                  <p className={styles.addressLine}>{address.line2}</p>
                  <p className={styles.addressLine}>{address.phone}</p>
                </div>
              </div>
              <CardAction>
                <Link variant="standalone" href="#">
                  Change
                </Link>
              </CardAction>
            </CardHeader>
          </Card>

          <Card variant="outline" className={styles.card}>
            <CardHeader>
              <CardTitle level={2} className={styles.cardTitle}>
                Delivery slot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                aria-label="Delivery slot"
                variant="card"
                value={slotId}
                onChange={setSlotId}
                orientation="horizontal"
                className={styles.slotGroup}
              >
                {slots.map((s) => (
                  <Radio
                    key={s.id}
                    value={s.id}
                    description={s.fee === 0 ? 'Free delivery' : `${formatPrice(s.fee)} delivery fee`}
                  >
                    {s.label}
                  </Radio>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card variant="outline" className={styles.card}>
            <CardHeader>
              <CardTitle level={2} className={styles.cardTitle}>
                Items · {items.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className={styles.itemList}>
                {items.map((item) => (
                  <li key={item.id} className={styles.item}>
                    <span className={styles.itemThumb} aria-hidden="true">
                      {item.emoji}
                    </span>
                    <div className={styles.itemInfo}>
                      <p className={styles.itemName}>{item.name}</p>
                      <p className={styles.itemMeta}>
                        {item.unit} · {formatPrice(item.price)} each
                      </p>
                    </div>
                    <div className={styles.stepper}>
                      <Button
                        variant="outline"
                        size="icon"
                        className={styles.stepperButton}
                        aria-label={`Decrease quantity of ${item.name}`}
                        isDisabled={item.qty <= MIN_QTY}
                        onPress={() => changeQty(item.id, -1)}
                      >
                        <span aria-hidden="true">−</span>
                      </Button>
                      <span className={styles.stepperValue}>{item.qty}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className={styles.stepperButton}
                        aria-label={`Increase quantity of ${item.name}`}
                        isDisabled={item.qty >= MAX_QTY}
                        onPress={() => changeQty(item.id, 1)}
                      >
                        <IconPlus />
                      </Button>
                    </div>
                    <p className={styles.itemTotal}>{formatPrice(item.price * item.qty)}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card variant="outline" className={styles.card}>
            <CardHeader>
              <CardTitle level={2} className={styles.cardTitle}>
                Promo code
              </CardTitle>
            </CardHeader>
            <CardContent>
              {promo && (
                <Tag tone="success" className={styles.promoTag}>
                  <span className={styles.promoTagText}>
                    {promo.code} applied · −{formatPrice(promo.amount)}
                  </span>
                  <button
                    type="button"
                    className={styles.promoRemove}
                    aria-label={`Remove promo code ${promo.code}`}
                    onClick={() => setPromo(null)}
                  >
                    <IconX size={14} />
                  </button>
                </Tag>
              )}
              <div className={styles.promoRow}>
                <TextField
                  aria-label="Promo code"
                  placeholder="Enter promo code"
                  value={promoInput}
                  onChange={(value) => {
                    setPromoInput(value);
                    setPromoError(false);
                  }}
                  errorMessage={promoError ? 'That code isn’t valid.' : undefined}
                  isInvalid={promoError}
                  className={styles.promoField}
                />
                <Button variant="secondary" onPress={applyPromo} isDisabled={!promoInput.trim()}>
                  Apply
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className={styles.summaryColumn}>
          <Card variant="default" rim className={styles.summaryCard}>
            <CardHeader>
              <CardTitle level={2} className={styles.cardTitle}>
                Order summary
              </CardTitle>
            </CardHeader>
            <CardContent className={styles.summaryContent}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Delivery</span>
                <span>{slot.fee === 0 ? 'Free' : formatPrice(slot.fee)}</span>
              </div>
              {promo && (
                <div className={styles.summaryRow}>
                  <span>Discount · {promo.code}</span>
                  <span className={styles.discountValue}>−{formatPrice(promo.amount)}</span>
                </div>
              )}
              <Separator className={styles.summarySeparator} />
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total</span>
                <Amount value={total} currency={CURRENCY} locale={locale} size="sm" tone="brand" />
              </div>
              {slot.fee === 0 && (
                <Badge tone="success" variant="soft" size="sm" className={styles.freeBadge}>
                  Free delivery included
                </Badge>
              )}
            </CardContent>
            <CardFooter divider>
              <Button variant="primary" size="lg" className={styles.placeOrder}>
                Place order
              </Button>
            </CardFooter>
          </Card>
        </aside>
      </div>
    </div>
  );
}
