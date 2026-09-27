import { useState } from 'react';
import styles from './Screen.module.css';

interface Address {
  id: string;
  label: string;
  line1: string;
  line2: string;
}

interface DeliverySlot {
  id: string;
  day: string;
  window: string;
}

interface GroceryItem {
  id: string;
  name: string;
  unit: string;
  price: number;
  emoji: string;
  quantity: number;
}

const ADDRESSES: Address[] = [
  { id: 'home', label: 'Home', line1: '221B Baker Street', line2: 'Flat 3, London NW1 6XE' },
  { id: 'work', label: 'Work', line1: '1 Canada Square', line2: 'Level 12, London E14 5AB' },
];

const SLOTS: DeliverySlot[] = [
  { id: 'today-afternoon', day: 'Today', window: '2:00 – 4:00 PM' },
  { id: 'today-evening', day: 'Today', window: '6:00 – 8:00 PM' },
  { id: 'tomorrow-morning', day: 'Tomorrow', window: '8:00 – 10:00 AM' },
];

const INITIAL_ITEMS: GroceryItem[] = [
  { id: 'apples', name: 'Gala Apples', unit: '1 kg bag', price: 3.49, emoji: '🍎', quantity: 2 },
  { id: 'milk', name: 'Whole Milk', unit: '1 L carton', price: 1.79, emoji: '🥛', quantity: 1 },
  { id: 'bread', name: 'Sourdough Loaf', unit: '600 g', price: 2.99, emoji: '🍞', quantity: 1 },
  { id: 'avocado', name: 'Avocados', unit: 'Pack of 4', price: 4.29, emoji: '🥑', quantity: 1 },
  { id: 'eggs', name: 'Free-range Eggs', unit: 'Box of 12', price: 3.99, emoji: '🥚', quantity: 1 },
];

const PROMO_CODE = 'FRESH10';
const PROMO_RATE = 0.1;
const PROMO_MAX_DISCOUNT = 15;
const FREE_DELIVERY_THRESHOLD = 50;
const DELIVERY_FEE = 3.99;
const MIN_QUANTITY = 1;
const MAX_QUANTITY = 9;

function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function Screen() {
  const [selectedAddressId, setSelectedAddressId] = useState(ADDRESSES[0].id);
  const [isChangingAddress, setIsChangingAddress] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(SLOTS[0].id);
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);

  const selectedAddress = ADDRESSES.find((address) => address.id === selectedAddressId) ?? ADDRESSES[0];
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const discount = appliedPromo ? Math.min(subtotal * PROMO_RATE, PROMO_MAX_DISCOUNT) : 0;
  const total = Math.max(subtotal + deliveryFee - discount, 0);

  function handleQuantityChange(id: string, delta: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: clamp(item.quantity + delta, MIN_QUANTITY, MAX_QUANTITY) } : item,
      ),
    );
  }

  function handleApplyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (code === PROMO_CODE) {
      setAppliedPromo(code);
      setPromoError(null);
      setPromoInput('');
    } else {
      setPromoError('This promo code is not valid.');
    }
  }

  function handleRemovePromo() {
    setAppliedPromo(null);
    setPromoError(null);
  }

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Checkout</h1>

      <section className={styles.card} aria-labelledby="address-heading">
        <div className={styles.cardHeader}>
          <h2 id="address-heading" className={styles.cardTitle}>
            Delivery address
          </h2>
          {!isChangingAddress && (
            <button type="button" className={styles.linkButton} onClick={() => setIsChangingAddress(true)}>
              Change
            </button>
          )}
        </div>

        {isChangingAddress ? (
          <div className={styles.addressChooser}>
            <fieldset className={styles.fieldset}>
              <legend className={styles.visuallyHidden}>Choose delivery address</legend>
              {ADDRESSES.map((address) => (
                <label key={address.id} className={styles.radioCard}>
                  <input
                    type="radio"
                    name="address"
                    value={address.id}
                    checked={selectedAddressId === address.id}
                    onChange={() => setSelectedAddressId(address.id)}
                  />
                  <span className={styles.radioCardBody}>
                    <span className={styles.radioCardTitle}>{address.label}</span>
                    <span className={styles.radioCardText}>
                      {address.line1}, {address.line2}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
            <div className={styles.actionsRow}>
              <button type="button" className={styles.secondaryButton} onClick={() => setIsChangingAddress(false)}>
                Cancel
              </button>
              <button type="button" className={styles.primaryButtonSmall} onClick={() => setIsChangingAddress(false)}>
                Save address
              </button>
            </div>
          </div>
        ) : (
          <p className={styles.addressText}>
            <span className={styles.addressLabel}>{selectedAddress.label}</span>
            <br />
            {selectedAddress.line1}, {selectedAddress.line2}
          </p>
        )}
      </section>

      <section className={styles.card} aria-labelledby="slot-heading">
        <h2 id="slot-heading" className={styles.cardTitle}>
          Delivery slot
        </h2>
        <div className={styles.slotList} role="radiogroup" aria-labelledby="slot-heading">
          {SLOTS.map((slot) => (
            <label key={slot.id} className={styles.slotOption}>
              <input
                type="radio"
                name="slot"
                value={slot.id}
                checked={selectedSlotId === slot.id}
                onChange={() => setSelectedSlotId(slot.id)}
              />
              <span className={styles.slotText}>
                <span className={styles.slotDay}>{slot.day}</span>
                <span className={styles.slotWindow}>{slot.window}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className={styles.card} aria-labelledby="items-heading">
        <h2 id="items-heading" className={styles.cardTitle}>
          Items ({itemCount})
        </h2>
        <ul className={styles.itemList}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <span className={styles.itemImage} aria-hidden="true">
                {item.emoji}
              </span>
              <span className={styles.itemInfo}>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemUnit}>{item.unit}</span>
              </span>
              <span className={styles.itemPrice}>{formatPrice(item.price)}</span>
              <span className={styles.stepper} role="group" aria-label={`Quantity for ${item.name}`}>
                <button
                  type="button"
                  className={styles.stepperButton}
                  onClick={() => handleQuantityChange(item.id, -1)}
                  disabled={item.quantity <= MIN_QUANTITY}
                  aria-label={`Decrease quantity of ${item.name}`}
                >
                  −
                </button>
                <span className={styles.stepperValue}>{item.quantity}</span>
                <button
                  type="button"
                  className={styles.stepperButton}
                  onClick={() => handleQuantityChange(item.id, 1)}
                  disabled={item.quantity >= MAX_QUANTITY}
                  aria-label={`Increase quantity of ${item.name}`}
                >
                  +
                </button>
              </span>
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
            <span>
              Code <strong>{appliedPromo}</strong> applied
            </span>
            <button type="button" className={styles.linkButton} onClick={handleRemovePromo}>
              Remove
            </button>
          </div>
        ) : (
          <div className={styles.promoRow}>
            <label htmlFor="promo-input" className={styles.visuallyHidden}>
              Promo code
            </label>
            <input
              id="promo-input"
              type="text"
              className={styles.promoInput}
              placeholder="Enter promo code"
              value={promoInput}
              onChange={(event) => {
                setPromoInput(event.target.value);
                setPromoError(null);
              }}
            />
            <button type="button" className={styles.secondaryButton} onClick={handleApplyPromo}>
              Apply
            </button>
          </div>
        )}
        {promoError && (
          <p className={styles.promoError} role="alert">
            {promoError}
          </p>
        )}
      </section>

      <section className={styles.card} aria-labelledby="summary-heading">
        <h2 id="summary-heading" className={styles.cardTitle}>
          Order summary
        </h2>
        <dl className={styles.priceList}>
          <div className={styles.priceRow}>
            <dt>Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div className={styles.priceRow}>
            <dt>Delivery</dt>
            <dd>{deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</dd>
          </div>
          {discount > 0 && (
            <div className={styles.priceRow}>
              <dt>Discount</dt>
              <dd className={styles.discountValue}>−{formatPrice(discount)}</dd>
            </div>
          )}
          <div className={`${styles.priceRow} ${styles.totalRow}`}>
            <dt>Total</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>
      </section>

      {placed ? (
        <p className={styles.confirmation} role="status">
          Order placed! You'll get a notification when it's on its way.
        </p>
      ) : (
        <button type="button" className={styles.placeOrderButton} onClick={() => setPlaced(true)}>
          Place order · {formatPrice(total)}
        </button>
      )}
    </div>
  );
}
