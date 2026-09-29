import { useState, type Key } from 'react';
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
  IconTile,
  Link,
  Select,
  SelectItem,
} from '@syntara/react';
import { IconArrowLeft, IconPackage, IconReceiptRefund } from '@syntara/icons';
import styles from './Screen.module.css';

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

const CURRENCY = 'USD';

const ORDER: { number: string; deliveredOn: string; items: OrderItem[] } = {
  number: 'GRC-48213',
  deliveredOn: 'September 24, 2026',
  items: [
    { id: 'bananas', name: 'Organic Bananas (1 kg)', quantity: 2, unitPrice: 2.49 },
    { id: 'milk', name: 'Whole Milk (1 L)', quantity: 1, unitPrice: 3.1 },
    { id: 'bread', name: 'Sourdough Bread', quantity: 1, unitPrice: 4.75 },
    { id: 'eggs', name: 'Free-range Eggs (12 pack)', quantity: 1, unitPrice: 5.2 },
    { id: 'tomatoes', name: 'Cherry Tomatoes (500 g)', quantity: 3, unitPrice: 2.85 },
  ],
};

const RETURN_REASONS = [
  { id: 'damaged', name: 'Damaged or spoiled' },
  { id: 'wrong-item', name: 'Wrong item delivered' },
  { id: 'expired', name: 'Expired or near expiry' },
  { id: 'not-needed', name: 'No longer needed' },
  { id: 'quality', name: 'Not as described' },
  { id: 'other', name: 'Other' },
];

export default function Screen() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reasons, setReasons] = useState<Record<string, Key | null>>({});
  const [submitted, setSubmitted] = useState(false);

  function toggleItem(id: string, isSelected: boolean) {
    setSubmitted(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isSelected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function setReason(id: string, key: Key | null) {
    setSubmitted(false);
    setReasons((prev) => ({ ...prev, [id]: key }));
  }

  const selectedItems = ORDER.items.filter((item) => selectedIds.has(item.id));
  const refundTotal = selectedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const hasSelection = selectedItems.length > 0;
  const missingReason = selectedItems.some((item) => !reasons[item.id]);
  const canSubmit = hasSelection && !missingReason;

  function handleSubmit() {
    if (!canSubmit) return;
    setSubmitted(true);
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link variant="standalone" href="#order">
          <IconArrowLeft aria-hidden />
          Back to order
        </Link>

        <header className={styles.header}>
          <IconTile tint="brand" size="lg">
            <IconReceiptRefund aria-hidden />
          </IconTile>
          <div>
            <h1 className={styles.title}>Return items</h1>
            <p className={styles.subtitle}>
              Order {ORDER.number} · Delivered {ORDER.deliveredOn}
            </p>
          </div>
        </header>

        {submitted && (
          <Alert tone="success" title="Return requested" live="polite">
            We’ll email you a shipping label. Your refund is issued once{' '}
            {selectedItems.length === 1 ? 'the item is' : 'the items are'} received.
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle level={2}>Select items to return</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className={styles.itemList}>
              {ORDER.items.map((item) => {
                const isSelected = selectedIds.has(item.id);
                const lineTotal = item.quantity * item.unitPrice;
                return (
                  <li key={item.id} className={styles.itemRow}>
                    <IconTile size="sm" tint="none">
                      <IconPackage aria-hidden />
                    </IconTile>
                    <div className={styles.itemMain}>
                      <Checkbox
                        isSelected={isSelected}
                        onChange={(value) => toggleItem(item.id, value)}
                        description={
                          <>
                            Qty {item.quantity} ·{' '}
                            <Amount value={item.unitPrice} currency={CURRENCY} size="sm" symbol="inline" /> each
                          </>
                        }
                      >
                        {item.name}
                      </Checkbox>
                      {isSelected && (
                        <div className={styles.reasonField}>
                          <Select
                            label={`Reason for returning ${item.name}`}
                            placeholder="Choose a reason"
                            size="sm"
                            items={RETURN_REASONS}
                            selectedKey={reasons[item.id] ?? null}
                            onSelectionChange={(key) => setReason(item.id, key)}
                          >
                            {(reason) => <SelectItem id={reason.id}>{reason.name}</SelectItem>}
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className={styles.itemAmount}>
                      <Amount value={lineTotal} currency={CURRENCY} size="sm" />
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
          <CardFooter divider>
            <div className={styles.footerContent}>
              <div className={styles.summary}>
                <span className={styles.summaryLabel}>Refund total</span>
                <Amount value={refundTotal} currency={CURRENCY} size="lg" tone="brand" />
              </div>
              <div className={styles.actions}>
                {hasSelection && missingReason && (
                  <p className={styles.hint}>Choose a reason for each selected item.</p>
                )}
                <Button onPress={handleSubmit} isDisabled={!canSubmit || submitted}>
                  {submitted ? 'Return requested' : 'Submit return'}
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
