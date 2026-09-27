import { useState } from 'react';
import {
  Alert,
  Amount,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Link,
  Select,
  SelectItem,
} from '@strata/react';
import { IconArrowLeft } from '@strata/icons';
import styles from './Screen.module.css';

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

const ORDER = {
  id: 'ORD-48213',
  placedOn: 'September 20, 2026',
  currency: 'USD',
};

const ITEMS: OrderItem[] = [
  { id: 'item-1', name: 'Organic bananas, 1 kg', quantity: 2, unitPrice: 1.49 },
  { id: 'item-2', name: 'Whole milk, 1 L', quantity: 1, unitPrice: 2.29 },
  { id: 'item-3', name: 'Sourdough bread loaf', quantity: 1, unitPrice: 3.99 },
  { id: 'item-4', name: 'Free-range eggs, dozen', quantity: 1, unitPrice: 4.49 },
  { id: 'item-5', name: 'Cherry tomatoes, 250 g', quantity: 3, unitPrice: 2.79 },
];

const REASONS = [
  { id: 'damaged', label: 'Damaged or spoiled' },
  { id: 'wrong-item', label: 'Wrong item delivered' },
  { id: 'missing-item', label: "Item wasn't delivered" },
  { id: 'quality', label: 'Quality not as expected' },
  { id: 'no-longer-needed', label: 'No longer needed' },
  { id: 'other', label: 'Other reason' },
];

export default function Screen() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'error' | 'submitted'>('idle');

  function toggleItem(id: string, isSelected: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isSelected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
    setStatus('idle');
  }

  function setReason(id: string, reasonId: string) {
    setReasons((prev) => ({ ...prev, [id]: reasonId }));
    setStatus('idle');
  }

  const selectedItems = ITEMS.filter((item) => selectedIds.has(item.id));
  const refundTotal = selectedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const missingReasonIds = new Set(selectedItems.filter((item) => !reasons[item.id]).map((item) => item.id));

  function handleSubmit() {
    if (selectedItems.length === 0 || missingReasonIds.size > 0) {
      setStatus('error');
      return;
    }
    setStatus('submitted');
  }

  return (
    <div className={styles.screen}>
      <Link variant="standalone" href="#order" className={styles.backLink}>
        <IconArrowLeft aria-hidden />
        Back to order
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>Return items</h1>
        <p className={styles.subtitle}>
          Order {ORDER.id} · Placed {ORDER.placedOn}
        </p>
      </header>

      {status === 'submitted' && (
        <Alert tone="success" title="Return request submitted" live="polite">
          We’ll email you a shipping label and confirm your refund once the items arrive.
        </Alert>
      )}

      {status === 'error' && (
        <Alert tone="danger" title="Choose a reason for each item" live="assertive">
          Select at least one item to return, and pick a reason for every item you’ve selected.
        </Alert>
      )}

      <Card>
        <CardHeader divider>
          <CardTitle level={2}>Items in this order</CardTitle>
        </CardHeader>

        <CardContent variant="inset">
          <ul className={styles.itemList}>
            {ITEMS.map((item) => {
              const isSelected = selectedIds.has(item.id);
              const lineTotal = item.quantity * item.unitPrice;

              return (
                <li key={item.id} className={styles.itemRow}>
                  <div className={styles.itemMain}>
                    <Checkbox isSelected={isSelected} onChange={(next) => toggleItem(item.id, next)}>
                      {item.name}
                    </Checkbox>
                    <p className={styles.itemMeta}>
                      Qty {item.quantity} ·{' '}
                      <Amount value={item.unitPrice} currency={ORDER.currency} size="sm" symbol="inline" /> each
                    </p>
                  </div>

                  <div className={styles.itemReason}>
                    <Select
                      label="Reason for return"
                      placeholder="Choose a reason"
                      size="sm"
                      isDisabled={!isSelected}
                      isInvalid={status === 'error' && missingReasonIds.has(item.id)}
                      selectedKey={reasons[item.id] ?? null}
                      onSelectionChange={(key) => setReason(item.id, key as string)}
                    >
                      {REASONS.map((reason) => (
                        <SelectItem key={reason.id} id={reason.id}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  <Amount
                    value={lineTotal}
                    currency={ORDER.currency}
                    size="sm"
                    tone={isSelected ? 'brand' : 'neutral'}
                    className={styles.itemAmount}
                  />
                </li>
              );
            })}
          </ul>
        </CardContent>

        <CardFooter divider className={styles.footer}>
          <div className={styles.refund}>
            <span className={styles.refundLabel}>Refund total</span>
            <Amount value={refundTotal} currency={ORDER.currency} size="lg" />
          </div>
          <Button onPress={handleSubmit}>Submit return</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
