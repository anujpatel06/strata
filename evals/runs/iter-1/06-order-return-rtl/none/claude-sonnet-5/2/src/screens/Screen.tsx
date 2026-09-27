import { useMemo, useState, type FormEvent } from 'react';
import styles from './Screen.module.css';

interface OrderItem {
  id: string;
  name: string;
  emoji: string;
  quantity: number;
  unitPrice: number;
}

const ORDER = {
  id: 'ORD-48213',
  placedOn: 'September 21, 2026',
  currencySymbol: '₹',
};

const ORDER_ITEMS: OrderItem[] = [
  { id: 'item-1', name: 'Organic Bananas (1 kg)', emoji: '🍌', quantity: 2, unitPrice: 60 },
  { id: 'item-2', name: 'Whole Wheat Bread', emoji: '🍞', quantity: 1, unitPrice: 45 },
  { id: 'item-3', name: 'Farm Fresh Eggs (12 pack)', emoji: '🥚', quantity: 1, unitPrice: 90 },
  { id: 'item-4', name: 'Greek Yogurt (500 g)', emoji: '🥣', quantity: 3, unitPrice: 55 },
  { id: 'item-5', name: 'Almond Milk (1 L)', emoji: '🥛', quantity: 2, unitPrice: 150 },
];

const RETURN_REASONS = [
  'Damaged or spoiled',
  'Wrong item delivered',
  'Missing from delivery',
  'Item expired',
  'No longer needed',
  'Better price found elsewhere',
  'Other',
];

function formatMoney(amount: number) {
  return `${ORDER.currencySymbol}${amount.toFixed(2)}`;
}

function BackArrow() {
  return (
    <svg
      className={styles.backArrow}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M13 8H3M3 8L7.5 3.5M3 8L7.5 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Screen() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const selectedItems = useMemo(
    () => ORDER_ITEMS.filter((item) => selected[item.id]),
    [selected],
  );

  const refundTotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [selectedItems],
  );

  const missingReasonCount = selectedItems.filter((item) => !reasons[item.id]).length;
  const canSubmit = selectedItems.length > 0 && missingReasonCount === 0;

  function toggleItem(id: string) {
    setSelected((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      return next;
    });
    setReasons((prev) => {
      if (selected[id]) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return prev;
    });
  }

  function setReason(id: string, reason: string) {
    setReasons((prev) => ({ ...prev, [id]: reason }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitted(true);
  }

  function handleBack() {
    setSubmitted(false);
    setSelected({});
    setReasons({});
  }

  if (submitted) {
    return (
      <div className={styles.screen}>
        <div className={styles.confirmation}>
          <div className={styles.confirmationIcon} aria-hidden="true">
            ✓
          </div>
          <h1 className={styles.confirmationTitle}>Return request submitted</h1>
          <p className={styles.confirmationBody}>
            We&rsquo;re reviewing your return for order {ORDER.id}. Your refund of{' '}
            <strong>{formatMoney(refundTotal)}</strong> will be processed once the items are picked
            up.
          </p>
          <button type="button" className={styles.primaryButton} onClick={handleBack}>
            Back to order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <a
        href="#"
        className={styles.backLink}
        onClick={(event) => event.preventDefault()}
      >
        <BackArrow />
        Back
      </a>

      <header className={styles.header}>
        <h1 className={styles.title}>Return items</h1>
        <p className={styles.subtitle}>
          Order {ORDER.id} &bull; Placed on {ORDER.placedOn}
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <ul className={styles.itemList}>
          {ORDER_ITEMS.map((item) => {
            const isSelected = Boolean(selected[item.id]);
            const reasonId = `reason-${item.id}`;
            const checkboxId = `select-${item.id}`;
            const lineTotal = item.quantity * item.unitPrice;

            return (
              <li
                key={item.id}
                className={`${styles.itemRow} ${isSelected ? styles.itemRowSelected : ''}`}
              >
                <input
                  type="checkbox"
                  id={checkboxId}
                  className={styles.checkbox}
                  checked={isSelected}
                  onChange={() => toggleItem(item.id)}
                />

                <label htmlFor={checkboxId} className={styles.itemThumb} aria-hidden="true">
                  {item.emoji}
                </label>

                <label htmlFor={checkboxId} className={styles.itemInfo}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemMeta}>
                    Qty {item.quantity} &bull; {formatMoney(item.unitPrice)} each
                  </span>
                </label>

                <span className={styles.itemPrice}>{formatMoney(lineTotal)}</span>

                <div className={styles.reasonField}>
                  <label htmlFor={reasonId} className={styles.reasonLabel}>
                    Reason for return
                  </label>
                  <select
                    id={reasonId}
                    className={styles.reasonSelect}
                    value={reasons[item.id] ?? ''}
                    disabled={!isSelected}
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
                </div>
              </li>
            );
          })}
        </ul>

        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Items selected</span>
            <span>{selectedItems.length}</span>
          </div>
          <div className={styles.summaryRowTotal}>
            <span>Refund total</span>
            <span>{formatMoney(refundTotal)}</span>
          </div>
          {selectedItems.length > 0 && missingReasonCount > 0 && (
            <p className={styles.summaryHint}>
              Choose a reason for each item you&rsquo;re returning to continue.
            </p>
          )}
          {selectedItems.length === 0 && (
            <p className={styles.summaryHint}>Select at least one item to return.</p>
          )}

          <button type="submit" className={styles.primaryButton} disabled={!canSubmit}>
            Submit return
          </button>
        </div>
      </form>
    </div>
  );
}
