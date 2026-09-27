import { useState } from 'react';
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
  Link,
  Select,
  SelectItem,
} from '@strata/react';
import { IconArrowLeft } from '@strata/icons';
import styles from './Screen.module.css';

const CURRENCY = 'USD';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

const ORDER = {
  number: 'GR-48213',
  placedOn: '24 Sep 2026',
};

const ORDER_ITEMS: OrderItem[] = [
  { id: 'bananas', name: 'Organic bananas (1 kg)', quantity: 2, price: 1.49 },
  { id: 'milk', name: 'Whole milk (1 L)', quantity: 1, price: 2.1 },
  { id: 'bread', name: 'Sourdough bread', quantity: 1, price: 3.75 },
  { id: 'eggs', name: 'Free-range eggs (12)', quantity: 1, price: 4.2 },
  { id: 'tomatoes', name: 'Cherry tomatoes (250 g)', quantity: 3, price: 1.85 },
];

const RETURN_REASONS = [
  { id: 'damaged', label: 'Damaged or spoiled' },
  { id: 'wrong-item', label: 'Wrong item delivered' },
  { id: 'missing-item', label: 'Item missing from order' },
  { id: 'quality', label: 'Quality not as expected' },
  { id: 'not-needed', label: 'No longer needed' },
  { id: 'other', label: 'Other reason' },
];

export default function Screen() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [reasons, setReasons] = useState<Record<string, string | null>>({});
  const [submitted, setSubmitted] = useState(false);

  const toggleItem = (id: string, isSelected: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: isSelected }));
    if (!isSelected) {
      setReasons((prev) => ({ ...prev, [id]: null }));
    }
  };

  const setReason = (id: string, reasonId: string | null) => {
    setReasons((prev) => ({ ...prev, [id]: reasonId }));
  };

  const selectedItems = ORDER_ITEMS.filter((item) => selected[item.id]);
  const refundTotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const canSubmit = selectedItems.length > 0 && selectedItems.every((item) => reasons[item.id]);

  return (
    <div className={styles.page}>
      <Link variant="standalone" href="#orders" className={styles.backLink}>
        <IconArrowLeft aria-hidden />
        Back to order
      </Link>

      <div className={styles.header}>
        <h1 className={styles.title}>Return items</h1>
        <p className={styles.subtitle}>
          Order #{ORDER.number} · Placed on {ORDER.placedOn}
        </p>
      </div>

      {submitted ? (
        <Alert tone="success" title="Return requested" live="polite">
          We're processing a return for {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'}. Your
          refund of <Amount value={refundTotal} currency={CURRENCY} symbol="inline" /> will reach your original
          payment method in 3–5 days.
        </Alert>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle level={2}>Items in this order</CardTitle>
              <CardDescription>Select what you'd like to return and tell us why.</CardDescription>
            </CardHeader>
            <CardContent variant="inset">
              <ul className={styles.itemsList}>
                {ORDER_ITEMS.map((item) => {
                  const isSelected = Boolean(selected[item.id]);
                  return (
                    <li key={item.id} className={styles.itemRow}>
                      <div className={styles.itemMain}>
                        <Checkbox
                          isSelected={isSelected}
                          onChange={(value) => toggleItem(item.id, value)}
                          description={
                            <>
                              Qty {item.quantity} · <Amount value={item.price} currency={CURRENCY} symbol="inline" size="sm" /> each
                            </>
                          }
                        >
                          {item.name}
                        </Checkbox>
                        <span className={styles.lineTotal}>
                          <Amount value={item.price * item.quantity} currency={CURRENCY} size="sm" />
                        </span>
                      </div>
                      {isSelected && (
                        <div className={styles.reasonField}>
                          <Select
                            label="Reason for return"
                            placeholder="Choose a reason"
                            size="sm"
                            selectedKey={reasons[item.id] ?? null}
                            onSelectionChange={(key) => setReason(item.id, key as string | null)}
                          >
                            {RETURN_REASONS.map((reason) => (
                              <SelectItem key={reason.id} id={reason.id}>
                                {reason.label}
                              </SelectItem>
                            ))}
                          </Select>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
            <CardFooter divider className={styles.summary}>
              <div className={styles.summaryLabel}>
                <span className={styles.summaryCount}>
                  {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} selected
                </span>
                <span className={styles.summaryTotalLabel}>Refund total</span>
              </div>
              <Amount value={refundTotal} currency={CURRENCY} size="lg" tone="brand" />
            </CardFooter>
          </Card>

          <div className={styles.actions}>
            <Button variant="primary" isDisabled={!canSubmit} onPress={() => setSubmitted(true)}>
              Submit return
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
