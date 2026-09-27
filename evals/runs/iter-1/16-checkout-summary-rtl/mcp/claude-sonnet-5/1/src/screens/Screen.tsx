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
import { IconDiscount, IconMapPin, IconPlus, IconTicket } from '@strata/icons';
import styles from './Screen.module.css';

interface GroceryItem {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
}

interface DeliverySlot {
  id: string;
  label: string;
  note: string;
  fee: number;
}

const CURRENCY = 'AED';

const ITEMS: GroceryItem[] = [
  { id: 'bananas', name: 'Bananas', unit: '1 kg', unitPrice: 6.5 },
  { id: 'milk', name: 'Whole milk', unit: '1 L', unitPrice: 8 },
  { id: 'sourdough', name: 'Sourdough bread', unit: '1 loaf', unitPrice: 12.5 },
  { id: 'eggs', name: 'Free-range eggs', unit: '12 pack', unitPrice: 15 },
];

const SLOTS: DeliverySlot[] = [
  { id: 'midday', label: 'Today, 12:00 – 1:00 PM', note: 'Priority · +AED 9.00', fee: 9 },
  { id: 'afternoon', label: 'Today, 2:00 – 4:00 PM', note: 'Free', fee: 0 },
  { id: 'evening', label: 'Today, 6:00 – 8:00 PM', note: 'Free', fee: 0 },
];

const PROMO_CODE = 'FRESH10';
const PROMO_RATE = 0.1;

export default function Screen() {
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(ITEMS.map((item) => [item.id, 1])),
  );
  const [slotId, setSlotId] = useState(SLOTS[1].id);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const itemCount = ITEMS.length;

  const subtotal = useMemo(
    () => ITEMS.reduce((sum, item) => sum + item.unitPrice * quantities[item.id], 0),
    [quantities],
  );

  const deliveryFee = SLOTS.find((slot) => slot.id === slotId)?.fee ?? 0;
  const discount = appliedPromo ? subtotal * PROMO_RATE : 0;
  const total = subtotal + deliveryFee - discount;

  function changeQuantity(id: string, delta: number) {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.min(9, Math.max(1, prev[id] + delta)),
    }));
  }

  function handleApplyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (code === PROMO_CODE) {
      setAppliedPromo(code);
      setPromoError(null);
    } else {
      setPromoError("This code isn't valid.");
    }
  }

  function handleRemovePromo() {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError(null);
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Checkout</h1>
        <p className={styles.subtitle}>Review your order before you place it.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Delivery address</CardTitle>
          <CardAction>
            <Link variant="standalone" onPress={() => {}}>
              Change
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent className={styles.addressContent}>
          <IconMapPin aria-hidden className={styles.addressIcon} />
          <div>
            <p className={styles.addressLine}>Anuj Patel · Apartment 12B</p>
            <p className={styles.addressLine}>14 Palm Grove Street, Al Barsha, Dubai</p>
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
            value={slotId}
            onChange={setSlotId}
          >
            {SLOTS.map((slot) => (
              <Radio key={slot.id} value={slot.id} description={slot.note}>
                {slot.label}
              </Radio>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Items</CardTitle>
          <CardAction>
            <Badge>{itemCount} items</Badge>
          </CardAction>
        </CardHeader>
        <CardContent variant="inset">
          <ul className={styles.itemList}>
            {ITEMS.map((item) => (
              <li key={item.id} className={styles.itemRow}>
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{item.name}</p>
                  <p className={styles.itemUnit}>
                    {item.unit} · <Amount value={item.unitPrice} currency={CURRENCY} size="sm" symbol="inline" /> each
                  </p>
                </div>
                <div
                  className={styles.stepper}
                  role="group"
                  aria-label={`Quantity for ${item.name}`}
                >
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label={`Decrease quantity of ${item.name}`}
                    isDisabled={quantities[item.id] <= 1}
                    onPress={() => changeQuantity(item.id, -1)}
                  >
                    <span aria-hidden>−</span>
                  </Button>
                  <span className={styles.stepperValue}>{quantities[item.id]}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label={`Increase quantity of ${item.name}`}
                    isDisabled={quantities[item.id] >= 9}
                    onPress={() => changeQuantity(item.id, 1)}
                  >
                    <IconPlus aria-hidden />
                  </Button>
                </div>
                <Amount
                  value={item.unitPrice * quantities[item.id]}
                  currency={CURRENCY}
                  size="sm"
                  className={styles.itemTotal}
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Promo code</CardTitle>
        </CardHeader>
        <CardContent className={styles.promoRow}>
          <TextField
            label="Promo code"
            placeholder="Enter code"
            value={promoInput}
            onChange={(value) => {
              setPromoInput(value);
              setPromoError(null);
            }}
            prefix={<IconTicket aria-hidden />}
            isInvalid={!!promoError}
            errorMessage={promoError ?? undefined}
            isDisabled={!!appliedPromo}
          />
          <Button
            variant="secondary"
            onPress={handleApplyPromo}
            isDisabled={!!appliedPromo || promoInput.trim() === ''}
          >
            Apply
          </Button>
        </CardContent>
        {appliedPromo && (
          <CardFooter>
            <Badge tone="success" icon={<IconDiscount aria-hidden />}>
              Code {appliedPromo} applied
            </Badge>
            <Button variant="ghost" size="sm" onPress={handleRemovePromo}>
              Remove
            </Button>
          </CardFooter>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Order summary</CardTitle>
        </CardHeader>
        <CardContent className={styles.summary}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Subtotal</span>
            <Amount value={subtotal} currency={CURRENCY} size="sm" />
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Delivery</span>
            {deliveryFee === 0 ? (
              <span className={styles.freeLabel}>Free</span>
            ) : (
              <Amount value={deliveryFee} currency={CURRENCY} size="sm" />
            )}
          </div>
          {appliedPromo && (
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Discount</span>
              <Amount value={-discount} currency={CURRENCY} size="sm" tone="success" />
            </div>
          )}
          <Separator />
          <div className={styles.summaryRow}>
            <span className={styles.totalLabel}>Total</span>
            <Amount value={total} currency={CURRENCY} size="lg" />
          </div>
        </CardContent>
        <CardFooter divider>
          <Button size="lg" className={styles.placeOrderButton}>
            Place order
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
