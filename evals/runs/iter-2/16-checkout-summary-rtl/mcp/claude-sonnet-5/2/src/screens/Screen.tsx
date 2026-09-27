import { useMemo, useState } from 'react';
import {
  Amount,
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
  TextField,
} from '@strata/react';
import { IconMapPin, IconPlus, IconShoppingBag, IconTicket } from '@strata/icons';
import styles from './Screen.module.css';

const CURRENCY = 'USD';
const DELIVERY_FEE = 2.99;
const PROMO_CODE = 'FRESH10';
const PROMO_DISCOUNT_RATE = 0.1;

interface LineItem {
  id: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
}

const initialItems: LineItem[] = [
  { id: 'bananas', name: 'Organic bananas', unit: 'Bunch, 6 pcs', price: 2.49, quantity: 2 },
  { id: 'milk', name: 'Whole milk', unit: '1 L carton', price: 1.89, quantity: 1 },
  { id: 'bread', name: 'Sourdough bread', unit: '400 g loaf', price: 3.25, quantity: 1 },
  { id: 'eggs', name: 'Free-range eggs', unit: 'Pack of 12', price: 4.1, quantity: 1 },
];

const deliverySlots = [
  { id: 'today-afternoon', label: 'Today', description: '4:00 – 6:00 pm' },
  { id: 'today-evening', label: 'Today', description: '6:00 – 8:00 pm' },
  { id: 'tomorrow-morning', label: 'Tomorrow', description: '8:00 – 10:00 am' },
];

const address = {
  name: 'Anuj Patel',
  line1: '4B Marigold Apartments, 12 Church Street',
  line2: 'Bengaluru, Karnataka 560001',
};

export default function Screen() {
  const [items, setItems] = useState(initialItems);
  const [deliverySlot, setDeliverySlot] = useState(deliverySlots[1].id);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState<string | undefined>(undefined);
  const [appliedPromo, setAppliedPromo] = useState<string | undefined>(undefined);

  const updateQuantity = (id: string, delta: number) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: Math.min(9, Math.max(1, item.quantity + delta)) } : item,
      ),
    );
  };

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const discount = appliedPromo ? subtotal * PROMO_DISCOUNT_RATE : 0;
  const total = subtotal + DELIVERY_FEE - discount;

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === PROMO_CODE) {
      setAppliedPromo(code);
      setPromoError(undefined);
    } else {
      setAppliedPromo(undefined);
      setPromoError('This code is not valid.');
    }
  };

  return (
    <form className={styles.page} onSubmit={(e) => e.preventDefault()}>
      <h1 className={styles.title}>Checkout</h1>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Delivery address</CardTitle>
          <CardAction>
            <Link variant="standalone" onPress={() => {}}>
              Change
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className={styles.addressRow}>
            <IconTile tint="auto" name={address.name}>
              <IconMapPin aria-hidden />
            </IconTile>
            <div className={styles.addressText}>
              <span className={styles.addressName}>{address.name}</span>
              <span className={styles.addressDetail}>{address.line1}</span>
              <span className={styles.addressDetail}>{address.line2}</span>
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
            aria-label="Delivery slot"
            variant="card"
            value={deliverySlot}
            onChange={setDeliverySlot}
          >
            {deliverySlots.map((slot) => (
              <Radio key={slot.id} value={slot.id} description={slot.description}>
                {slot.label}
              </Radio>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Items</CardTitle>
        </CardHeader>
        <CardContent className={styles.itemList}>
          {items.map((item) => (
            <div className={styles.itemRow} key={item.id}>
              <IconTile tint="auto" name={item.name}>
                <IconShoppingBag aria-hidden />
              </IconTile>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemUnit}>{item.unit}</span>
              </div>
              <Amount value={item.price} currency={CURRENCY} size="sm" />
              <div className={styles.stepper} role="group" aria-label={`Quantity for ${item.name}`}>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Decrease quantity of ${item.name}`}
                  isDisabled={item.quantity <= 1}
                  onPress={() => updateQuantity(item.id, -1)}
                >
                  {/* @strata/icons has no minus icon; a plain glyph is the closest match. */}
                  −
                </Button>
                <span className={styles.stepperValue} aria-live="polite">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Increase quantity of ${item.name}`}
                  isDisabled={item.quantity >= 9}
                  onPress={() => updateQuantity(item.id, 1)}
                >
                  <IconPlus aria-hidden />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Promo code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.promoRow}>
            <TextField
              className={styles.promoField}
              label="Promo code"
              placeholder="Enter code"
              prefix={<IconTicket aria-hidden />}
              value={promoCode}
              onChange={(value) => {
                setPromoCode(value);
                setPromoError(undefined);
              }}
              isInvalid={Boolean(promoError)}
              errorMessage={promoError}
              description={appliedPromo ? `Code ${appliedPromo} applied — 10% off your subtotal.` : undefined}
            />
            <Button variant="secondary" onPress={handleApplyPromo}>
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Order summary</CardTitle>
        </CardHeader>
        <CardContent className={styles.summaryRows}>
          <div className={styles.priceRow}>
            <span className={styles.priceLabel}>Subtotal</span>
            <Amount value={subtotal} currency={CURRENCY} size="sm" />
          </div>
          <div className={styles.priceRow}>
            <span className={styles.priceLabel}>Delivery</span>
            <Amount value={DELIVERY_FEE} currency={CURRENCY} size="sm" />
          </div>
          {discount > 0 && (
            <div className={styles.priceRow}>
              <span className={`${styles.priceLabel} ${styles.discountLabel}`}>Discount</span>
              <Amount value={-discount} currency={CURRENCY} size="sm" tone="success" />
            </div>
          )}
          <Separator />
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total</span>
            <Amount value={total} currency={CURRENCY} size="md" tone="brand" />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" size="lg" className={styles.placeOrder}>
            Place order
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
