import { useMemo, useState } from 'react';
import styles from './Screen.module.css';

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

const ORDER = {
  id: 'ORD-48213',
  placedOn: 'September 24, 2026',
};

const ORDER_ITEMS: OrderItem[] = [
  { id: 'item-1', name: 'Organic Bananas (1 kg)', quantity: 2, unitPrice: 1.49 },
  { id: 'item-2', name: 'Whole Milk (1 L)', quantity: 3, unitPrice: 2.2 },
  { id: 'item-3', name: 'Sourdough Bread', quantity: 1, unitPrice: 3.75 },
  { id: 'item-4', name: 'Free-Range Eggs (12-pack)', quantity: 1, unitPrice: 4.1 },
  { id: 'item-5', name: 'Greek Yogurt (500 g)', quantity: 2, unitPrice: 3.3 },
];

const RETURN_REASONS = [
  'Damaged or spoiled',
  'Wrong item delivered',
  'Item expired',
  'Poor quality',
  'No longer needed',
  'Found a better price',
  'Other',
] as const;

function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export default function Screen() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const selectedItems = ORDER_ITEMS.filter((item) => selected[item.id]);

  const refundTotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [selectedItems],
  );

  const toggleItem = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
    setErrors((prev) => ({ ...prev, [id]: false }));
  };

  const setReason = (id: string, reason: string) => {
    setReasons((prev) => ({ ...prev, [id]: reason }));
    setErrors((prev) => ({ ...prev, [id]: false }));
  };

  const handleSubmit = () => {
    const missing: Record<string, boolean> = {};
    for (const item of selectedItems) {
      if (!reasons[item.id]) missing[item.id] = true;
    }
    if (Object.keys(missing).length > 0) {
      setErrors(missing);
      return;
    }
    setSubmitted(true);
  };

  const backLink = (
    <a className={styles.backLink} href="#">
      <span className={styles.backArrow} aria-hidden="true">
        ←
      </span>
      Back to orders
    </a>
  );

  if (submitted) {
    return (
      <div className={styles.screen}>
        <div className={styles.confirmation}>
          <span className={styles.confirmationIcon} aria-hidden="true">
            ✓
          </span>
          <h1 className={styles.confirmationTitle}>Return requested</h1>
          <p className={styles.confirmationBody}>
            We&rsquo;re processing a refund of {formatPrice(refundTotal)} for {selectedItems.length}{' '}
            {selectedItems.length === 1 ? 'item' : 'items'} from order {ORDER.id}. You&rsquo;ll get an
            email once it&rsquo;s approved.
          </p>
          {backLink}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      {backLink}

      <header className={styles.header}>
        <h1 className={styles.title}>Return items</h1>
        <p className={styles.subtitle}>
          Order {ORDER.id} &middot; Placed {ORDER.placedOn} &middot; {ORDER_ITEMS.length} items
        </p>
      </header>

      <ul className={styles.itemList}>
        {ORDER_ITEMS.map((item) => {
          const isSelected = !!selected[item.id];
          const hasError = !!errors[item.id];

          return (
            <li key={item.id} className={styles.item} data-selected={isSelected || undefined}>
              <label className={styles.itemMain}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={isSelected}
                  onChange={() => toggleItem(item.id)}
                />
                <span className={styles.itemDetails}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemMeta}>
                    Qty {item.quantity} &middot; {formatPrice(item.unitPrice)} each
                  </span>
                </span>
                <span className={styles.itemTotal}>{formatPrice(item.quantity * item.unitPrice)}</span>
              </label>

              {isSelected && (
                <div className={styles.reasonRow}>
                  <label className={styles.reasonLabel} htmlFor={`reason-${item.id}`}>
                    Reason for return
                  </label>
                  <select
                    id={`reason-${item.id}`}
                    className={styles.reasonSelect}
                    data-error={hasError || undefined}
                    value={reasons[item.id] ?? ''}
                    onChange={(event) => setReason(item.id, event.target.value)}
                  >
                    <option value="" disabled>
                      Select a reason
                    </option>
                    {RETURN_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                  {hasError && <p className={styles.reasonError}>Choose a reason to continue</p>}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className={styles.summary}>
        <div className={styles.summaryText}>
          <span className={styles.summaryCount}>
            {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} selected
          </span>
          <span className={styles.summaryTotal}>Refund total {formatPrice(refundTotal)}</span>
        </div>
        <button
          type="button"
          className={styles.submitButton}
          disabled={selectedItems.length === 0}
          onClick={handleSubmit}
        >
          Submit return
        </button>
      </div>
    </div>
  );
}
