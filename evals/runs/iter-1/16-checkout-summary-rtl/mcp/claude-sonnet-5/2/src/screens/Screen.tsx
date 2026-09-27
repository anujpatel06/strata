import { useState } from 'react';
import {
  Amount,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Link,
  Radio,
  RadioGroup,
  Separator,
  TextField,
} from '@strata/react';
import { IconCheck, IconMinus, IconPlus, IconShoppingBag, IconX } from '@strata/icons';
import styles from './Screen.module.css';

interface DeliverySlot {
  id: string;
  day: string;
  time: string;
  fee: number;
}

interface LineItem {
  id: string;
  name: string;
  unit: string;
  price: number;
}

const CURRENCY = 'INR';

const DELIVERY_SLOTS: DeliverySlot[] = [
  { id: 'morning', day: 'Today', time: '7:00 – 9:00 am', fee: 0 },
  { id: 'afternoon', day: 'Today', time: '12:00 – 2:00 pm', fee: 29 },
  { id: 'evening', day: 'Tomorrow', time: '6:00 – 8:00 pm', fee: 0 },
];

const LINE_ITEMS: LineItem[] = [
  { id: 'bananas', name: 'Bananas', unit: '1 kg pack', price: 49 },
  { id: 'bread', name: 'Whole wheat bread', unit: '400 g loaf', price: 65 },
  { id: 'eggs', name: 'Farm eggs', unit: 'Tray of 6', price: 90 },
  { id: 'yogurt', name: 'Greek yogurt', unit: '400 g tub', price: 120 },
];

const DEFAULT_QUANTITIES: Record<string, number> = {
  bananas: 2,
  bread: 1,
  eggs: 1,
  yogurt: 3,
};

const PROMO_CODE = 'FRESH10';
const PROMO_RATE = 0.1;
const PROMO_CAP = 100;
const MIN_QUANTITY = 1;
const MAX_QUANTITY = 9;

export default function Screen() {
  const [slotId, setSlotId] = useState<string>(DELIVERY_SLOTS[0].id);
  const [quantities, setQuantities] = useState<Record<string, number>>(DEFAULT_QUANTITIES);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  const updateQuantity = (id: string, delta: number) => {
    setQuantities((current) => {
      const next = Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, (current[id] ?? MIN_QUANTITY) + delta));
      return { ...current, [id]: next };
    });
  };

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (code === PROMO_CODE) {
      setAppliedPromo(code);
      setPromoInput('');
      setPromoError('');
    } else {
      setPromoError('This code is not valid.');
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
  };

  const selectedSlot = DELIVERY_SLOTS.find((slot) => slot.id === slotId) ?? DELIVERY_SLOTS[0];
  const subtotal = LINE_ITEMS.reduce((sum, item) => sum + item.price * (quantities[item.id] ?? MIN_QUANTITY), 0);
  const deliveryFee = selectedSlot.fee;
  const discount = appliedPromo ? Math.min(subtotal * PROMO_RATE, PROMO_CAP) : 0;
  const total = subtotal + deliveryFee - discount;

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Checkout</h1>

      <div className={styles.layout}>
        <div className={styles.main}>
          <Card>
            <CardHeader>
              <CardTitle>Delivery address</CardTitle>
              <CardAction>
                <Link variant="standalone" onPress={() => {}}>
                  Change
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent className={styles.addressLines}>
              <p className={styles.addressLabel}>Home</p>
              <p className={styles.addressText}>12 Cedar Court, Flat 4B</p>
              <p className={styles.addressText}>Whitefield, Bengaluru 560066</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery slot</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                aria-label="Delivery slot"
                variant="card"
                orientation="horizontal"
                value={slotId}
                onChange={setSlotId}
                className={styles.slotGroup}
              >
                {DELIVERY_SLOTS.map((slot) => (
                  <Radio key={slot.id} value={slot.id} description={`${slot.day} · ${slot.fee === 0 ? 'Free' : `₹${slot.fee} fee`}`}>
                    {slot.time}
                  </Radio>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>{LINE_ITEMS.length} items in your basket</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className={styles.itemsList}>
                {LINE_ITEMS.map((item) => {
                  const quantity = quantities[item.id] ?? MIN_QUANTITY;
                  return (
                    <li key={item.id} className={styles.itemRow}>
                      <IconShoppingBag aria-hidden className={styles.itemIcon} />
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{item.name}</span>
                        <span className={styles.itemUnit}>{item.unit}</span>
                      </div>
                      <div className={styles.stepper}>
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label={`Decrease quantity of ${item.name}`}
                          isDisabled={quantity <= MIN_QUANTITY}
                          onPress={() => updateQuantity(item.id, -1)}
                        >
                          <IconMinus aria-hidden />
                        </Button>
                        <span className={styles.stepperValue} aria-live="polite">
                          {quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label={`Increase quantity of ${item.name}`}
                          isDisabled={quantity >= MAX_QUANTITY}
                          onPress={() => updateQuantity(item.id, 1)}
                        >
                          <IconPlus aria-hidden />
                        </Button>
                      </div>
                      <Amount value={item.price * quantity} currency={CURRENCY} size="sm" />
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Promo code</CardTitle>
            </CardHeader>
            <CardContent>
              {appliedPromo ? (
                <div className={styles.promoApplied}>
                  <Badge tone="success" icon={<IconCheck aria-hidden />}>
                    {appliedPromo}
                  </Badge>
                  <span className={styles.promoNote}>10% off applied, up to ₹{PROMO_CAP}</span>
                  <Button variant="ghost" size="icon" aria-label="Remove promo code" onPress={removePromo}>
                    <IconX aria-hidden />
                  </Button>
                </div>
              ) : (
                <TextField
                  label="Promo code"
                  placeholder="Enter code"
                  description={`Try ${PROMO_CODE} for 10% off, up to ₹${PROMO_CAP}.`}
                  value={promoInput}
                  onChange={(value) => {
                    setPromoInput(value);
                    if (promoError) setPromoError('');
                  }}
                  isInvalid={!!promoError}
                  errorMessage={promoError}
                  suffix={
                    <Button size="sm" variant="secondary" isDisabled={!promoInput.trim()} onPress={applyPromo}>
                      Apply
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className={styles.summary}>
          <Card>
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent className={styles.priceRows}>
              <div className={styles.priceRow}>
                <span>Subtotal</span>
                <Amount value={subtotal} currency={CURRENCY} size="sm" />
              </div>
              <div className={styles.priceRow}>
                <span>Delivery</span>
                {deliveryFee === 0 ? <span>Free</span> : <Amount value={deliveryFee} currency={CURRENCY} size="sm" />}
              </div>
              <div className={styles.priceRow}>
                <span>Discount</span>
                <Amount
                  value={discount === 0 ? 0 : -discount}
                  currency={CURRENCY}
                  size="sm"
                  tone={discount > 0 ? 'success' : 'neutral'}
                />
              </div>
              <Separator />
              <div className={styles.totalRow}>
                <span>Total</span>
                <Amount value={total} currency={CURRENCY} size="lg" tone="brand" />
              </div>
            </CardContent>
            <CardFooter divider>
              <Button size="lg" className={styles.placeOrderButton} onPress={() => {}}>
                Place order
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
