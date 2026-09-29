'use client';

import { useState } from 'react';
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
} from '@syntara/react';
import { IconMapPin, IconPlus } from '@syntara/icons';
import styles from './Screen.module.css';

const CURRENCY = 'AED';
const VALID_PROMO_CODE = 'FRESH10';
const PROMO_DISCOUNT = 10;
const STANDARD_DELIVERY_FEE = 9;

interface CartItem {
  id: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
}

const INITIAL_ITEMS: CartItem[] = [
  { id: 'milk', name: 'Full-fat milk', unit: '1 L carton', price: 6.5, quantity: 2 },
  { id: 'bread', name: 'Whole wheat bread', unit: '400 g loaf', price: 5.25, quantity: 1 },
  { id: 'eggs', name: 'Free-range eggs', unit: 'Tray of 12', price: 14, quantity: 1 },
  { id: 'bananas', name: 'Bananas', unit: '1 kg', price: 4.75, quantity: 3 },
  { id: 'tomatoes', name: 'Tomatoes', unit: '500 g', price: 3.9, quantity: 2 },
];

interface DeliverySlot {
  id: string;
  title: string;
  description: string;
}

const DELIVERY_SLOTS: DeliverySlot[] = [
  { id: 'today-afternoon', title: 'Today, 4–6 PM', description: 'Fastest available' },
  { id: 'today-evening', title: 'Today, 6–8 PM', description: 'Most popular' },
  { id: 'tomorrow-morning', title: 'Tomorrow, 8–10 AM', description: 'Free delivery' },
];

const DELIVERY_ADDRESS = {
  label: 'Home',
  line1: 'Marina Walk, Building 4, Apartment 1204',
  line2: 'Dubai Marina, Dubai, United Arab Emirates',
};

export default function Screen() {
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS);
  const [slot, setSlot] = useState<string>(DELIVERY_SLOTS[1].id);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState('');

  const changeQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: Math.min(20, Math.max(1, item.quantity + delta)) } : item)),
    );
  };

  const applyPromoCode = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setAppliedPromo(null);
      setPromoError('Enter a code.');
      return;
    }
    if (code === VALID_PROMO_CODE) {
      setAppliedPromo({ code, discount: PROMO_DISCOUNT });
      setPromoError('');
    } else {
      setAppliedPromo(null);
      setPromoError('This code is not valid.');
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = slot === 'tomorrow-morning' ? 0 : STANDARD_DELIVERY_FEE;
  const discount = appliedPromo?.discount ?? 0;
  const total = subtotal + deliveryFee - discount;

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Checkout</h1>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <Card>
            <CardHeader>
              <CardTitle level={2}>Delivery address</CardTitle>
              <CardAction>
                <Link href="#delivery-address" variant="standalone">
                  Change
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className={styles.addressContent}>
                <IconMapPin aria-hidden className={styles.addressIcon} />
                <div>
                  <p className={styles.addressLabel}>{DELIVERY_ADDRESS.label}</p>
                  <p className={styles.addressLine}>{DELIVERY_ADDRESS.line1}</p>
                  <p className={styles.addressLine}>{DELIVERY_ADDRESS.line2}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle level={2}>Delivery slot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.slotGroup}>
                <RadioGroup variant="card" orientation="horizontal" aria-label="Delivery slot" value={slot} onChange={setSlot}>
                  {DELIVERY_SLOTS.map((option) => (
                    <Radio key={option.id} value={option.id} description={option.description}>
                      {option.title}
                    </Radio>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle level={2}>Items</CardTitle>
              <CardAction>
                <Badge tone="neutral" variant="soft">
                  {items.length} items
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className={styles.itemList}>
                {items.map((item, index) => (
                  <div key={item.id}>
                    {index > 0 && <Separator />}
                    <div className={styles.itemRow}>
                      <div className={styles.itemInfo}>
                        <p className={styles.itemName}>{item.name}</p>
                        <p className={styles.itemUnit}>{item.unit}</p>
                      </div>

                      {/* Syntara has no quantity stepper component; built from two icon Buttons and a live count. */}
                      <div className={styles.stepper}>
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label={`Decrease quantity of ${item.name}`}
                          isDisabled={item.quantity <= 1}
                          onPress={() => changeQuantity(item.id, -1)}
                        >
                          <span aria-hidden>−</span>
                        </Button>
                        <span className={styles.stepperValue} aria-live="polite">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label={`Increase quantity of ${item.name}`}
                          isDisabled={item.quantity >= 20}
                          onPress={() => changeQuantity(item.id, 1)}
                        >
                          <IconPlus aria-hidden />
                        </Button>
                      </div>

                      <div className={styles.itemPrice}>
                        <Amount value={item.price * item.quantity} currency={CURRENCY} size="sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={styles.sideColumn}>
          <Card>
            <CardHeader>
              <CardTitle level={2}>Promo code</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className={styles.promoForm}
                onSubmit={(event) => {
                  event.preventDefault();
                  applyPromoCode();
                }}
              >
                <TextField
                  label="Promo code"
                  placeholder="Enter code"
                  value={promoInput}
                  onChange={(value) => {
                    setPromoInput(value);
                    if (promoError) setPromoError('');
                  }}
                  errorMessage={promoError || undefined}
                  isInvalid={Boolean(promoError)}
                  description={appliedPromo ? `"${appliedPromo.code}" applied.` : undefined}
                />
                <Button type="submit" variant="secondary">
                  Apply
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle level={2}>Order summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.summaryList}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <Amount value={subtotal} currency={CURRENCY} size="sm" />
                </div>
                <div className={styles.summaryRow}>
                  <span>Delivery</span>
                  {deliveryFee === 0 ? (
                    <Badge tone="success" variant="soft">
                      Free
                    </Badge>
                  ) : (
                    <Amount value={deliveryFee} currency={CURRENCY} size="sm" />
                  )}
                </div>
                <div className={styles.summaryRow}>
                  <span>Discount</span>
                  <Amount value={-discount} currency={CURRENCY} size="sm" tone={discount > 0 ? 'success' : 'neutral'} />
                </div>
                <Separator />
                <div className={styles.summaryRow}>
                  <span className={styles.totalLabel}>Total</span>
                  <Amount value={total} currency={CURRENCY} size="lg" tone="brand" />
                </div>
              </div>
            </CardContent>
            <CardFooter divider>
              <Button type="button" size="lg" className={styles.placeOrderButton}>
                Place order
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
