import { useMemo, useState, type FormEvent } from 'react';
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
} from '@strata/react';
import { IconArrowLeft, IconPackage } from '@strata/icons';
import styles from './Screen.module.css';

interface OrderItem {
  id: string;
  name: string;
  detail: string;
  quantity: number;
  unitPrice: number;
}

interface ReturnReason {
  id: string;
  label: string;
}

const CURRENCY = 'AED';

const ORDER = {
  id: '40218',
  placedOn: 'September 18, 2026',
};

const ORDER_ITEMS: OrderItem[] = [
  { id: 'bananas', name: 'Organic Bananas', detail: '1 kg pack', quantity: 2, unitPrice: 4.5 },
  { id: 'milk', name: 'Whole Milk', detail: '1 L carton', quantity: 1, unitPrice: 6.25 },
  { id: 'bread', name: 'Sourdough Bread', detail: '500 g loaf', quantity: 1, unitPrice: 9 },
  { id: 'eggs', name: 'Free-Range Eggs', detail: '12-pack', quantity: 1, unitPrice: 14.5 },
  { id: 'yogurt', name: 'Greek Yogurt', detail: '500 g tub', quantity: 3, unitPrice: 5.75 },
];

const RETURN_REASONS: ReturnReason[] = [
  { id: 'damaged', label: 'Damaged or spoiled' },
  { id: 'wrong-item', label: 'Wrong item delivered' },
  { id: 'missing', label: 'Missing from delivery' },
  { id: 'not-needed', label: 'No longer needed' },
  { id: 'quality', label: 'Quality not as expected' },
  { id: 'other', label: 'Other' },
];

export default function Screen() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const selectedItems = useMemo(() => ORDER_ITEMS.filter((item) => selected[item.id]), [selected]);
  const refundTotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [selectedItems],
  );
  const canSubmit = selectedItems.length > 0 && selectedItems.every((item) => reasons[item.id]);

  function toggleItem(id: string, isSelected: boolean) {
    setSelected((prev) => ({ ...prev, [id]: isSelected }));
    if (!isSelected) {
      setReasons((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  function setReasonFor(id: string, reasonId: string) {
    setReasons((prev) => ({ ...prev, [id]: reasonId }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (canSubmit) setSubmitted(true);
  }

  return (
    <div className={styles.page}>
      <Link href="#" variant="standalone" className={styles.backLink}>
        <IconArrowLeft size={18} className={styles.backIcon} />
        Back to order
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>Return items</h1>
        <p className={styles.subtitle}>
          Order #{ORDER.id} &middot; Placed {ORDER.placedOn}
        </p>
      </header>

      {submitted && (
        <Alert tone="success" title="Return requested" className={styles.alert}>
          We&rsquo;ll email a prepaid return label for {selectedItems.length}{' '}
          {selectedItems.length === 1 ? 'item' : 'items'}. Your refund of{' '}
          <Amount value={refundTotal} currency={CURRENCY} symbol="inline" /> will go back to your original
          payment method once we receive the items.
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader divider>
            <CardTitle level={2}>Select items to return</CardTitle>
          </CardHeader>

          <CardContent>
            <fieldset className={styles.fieldset} disabled={submitted}>
              <legend className={styles.srOnly}>Items in this order</legend>
              <ul className={styles.itemList}>
                {ORDER_ITEMS.map((item) => {
                  const isSelected = !!selected[item.id];
                  return (
                    <li key={item.id} className={styles.itemRow}>
                      <div className={styles.itemMain}>
                        <IconTile tint="auto" name={item.name} size="sm">
                          <IconPackage />
                        </IconTile>
                        <Checkbox
                          isSelected={isSelected}
                          onChange={(value) => toggleItem(item.id, value)}
                          className={styles.checkbox}
                        >
                          <span className={styles.itemText}>
                            <span className={styles.itemName}>{item.name}</span>
                            <span className={styles.itemDetail}>
                              {item.detail} &middot; Qty {item.quantity}
                            </span>
                          </span>
                        </Checkbox>
                        <Amount
                          value={item.unitPrice * item.quantity}
                          currency={CURRENCY}
                          size="sm"
                          className={styles.itemPrice}
                        />
                      </div>

                      {isSelected && (
                        <div className={styles.reasonRow}>
                          <Select
                            label="Reason for return"
                            placeholder="Choose a reason"
                            size="sm"
                            selectedKey={reasons[item.id] ?? null}
                            onSelectionChange={(key) => setReasonFor(item.id, String(key))}
                            className={styles.reasonSelect}
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
            </fieldset>
          </CardContent>

          <CardFooter divider className={styles.summary}>
            <div className={styles.summaryLabel}>
              <span>Refund total</span>
              <span className={styles.summaryHint}>
                {selectedItems.length} of {ORDER_ITEMS.length} items selected
              </span>
            </div>
            <Amount value={refundTotal} currency={CURRENCY} size="lg" tone="brand" />
          </CardFooter>
        </Card>

        <div className={styles.actions}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isDisabled={!canSubmit || submitted}
            className={styles.submitButton}
          >
            {submitted ? 'Return requested' : 'Submit return'}
          </Button>
        </div>
      </form>
    </div>
  );
}
