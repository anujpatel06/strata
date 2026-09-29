import { useState } from 'react';
import {
  Amount,
  Button,
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Link,
  Radio,
  RadioGroup,
  Separator,
  TextField,
} from '@syntara/react';
import { IconMapPin, IconTag } from '@syntara/icons';
import styles from './Screen.module.css';

type LineItem = {
  id: string;
  name: string;
  detail: string;
  unitPrice: number;
  qty: number;
};

type DeliverySlot = {
  id: string;
  label: string;
  description: string;
};

const initialItems: LineItem[] = [
  { id: 'bananas', name: 'Bananas', detail: '1 kg', unitPrice: 60, qty: 2 },
  { id: 'milk', name: 'Whole milk', detail: '1 L carton', unitPrice: 72, qty: 1 },
  { id: 'eggs', name: 'Brown eggs', detail: 'Tray of 12', unitPrice: 110, qty: 1 },
  { id: 'bread', name: 'Sourdough bread', detail: '500 g loaf', unitPrice: 95, qty: 1 },
];

const deliverySlots: DeliverySlot[] = [
  { id: 'today-evening', label: 'Today, 6:00–8:00 PM', description: 'Fastest available' },
  { id: 'tomorrow-morning', label: 'Tomorrow, 8:00–10:00 AM', description: 'Free delivery' },
  { id: 'tomorrow-evening', label: 'Tomorrow, 6:00–8:00 PM', description: 'Free delivery' },
];

const CURRENCY = 'INR';
const DELIVERY_FEE = 40;
const MAX_QTY = 9;
const PROMO_DISCOUNT_RATE = 0.1;

export default function Screen() {
  const [items, setItems] = useState(initialItems);
  const [slot, setSlot] = useState(deliverySlots[0].id);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  const changeQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.min(MAX_QTY, Math.max(1, item.qty + delta)) } : item,
      ),
    );
  };

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const discount = appliedPromo ? Math.round(subtotal * PROMO_DISCOUNT_RATE) : 0;
  const total = subtotal + DELIVERY_FEE - discount;

  const applyPromo = () => {
    const code = promoCode.trim();
    if (code) setAppliedPromo(code.toUpperCase());
  };

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h1 className={styles.title}>Checkout</h1>
        <p className={styles.subtitle}>{items.length} items in your order</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Delivery address</CardTitle>
          <CardAction>
            <Link variant="standalone" href="#change-address">
              Change
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className={styles.address}>
            <IconMapPin aria-hidden className={styles.addressIcon} />
            <div>
              <p className={styles.addressName}>Anuj Patel</p>
              <p className={styles.addressText}>4B Lotus Residency, MG Road, Bengaluru 560001</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Delivery slot</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            variant="card"
            orientation="horizontal"
            aria-label="Delivery slot"
            value={slot}
            onChange={setSlot}
            className={styles.slotGroup}
          >
            {deliverySlots.map((option) => (
              <Radio key={option.id} value={option.id} description={option.description}>
                {option.label}
              </Radio>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className={styles.itemList}>
            {items.map((item) => (
              <li key={item.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{item.name}</p>
                  <p className={styles.itemDetail}>{item.detail}</p>
                </div>
                <div className={styles.itemMeta}>
                  <div className={styles.stepper}>
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label={`Decrease quantity of ${item.name}`}
                      isDisabled={item.qty <= 1}
                      onPress={() => changeQty(item.id, -1)}
                    >
                      −
                    </Button>
                    <span className={styles.stepperValue} aria-live="polite">
                      {item.qty}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label={`Increase quantity of ${item.name}`}
                      isDisabled={item.qty >= MAX_QTY}
                      onPress={() => changeQty(item.id, 1)}
                    >
                      +
                    </Button>
                  </div>
                  <Amount value={item.unitPrice * item.qty} currency={CURRENCY} size="sm" />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TextField
            label="Promo code"
            placeholder="Enter code"
            prefix={<IconTag aria-hidden />}
            value={promoCode}
            onChange={setPromoCode}
            description={appliedPromo ? `"${appliedPromo}" applied — 10% off your subtotal.` : undefined}
            suffix={
              <Button size="sm" variant="ghost" isDisabled={!promoCode.trim()} onPress={applyPromo}>
                Apply
              </Button>
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Order summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <Amount value={subtotal} currency={CURRENCY} size="sm" />
          </div>
          <div className={styles.summaryRow}>
            <span>Delivery</span>
            <Amount value={DELIVERY_FEE} currency={CURRENCY} size="sm" />
          </div>
          {discount > 0 && (
            <div className={styles.summaryRow}>
              <span>Discount</span>
              <Amount value={-discount} currency={CURRENCY} size="sm" tone="success" />
            </div>
          )}
          <Separator />
          <div className={styles.summaryRow}>
            <span className={styles.totalLabel}>Total</span>
            <Amount value={total} currency={CURRENCY} size="md" />
          </div>
        </CardContent>
        <CardFooter divider>
          <Button size="lg" className={styles.placeOrder}>
            Place order
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
