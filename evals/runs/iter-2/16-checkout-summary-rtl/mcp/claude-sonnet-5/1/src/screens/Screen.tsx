'use client';

import { useMemo, useState } from 'react';
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
  Link,
  Radio,
  RadioGroup,
  Separator,
  TextField,
} from '@strata/react';
import { IconPlus } from '@strata/icons';
import styles from './Screen.module.css';

const CURRENCY = 'AED';
const DELIVERY_FEE = 5;

interface GroceryItem {
  id: string;
  name: string;
  unit: string;
  price: number;
}

const ITEMS: GroceryItem[] = [
  { id: 'bananas', name: 'Organic bananas', unit: '1 kg', price: 6.5 },
  { id: 'milk', name: 'Whole milk', unit: '2 L bottle', price: 9.25 },
  { id: 'bread', name: 'Sourdough bread', unit: '1 loaf', price: 12 },
  { id: 'eggs', name: 'Free-range eggs', unit: '12 pack', price: 15.5 },
];

const DELIVERY_SLOTS = [
  { id: 'afternoon', time: '4:00 – 6:00 PM', description: 'Today · Standard delivery' },
  { id: 'evening', time: '6:00 – 8:00 PM', description: 'Today · Most popular' },
  { id: 'morning', time: '8:00 – 10:00 AM', description: 'Tomorrow · Free delivery' },
];

const PROMO_CODES: Record<string, number> = {
  SAVE10: 0.1,
  WELCOME5: 0.05,
};

const ADDRESS = {
  name: 'Aisha Rahman',
  line1: 'Villa 12, Al Wasl Road',
  line2: 'Jumeirah 1',
  cityCountry: 'Dubai, United Arab Emirates',
};

const DEFAULT_QUANTITIES: Record<string, number> = {
  bananas: 2,
  milk: 1,
  bread: 1,
  eggs: 3,
};

export default function Screen() {
  const [quantities, setQuantities] = useState(DEFAULT_QUANTITIES);
  const [slot, setSlot] = useState('evening');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const subtotal = useMemo(
    () => ITEMS.reduce((sum, item) => sum + item.price * (quantities[item.id] ?? 1), 0),
    [quantities],
  );
  const discount = appliedPromo ? subtotal * PROMO_CODES[appliedPromo] : 0;
  const total = subtotal + DELIVERY_FEE - discount;

  function updateQuantity(id: string, delta: number) {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] ?? 1) + delta),
    }));
  }

  function applyPromoCode() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (PROMO_CODES[code]) {
      setAppliedPromo(code);
      setPromoError(null);
    } else {
      setAppliedPromo(null);
      setPromoError("This code isn't valid.");
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Checkout</h1>

      <div className={styles.layout}>
        <div className={styles.column}>
          <Card>
            <CardHeader>
              <CardTitle level={2}>Delivery address</CardTitle>
              <CardAction>
                <Link variant="standalone">Change</Link>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className={styles.address}>
                <p className={styles.addressLine}>{ADDRESS.name}</p>
                <p className={styles.addressLine}>{ADDRESS.line1}</p>
                <p className={styles.addressLine}>{ADDRESS.line2}</p>
                <p className={styles.addressLine}>{ADDRESS.cityCountry}</p>
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
                {DELIVERY_SLOTS.map((option) => (
                  <Radio key={option.id} value={option.id} description={option.description}>
                    {option.time}
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
              <div className={styles.itemList}>
                {ITEMS.map((item) => {
                  const quantity = quantities[item.id] ?? 1;
                  return (
                    <div key={item.id} className={styles.itemRow}>
                      <div className={styles.itemInfo}>
                        <p className={styles.itemName}>{item.name}</p>
                        <p className={styles.itemMeta}>
                          {item.unit} · <Amount value={item.price} currency={CURRENCY} size="sm" /> each
                        </p>
                      </div>

                      {/* Strata has no quantity stepper yet; built from two icon Buttons around a live count. */}
                      <div className={styles.stepper}>
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label={`Decrease quantity of ${item.name}`}
                          isDisabled={quantity <= 1}
                          onPress={() => updateQuantity(item.id, -1)}
                        >
                          <span aria-hidden="true">−</span>
                        </Button>
                        <span
                          className={styles.stepperValue}
                          role="status"
                          aria-label={`Quantity of ${item.name}: ${quantity}`}
                        >
                          {quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label={`Increase quantity of ${item.name}`}
                          onPress={() => updateQuantity(item.id, 1)}
                        >
                          <IconPlus aria-hidden />
                        </Button>
                      </div>

                      <span className={styles.itemTotal}>
                        <Amount value={item.price * quantity} currency={CURRENCY} size="sm" />
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={styles.column}>
          <Card>
            <CardHeader>
              <CardTitle level={2}>Promo code</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className={styles.promoForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  applyPromoCode();
                }}
              >
                <TextField
                  label="Promo code"
                  placeholder="Enter code"
                  value={promoInput}
                  onChange={(value) => {
                    setPromoInput(value);
                    setPromoError(null);
                  }}
                  isInvalid={!!promoError}
                  errorMessage={promoError ?? undefined}
                  description={appliedPromo ? undefined : 'Try SAVE10 or WELCOME5.'}
                  suffix={
                    <Button type="submit" variant="ghost" size="sm">
                      Apply
                    </Button>
                  }
                />
              </form>
              {appliedPromo && (
                <div className={styles.promoBadge}>
                  <Badge tone="success" icon={<span aria-hidden="true">✓</span>}>
                    {appliedPromo} applied
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle level={2}>Order summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.summary}>
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
                    <Amount
                      value={-discount}
                      currency={CURRENCY}
                      size="sm"
                      tone="success"
                      formatOptions={{ signDisplay: 'always' }}
                    />
                  </div>
                )}
                <Separator />
                <div className={styles.summaryRow}>
                  <span className={styles.totalLabel}>Total</span>
                  <Amount value={total} currency={CURRENCY} size="lg" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button size="lg" className={styles.placeOrder}>
                Place order
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
