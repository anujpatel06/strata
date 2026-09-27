'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Amount,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  CheckboxGroup,
  Link,
  Select,
  SelectItem,
} from '@strata/react';
import { IconArrowLeft } from '@strata/icons';
import styles from './Screen.module.css';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

const CURRENCY = 'USD';

const ORDER = {
  id: 'GR-48213',
  placedOn: 'September 12, 2026',
};

const ORDER_ITEMS: OrderItem[] = [
  { id: 'bananas', name: 'Organic bananas, 1 bunch', quantity: 1, unitPrice: 2.49 },
  { id: 'milk', name: 'Whole milk, 1L', quantity: 2, unitPrice: 3.19 },
  { id: 'bread', name: 'Sourdough loaf', quantity: 1, unitPrice: 4.99 },
  { id: 'eggs', name: 'Free-range eggs, dozen', quantity: 1, unitPrice: 5.49 },
  { id: 'tomatoes', name: 'Cherry tomatoes, 250g', quantity: 3, unitPrice: 2.79 },
];

const RETURN_REASONS = [
  { id: 'damaged', label: 'Damaged or defective' },
  { id: 'wrong-item', label: 'Wrong item delivered' },
  { id: 'not-needed', label: 'No longer needed' },
  { id: 'expired', label: 'Item was expired' },
  { id: 'quality', label: 'Quality not as expected' },
  { id: 'other', label: 'Other' },
];

export default function Screen() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [attempted, setAttempted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const refundTotal = useMemo(
    () =>
      ORDER_ITEMS.filter((item) => selectedIds.includes(item.id)).reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      ),
    [selectedIds],
  );

  const canSubmit = selectedIds.length > 0 && selectedIds.every((id) => reasons[id]);

  const handleSubmit = () => {
    if (!canSubmit) {
      setAttempted(true);
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className={styles.page}>
      <Link variant="standalone" href="#orders" className={styles.backLink}>
        <IconArrowLeft aria-hidden />
        Back to order
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>Return items</h1>
        <p className={styles.subtitle}>
          Order #{ORDER.id} · Placed {ORDER.placedOn}
        </p>
      </header>

      {submitted ? (
        <Alert tone="success" title="Return request submitted" live="polite">
          We&apos;ll email you a shipping label and refund {selectedIds.length === 1 ? 'this item' : 'these items'} once
          they arrive at our warehouse.
        </Alert>
      ) : (
        <Card>
          <CardHeader divider>
            <CardTitle level={2}>Select items to return</CardTitle>
            <CardDescription>Choose the items you want to send back and tell us why.</CardDescription>
          </CardHeader>

          <CardContent className={styles.itemList}>
            <CheckboxGroup
              aria-label="Items in this order"
              value={selectedIds}
              onChange={setSelectedIds}
              className={styles.checkboxGroup}
            >
              {ORDER_ITEMS.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const lineTotal = item.quantity * item.unitPrice;

                return (
                  <div key={item.id} className={styles.item}>
                    <div className={styles.itemRow}>
                      <Checkbox
                        value={item.id}
                        description={`Qty ${item.quantity} · ${new Intl.NumberFormat(undefined, {
                          style: 'currency',
                          currency: CURRENCY,
                        }).format(item.unitPrice)} each`}
                      >
                        {item.name}
                      </Checkbox>
                      <Amount value={lineTotal} currency={CURRENCY} size="sm" className={styles.itemAmount} />
                    </div>

                    {isSelected && (
                      <Select
                        label="Reason for return"
                        placeholder="Choose a reason"
                        size="sm"
                        selectedKey={reasons[item.id] ?? null}
                        onSelectionChange={(key) =>
                          setReasons((prev) => ({ ...prev, [item.id]: key as string }))
                        }
                        isInvalid={attempted && !reasons[item.id]}
                        errorMessage="Choose a reason for this item"
                        className={styles.reasonSelect}
                      >
                        {RETURN_REASONS.map((reason) => (
                          <SelectItem key={reason.id} id={reason.id}>
                            {reason.label}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  </div>
                );
              })}
            </CheckboxGroup>
          </CardContent>

          <CardFooter divider className={styles.footer}>
            <div className={styles.refundRow}>
              <span className={styles.refundLabel}>Refund total</span>
              <Amount value={refundTotal} currency={CURRENCY} size="lg" />
            </div>
            <Button onPress={handleSubmit}>Submit return</Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
