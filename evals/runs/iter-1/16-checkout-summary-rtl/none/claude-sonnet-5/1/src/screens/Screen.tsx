import { useState, type FormEvent } from 'react';
import styles from './Screen.module.css';

type Address = {
  id: string;
  label: string;
  line1: string;
  line2: string;
  city: string;
  postcode: string;
};

type DeliverySlot = {
  id: string;
  day: string;
  time: string;
};

type Item = {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  qty: number;
};

type PromoType = 'percent' | 'flat' | 'freeDelivery';

type Promo = {
  code: string;
  description: string;
  type: PromoType;
  value: number;
};

const savedAddresses: Address[] = [
  { id: 'home', label: 'Home', line1: '12 Rosewood Avenue', line2: 'Apartment 4B', city: 'Manchester', postcode: 'M14 5TP' },
  { id: 'work', label: 'Work', line1: '48 Kings Cross Road', line2: 'Floor 3', city: 'London', postcode: 'N1 9AG' },
];

const deliverySlots: DeliverySlot[] = [
  { id: 'morning', day: 'Today', time: '8:00 – 10:00 AM' },
  { id: 'afternoon', day: 'Today', time: '1:00 – 3:00 PM' },
  { id: 'evening', day: 'Tomorrow', time: '6:00 – 8:00 PM' },
];

const initialItems: Item[] = [
  { id: 'milk', name: 'Whole Milk, 1L', unit: 'bottle', unitPrice: 1.2, qty: 2 },
  { id: 'bread', name: 'Sourdough Bread', unit: 'loaf', unitPrice: 2.75, qty: 1 },
  { id: 'eggs', name: 'Free-range Eggs, 12 pack', unit: 'pack', unitPrice: 3.4, qty: 1 },
  { id: 'bananas', name: 'Bananas', unit: 'each', unitPrice: 0.65, qty: 6 },
  { id: 'avocado', name: 'Avocado', unit: 'each', unitPrice: 0.95, qty: 3 },
  { id: 'oat-milk', name: 'Oat Milk, 1L', unit: 'carton', unitPrice: 1.8, qty: 1 },
];

const promoCodes: Record<string, Promo> = {
  SAVE10: { code: 'SAVE10', description: '10% off your order', type: 'percent', value: 10 },
  WELCOME5: { code: 'WELCOME5', description: '$5 off your order', type: 'flat', value: 5 },
  FREESHIP: { code: 'FREESHIP', description: 'Free delivery', type: 'freeDelivery', value: 0 },
};

const DELIVERY_FEE = 3.99;
const FREE_DELIVERY_THRESHOLD = 30;
const MIN_QTY = 1;
const MAX_QTY = 24;

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

export default function Screen() {
  const [addressIndex, setAddressIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(deliverySlots[0].id);
  const [items, setItems] = useState(initialItems);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<Promo | null>(null);
  const [promoError, setPromoError] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);

  const address = savedAddresses[addressIndex];

  function updateQty(id: string, delta: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, qty: Math.min(MAX_QTY, Math.max(MIN_QTY, item.qty + delta)) }
          : item,
      ),
    );
  }

  function handleChangeAddress() {
    setAddressIndex((current) => (current + 1) % savedAddresses.length);
  }

  function handleApplyPromo(event: FormEvent) {
    event.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoError('Enter a promo code');
      setAppliedPromo(null);
      return;
    }
    const match = promoCodes[code];
    if (match) {
      setAppliedPromo(match);
      setPromoError('');
    } else {
      setAppliedPromo(null);
      setPromoError('This promo code is not valid');
    }
  }

  function handleRemovePromo() {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError('');
  }

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const qualifiesForFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;
  let deliveryFee = qualifiesForFreeDelivery ? 0 : DELIVERY_FEE;
  let discount = 0;

  if (appliedPromo) {
    if (appliedPromo.type === 'percent') {
      discount = subtotal * (appliedPromo.value / 100);
    } else if (appliedPromo.type === 'flat') {
      discount = Math.min(appliedPromo.value, subtotal);
    } else if (appliedPromo.type === 'freeDelivery') {
      deliveryFee = 0;
    }
  }

  const total = Math.max(0, subtotal + deliveryFee - discount);
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Checkout</h1>

      <div className={styles.layout}>
        <div className={styles.main}>
          <section className={styles.card} aria-labelledby="address-heading">
            <div className={styles.cardHeader}>
              <h2 id="address-heading" className={styles.cardTitle}>
                Delivery address
              </h2>
              <button type="button" className={styles.linkButton} onClick={handleChangeAddress}>
                Change
              </button>
            </div>
            <p className={styles.addressLabel}>{address.label}</p>
            <p className={styles.addressText}>
              {address.line1}, {address.line2}
              <br />
              {address.city}, {address.postcode}
            </p>
          </section>

          <section className={styles.card} aria-labelledby="slot-heading">
            <h2 id="slot-heading" className={styles.cardTitle}>
              Delivery slot
            </h2>
            <div className={styles.slotGroup} role="radiogroup" aria-labelledby="slot-heading">
              {deliverySlots.map((slot) => {
                const checked = selectedSlot === slot.id;
                return (
                  <label
                    key={slot.id}
                    className={checked ? `${styles.slotOption} ${styles.slotOptionChecked}` : styles.slotOption}
                  >
                    <input
                      type="radio"
                      name="delivery-slot"
                      value={slot.id}
                      checked={checked}
                      onChange={() => setSelectedSlot(slot.id)}
                      className={styles.slotRadio}
                    />
                    <span className={styles.slotDay}>{slot.day}</span>
                    <span className={styles.slotTime}>{slot.time}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className={styles.card} aria-labelledby="items-heading">
            <h2 id="items-heading" className={styles.cardTitle}>
              Items ({itemCount})
            </h2>
            <ul className={styles.itemList}>
              {items.map((item) => (
                <li key={item.id} className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemUnit}>
                      {formatPrice(item.unitPrice)} / {item.unit}
                    </span>
                  </div>
                  <div className={styles.stepper}>
                    <button
                      type="button"
                      className={styles.stepperButton}
                      onClick={() => updateQty(item.id, -1)}
                      disabled={item.qty <= MIN_QTY}
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      −
                    </button>
                    <span className={styles.stepperValue} aria-live="polite">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      className={styles.stepperButton}
                      onClick={() => updateQty(item.id, 1)}
                      disabled={item.qty >= MAX_QTY}
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                  <span className={styles.itemTotal}>{formatPrice(item.unitPrice * item.qty)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.card} aria-labelledby="promo-heading">
            <h2 id="promo-heading" className={styles.cardTitle}>
              Promo code
            </h2>
            {appliedPromo ? (
              <div className={styles.promoApplied}>
                <div>
                  <p className={styles.promoCode}>{appliedPromo.code}</p>
                  <p className={styles.promoDescription}>{appliedPromo.description}</p>
                </div>
                <button type="button" className={styles.linkButton} onClick={handleRemovePromo}>
                  Remove
                </button>
              </div>
            ) : (
              <form className={styles.promoForm} onSubmit={handleApplyPromo}>
                <input
                  type="text"
                  className={styles.promoInput}
                  placeholder="Enter promo code"
                  value={promoInput}
                  onChange={(event) => {
                    setPromoInput(event.target.value);
                    if (promoError) setPromoError('');
                  }}
                  aria-label="Promo code"
                  aria-invalid={promoError ? true : undefined}
                />
                <button type="submit" className={styles.secondaryButton}>
                  Apply
                </button>
              </form>
            )}
            {promoError && <p className={styles.promoError}>{promoError}</p>}
          </section>
        </div>

        <aside className={styles.summary} aria-labelledby="summary-heading">
          <h2 id="summary-heading" className={styles.cardTitle}>
            Order summary
          </h2>
          <dl className={styles.summaryList}>
            <div className={styles.summaryRow}>
              <dt>Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>Delivery</dt>
              <dd>{deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</dd>
            </div>
            {discount > 0 && (
              <div className={styles.summaryRow}>
                <dt>Discount</dt>
                <dd className={styles.discountValue}>−{formatPrice(discount)}</dd>
              </div>
            )}
            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>

          {!qualifiesForFreeDelivery && !appliedPromo && (
            <p className={styles.hint}>
              Add {formatPrice(FREE_DELIVERY_THRESHOLD - subtotal)} more for free delivery
            </p>
          )}

          <button
            type="button"
            className={styles.placeOrderButton}
            onClick={() => setOrderPlaced(true)}
          >
            Place order
          </button>

          {orderPlaced && (
            <p className={styles.confirmation} role="status">
              Order placed for {itemCount} item{itemCount === 1 ? '' : 's'} — arriving{' '}
              {deliverySlots.find((slot) => slot.id === selectedSlot)?.day.toLowerCase()}.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
