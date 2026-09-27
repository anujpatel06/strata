import { useMemo, useState } from 'react';
import {
  Amount,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  Checkbox,
  Eyebrow,
  IconTile,
  Link,
  Select,
  SelectItem,
} from '@strata/react';
import { IconArrowLeft, IconPackage, IconReceiptRefund } from '@strata/icons';
import styles from './Screen.module.css';

interface OrderItem {
  id: string;
  name: string;
  detail: string;
  quantity: number;
  unitPrice: number;
}

const CURRENCY = 'USD';

const order = {
  id: '48213',
  placedOn: 'September 21, 2026',
  items: [
    { id: 'bananas', name: 'Organic Bananas', detail: '1 kg bunch', quantity: 2, unitPrice: 1.49 },
    { id: 'milk', name: 'Whole Milk', detail: '1 L carton', quantity: 1, unitPrice: 3.2 },
    { id: 'bread', name: 'Sourdough Bread', detail: '500 g loaf', quantity: 1, unitPrice: 4.5 },
    { id: 'eggs', name: 'Free-Range Eggs', detail: 'Pack of 12', quantity: 1, unitPrice: 5.8 },
    { id: 'tomatoes', name: 'Cherry Tomatoes', detail: '500 g punnet', quantity: 3, unitPrice: 2.1 },
  ] satisfies OrderItem[],
};

const RETURN_REASONS = [
  'Damaged or defective',
  'Missing from delivery',
  'Wrong item delivered',
  'No longer needed',
  'Quality not as expected',
  'Other',
];

export default function Screen() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const selectedCount = selected.size;

  const refundTotal = useMemo(
    () =>
      order.items
        .filter((item) => selected.has(item.id))
        .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [selected],
  );

  const canSubmit = selectedCount > 0 && [...selected].every((id) => Boolean(reasons[id]));

  function toggleItem(id: string, isSelected: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (isSelected) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleSubmit() {
    if (!canSubmit) return;
    setSubmitted(true);
  }

  return (
    <div className={styles.page}>
      <Link variant="standalone" href="#" className={styles.backLink}>
        <IconArrowLeft />
        Back to order #{order.id}
      </Link>

      <header className={styles.header}>
        <Eyebrow icon={<IconReceiptRefund />}>Order #{order.id} · Placed {order.placedOn}</Eyebrow>
        <h1 className={styles.title}>Return items</h1>
        <p className={styles.subtitle}>
          Pick the items you want to return and tell us why. We'll refund the items you select.
        </p>
      </header>

      <Card variant="outline">
        <CardContent>
          <ul className={styles.itemList}>
            {order.items.map((item) => {
              const isSelected = selected.has(item.id);
              return (
                <li key={item.id} className={styles.itemRow} data-selected={isSelected || undefined}>
                  <div className={styles.itemMain}>
                    <Checkbox
                      aria-label={`Return ${item.name}`}
                      isSelected={isSelected}
                      onChange={(value) => toggleItem(item.id, value)}
                    />
                    <IconTile tint="auto" name={item.name} size="md">
                      <IconPackage />
                    </IconTile>
                    <div className={styles.itemInfo}>
                      <p className={styles.itemName}>{item.name}</p>
                      <p className={styles.itemMeta}>
                        {item.detail} · Qty {item.quantity} ·{' '}
                        <Amount value={item.unitPrice} currency={CURRENCY} symbol="inline" formatOptions={{ maximumFractionDigits: 2 }} /> each
                      </p>
                    </div>
                    <Amount
                      className={styles.itemTotal}
                      value={item.quantity * item.unitPrice}
                      currency={CURRENCY}
                      formatOptions={{ maximumFractionDigits: 2 }}
                    />
                  </div>
                  <div className={styles.itemReason}>
                    <Select
                      size="sm"
                      aria-label={`Reason for returning ${item.name}`}
                      placeholder="Choose a reason"
                      isDisabled={!isSelected}
                      selectedKey={reasons[item.id] ?? null}
                      onSelectionChange={(key) =>
                        setReasons((prev) => ({ ...prev, [item.id]: key as string }))
                      }
                    >
                      {RETURN_REASONS.map((reason) => (
                        <SelectItem key={reason} id={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card variant="outline">
        <CardContent className={styles.summaryContent}>
          <div className={styles.summaryInfo}>
            <Badge tone={selectedCount > 0 ? 'brand' : 'neutral'} variant="soft">
              {selectedCount} of {order.items.length} items selected
            </Badge>
            <p className={styles.summaryHint}>
              Refunds are issued to your original payment method within 5–7 business days.
            </p>
          </div>
          <div className={styles.summaryAmount}>
            <span className={styles.summaryAmountLabel}>Refund total</span>
            <Amount value={refundTotal} currency={CURRENCY} size="lg" tone="brand" formatOptions={{ maximumFractionDigits: 2 }} />
          </div>
        </CardContent>
        <CardFooter divider className={styles.actions}>
          {submitted ? (
            <Badge tone="success" variant="soft" size="md">
              Return request submitted
            </Badge>
          ) : (
            <>
              {!canSubmit && (
                <p className={styles.actionsHint}>
                  {selectedCount === 0
                    ? 'Select at least one item to return.'
                    : 'Choose a reason for each selected item to continue.'}
                </p>
              )}
              <Button variant="primary" size="lg" isDisabled={!canSubmit} onPress={handleSubmit}>
                Submit return
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
