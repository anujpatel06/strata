import { useMemo, useState, type FormEvent } from 'react';
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

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

const CURRENCY = 'USD';

const order = {
  number: '48213',
  placedOn: 'September 21, 2026',
};

const orderItems: OrderItem[] = [
  { id: 'item-1', name: 'Organic bananas, 1 kg', quantity: 2, unitPrice: 1.2 },
  { id: 'item-2', name: 'Whole milk, 1 L', quantity: 1, unitPrice: 2.5 },
  { id: 'item-3', name: 'Sourdough bread loaf', quantity: 1, unitPrice: 3.8 },
  { id: 'item-4', name: 'Free-range eggs, pack of 12', quantity: 2, unitPrice: 4.1 },
  { id: 'item-5', name: 'Cherry tomatoes, 500 g', quantity: 3, unitPrice: 2.3 },
];

const reasonOptions = [
  { id: 'damaged', label: 'Damaged or spoiled' },
  { id: 'wrong-item', label: 'Wrong item delivered' },
  { id: 'missing', label: 'Item missing from delivery' },
  { id: 'no-longer-needed', label: 'No longer needed' },
  { id: 'other', label: 'Other reason' },
];

export default function Screen() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const selectedItems = useMemo(() => orderItems.filter((item) => selected[item.id]), [selected]);

  const refundTotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [selectedItems],
  );

  const canSubmit = selectedItems.length > 0 && selectedItems.every((item) => Boolean(reasons[item.id]));

  const toggleItem = (id: string, isSelected: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: isSelected }));
    if (!isSelected) {
      setReasons((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
    setSubmitted(false);
  };

  const setReason = (id: string, reasonId: string) => {
    setReasons((prev) => ({ ...prev, [id]: reasonId }));
    setSubmitted(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitted(true);
  };

  return (
    <div className={styles.page}>
      <Link variant="standalone" href="#order">
        <IconArrowLeft aria-hidden />
        Back to order
      </Link>

      <div className={styles.heading}>
        <h1 className={styles.title}>Return items</h1>
        <p className={styles.subtitle}>
          Order #{order.number} &middot; Placed on {order.placedOn}
        </p>
      </div>

      {submitted && (
        <div className={styles.confirmAlert}>
          <Alert tone="success" title="Return requested" live="polite">
            We&rsquo;re reviewing your return for {selectedItems.length}{' '}
            {selectedItems.length === 1 ? 'item' : 'items'}. Your refund will be issued once it&rsquo;s processed.
          </Alert>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader divider>
            <CardTitle level={2}>Select items to return</CardTitle>
            <CardDescription>Choose a reason for each item you return.</CardDescription>
          </CardHeader>

          <CardContent variant="inset">
            <ul className={styles.itemList}>
              {orderItems.map((item) => {
                const isSelected = Boolean(selected[item.id]);
                return (
                  <li key={item.id} className={styles.itemRow}>
                    <div className={styles.itemMain}>
                      <Checkbox
                        isSelected={isSelected}
                        onChange={(next) => toggleItem(item.id, next)}
                      >
                        {item.name}
                      </Checkbox>
                      <div className={styles.itemMeta}>
                        <span className={styles.itemQty}>Qty {item.quantity}</span>
                        <Amount
                          value={item.unitPrice * item.quantity}
                          currency={CURRENCY}
                          size="sm"
                        />
                      </div>
                    </div>

                    {isSelected && (
                      <div className={styles.reasonField}>
                        <Select
                          label="Reason for return"
                          placeholder="Choose a reason"
                          selectedKey={reasons[item.id] ?? null}
                          onSelectionChange={(key) => setReason(item.id, String(key))}
                          size="sm"
                        >
                          {reasonOptions.map((reason) => (
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

          <CardFooter divider style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div className={styles.refundSummary}>
              <span className={styles.refundLabel}>Refund total</span>
              <Amount value={refundTotal} currency={CURRENCY} size="lg" />
            </div>
            <Button type="submit" isDisabled={!canSubmit}>
              Submit return
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
