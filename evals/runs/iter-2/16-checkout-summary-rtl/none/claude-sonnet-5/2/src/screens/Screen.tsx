import { useMemo, useState } from 'react';
import {
  Amount,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Link,
  Radio,
  RadioGroup,
  Separator,
  TextField,
} from '@strata/react';
import {
  createIcon,
  IconClock,
  IconDiscount,
  IconMapPin,
  IconPlus,
  IconShoppingCart,
  IconTruck,
} from '@strata/icons';
import styles from './Screen.module.css';

const IconMinus = createIcon('minus', [['path', { d: 'M5.25 12h13.5' }]]);

const CURRENCY = 'AED';

interface Item {
  id: string;
  name: string;
  detail: string;
  price: number;
  quantity: number;
  emoji: string;
}

const initialItems: Item[] = [
  { id: 'milk', name: 'Full cream milk', detail: '1L carton', price: 7.5, quantity: 2, emoji: '🥛' },
  { id: 'bread', name: 'Sourdough bread', detail: '400g loaf', price: 12, quantity: 1, emoji: '🍞' },
  { id: 'eggs', name: 'Free-range eggs', detail: 'Pack of 12', price: 18.5, quantity: 1, emoji: '🥚' },
  { id: 'apples', name: 'Royal Gala apples', detail: '1kg bag', price: 9.25, quantity: 3, emoji: '🍎' },
  { id: 'oj', name: 'Orange juice', detail: '1.5L bottle', price: 14, quantity: 1, emoji: '🧃' },
];

const slots = [
  { id: 'today-evening', title: 'Today, 6:00 – 8:00 PM', description: 'Fastest slot' },
  { id: 'tomorrow-morning', title: 'Tomorrow, 8:00 – 10:00 AM', description: 'Free delivery' },
  { id: 'tomorrow-evening', title: 'Tomorrow, 6:00 – 8:00 PM', description: 'Most popular' },
];

const DELIVERY_FEE = 6;

export default function Screen() {
  const [items, setItems] = useState(initialItems);
  const [slot, setSlot] = useState(slots[1].id);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; amount: number } | null>({
    code: 'WELCOME10',
    amount: 8.5,
  });

  function setQuantity(id: string, quantity: number) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, quantity } : item)));
  }

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const discount = appliedPromo?.amount ?? 0;
  const total = Math.max(0, subtotal + DELIVERY_FEE - discount);

  function applyPromo() {
    const code = promoCode.trim();
    if (!code) return;
    setAppliedPromo({ code: code.toUpperCase(), amount: 8.5 });
    setPromoCode('');
  }

  function removePromo() {
    setAppliedPromo(null);
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Checkout</h1>
        <p className={styles.subtitle}>Review your order before you place it</p>
      </header>

      <div className={styles.layout}>
        <div className={styles.main}>
          <Card variant="outline" className={styles.card}>
            <CardContent className={styles.addressRow}>
              <span className={styles.addressIcon} aria-hidden>
                <IconMapPin />
              </span>
              <div className={styles.addressText}>
                <p className={styles.addressLabel}>Delivery address</p>
                <p className={styles.addressLine}>Anuj Patel · Apartment 1204, Marina Tower 2</p>
                <p className={styles.addressLine}>Dubai Marina, Dubai, United Arab Emirates</p>
              </div>
              <Link variant="standalone" href="#change-address" className={styles.changeLink}>
                Change
              </Link>
            </CardContent>
          </Card>

          <Card variant="outline" className={styles.card}>
            <CardHeader>
              <CardTitle level={2} className={styles.sectionTitle}>
                <IconClock aria-hidden /> Delivery slot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                aria-label="Delivery slot"
                variant="card"
                value={slot}
                onChange={setSlot}
                className={styles.slotGroup}
              >
                {slots.map((option) => (
                  <Radio key={option.id} value={option.id} description={option.description}>
                    {option.title}
                  </Radio>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card variant="outline" className={styles.card}>
            <CardHeader>
              <CardTitle level={2} className={styles.sectionTitle}>
                <IconShoppingCart aria-hidden /> Items
                <Badge tone="neutral" variant="soft" size="sm" className={styles.itemCountBadge}>
                  {items.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className={styles.itemList}>
              {items.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  <span className={styles.itemEmoji} aria-hidden>
                    {item.emoji}
                  </span>
                  <div className={styles.itemText}>
                    <p className={styles.itemName}>{item.name}</p>
                    <p className={styles.itemDetail}>{item.detail}</p>
                  </div>
                  <Amount value={item.price} currency={CURRENCY} size="sm" className={styles.itemPrice} />
                  <div className={styles.stepper}>
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label={`Decrease quantity of ${item.name}`}
                      onPress={() => setQuantity(item.id, Math.max(1, item.quantity - 1))}
                      isDisabled={item.quantity <= 1}
                    >
                      <IconMinus />
                    </Button>
                    <span className={styles.stepperValue}>{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label={`Increase quantity of ${item.name}`}
                      onPress={() => setQuantity(item.id, item.quantity + 1)}
                    >
                      <IconPlus />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card variant="outline" className={styles.card}>
            <CardHeader>
              <CardTitle level={2} className={styles.sectionTitle}>
                <IconDiscount aria-hidden /> Promo code
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appliedPromo ? (
                <div className={styles.promoApplied}>
                  <Badge tone="success" variant="soft">
                    {appliedPromo.code} applied
                  </Badge>
                  <Button variant="ghost" size="sm" onPress={removePromo}>
                    Remove
                  </Button>
                </div>
              ) : (
                <form
                  className={styles.promoForm}
                  onSubmit={(event) => {
                    event.preventDefault();
                    applyPromo();
                  }}
                >
                  <TextField
                    aria-label="Promo code"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={setPromoCode}
                    className={styles.promoField}
                  />
                  <Button type="submit" variant="secondary" isDisabled={!promoCode.trim()}>
                    Apply
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <Card variant="default" rim className={styles.summary}>
          <CardHeader>
            <CardTitle level={2}>Order summary</CardTitle>
          </CardHeader>
          <CardContent className={styles.summaryRows}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <Amount value={subtotal} currency={CURRENCY} size="sm" symbol="inline" />
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabelWithIcon}>
                <IconTruck aria-hidden /> Delivery
              </span>
              <Amount value={DELIVERY_FEE} currency={CURRENCY} size="sm" symbol="inline" />
            </div>
            {discount > 0 && (
              <div className={styles.summaryRow}>
                <span>Discount</span>
                <Amount
                  value={-discount}
                  currency={CURRENCY}
                  size="sm"
                  symbol="inline"
                  tone="success"
                  formatOptions={{ signDisplay: 'always' }}
                />
              </div>
            )}
            <Separator />
            <div className={styles.summaryRow}>
              <span className={styles.totalLabel}>Total</span>
              <Amount value={total} currency={CURRENCY} size="lg" tone="brand" />
            </div>
          </CardContent>
          <CardFooter divider className={styles.summaryFooter}>
            <Button variant="primary" size="lg" className={styles.placeOrderButton}>
              Place order
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
