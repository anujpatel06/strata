'use client';

import { useMemo, useState } from 'react';
import {
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
  Separator,
  type Key,
} from '@syntara/react';
import { IconArrowLeft } from '@syntara/icons';
import styles from './Screen.module.css';

const CURRENCY = 'AED';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

const ORDER = {
  id: '48213',
  placedOn: 'September 24, 2026',
};

const ORDER_ITEMS: OrderItem[] = [
  { id: 'item-1', name: 'Organic bananas, 1kg', quantity: 2, unitPrice: 6.5 },
  { id: 'item-2', name: 'Whole milk, 2L', quantity: 1, unitPrice: 9.25 },
  { id: 'item-3', name: 'Sourdough bread loaf', quantity: 1, unitPrice: 12 },
  { id: 'item-4', name: 'Free-range eggs, 12 pack', quantity: 1, unitPrice: 15.75 },
  { id: 'item-5', name: 'Baby spinach, 200g', quantity: 3, unitPrice: 5.5 },
];

const RETURN_REASONS = [
  { id: 'damaged', label: 'Item arrived damaged' },
  { id: 'wrong-item', label: 'Wrong item delivered' },
  { id: 'missing', label: 'Item was missing' },
  { id: 'quality', label: 'Quality not as expected' },
  { id: 'no-longer-needed', label: 'No longer needed' },
  { id: 'other', label: 'Other' },
];

export default function Screen() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reasons, setReasons] = useState<Record<string, Key | null>>({});

  const toggleItem = (id: string, isSelected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isSelected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const setReason = (id: string, key: Key | null) => {
    setReasons((prev) => ({ ...prev, [id]: key }));
  };

  const selectedItems = useMemo(
    () => ORDER_ITEMS.filter((item) => selectedIds.has(item.id)),
    [selectedIds],
  );

  const refundTotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [selectedItems],
  );

  const canSubmit =
    selectedItems.length > 0 && selectedItems.every((item) => reasons[item.id]);

  return (
    <div className={styles.page}>
      <Link variant="standalone" href="#orders" className={styles.backLink}>
        <IconArrowLeft aria-hidden />
        Back to order
      </Link>

      <div className={styles.header}>
        <h1 className={styles.title}>Return items</h1>
        <p className={styles.subtitle}>
          Order #{ORDER.id} · Placed on {ORDER.placedOn}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Select items to return</CardTitle>
        </CardHeader>
        <CardContent className={styles.items}>
          {ORDER_ITEMS.map((item, index) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <div key={item.id} className={styles.itemGroup}>
                {index > 0 && <Separator />}
                <div className={styles.item}>
                  <div className={styles.itemMain}>
                    <Checkbox
                      isSelected={isSelected}
                      onChange={(checked) => toggleItem(item.id, checked)}
                    >
                      {item.name}
                    </Checkbox>
                    <Amount
                      value={item.unitPrice * item.quantity}
                      currency={CURRENCY}
                      size="sm"
                    />
                  </div>
                  <p className={styles.itemDetail}>
                    <span>Qty {item.quantity} · </span>
                    <Amount value={item.unitPrice} currency={CURRENCY} size="sm" />
                    <span> each</span>
                  </p>
                  {isSelected && (
                    <Select
                      label="Reason for return"
                      placeholder="Choose a reason"
                      selectedKey={reasons[item.id] ?? null}
                      onSelectionChange={(key) => setReason(item.id, key)}
                      className={styles.reasonSelect}
                      isRequired
                    >
                      {RETURN_REASONS.map((reason) => (
                        <SelectItem key={reason.id} id={reason.id}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
        <CardFooter divider className={styles.footer}>
          <div className={styles.refund}>
            <span className={styles.refundLabel}>Refund total</span>
            <Amount value={refundTotal} currency={CURRENCY} size="lg" tone="brand" />
          </div>
          <Button isDisabled={!canSubmit}>Submit return</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
