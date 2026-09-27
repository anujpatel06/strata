import { useState, type FormEvent } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  IconTile,
  Select,
  SelectItem,
  TextArea,
  TextField,
} from '@strata/react';
import { IconMapPin } from '@strata/icons';
import styles from './Screen.module.css';

interface Emirate {
  id: string;
  label: string;
}

const EMIRATES: Emirate[] = [
  { id: 'abu-dhabi', label: 'Abu Dhabi' },
  { id: 'dubai', label: 'Dubai' },
  { id: 'sharjah', label: 'Sharjah' },
  { id: 'ajman', label: 'Ajman' },
  { id: 'umm-al-quwain', label: 'Umm Al Quwain' },
  { id: 'ras-al-khaimah', label: 'Ras Al Khaimah' },
  { id: 'fujairah', label: 'Fujairah' },
];

interface AddressForm {
  fullName: string;
  phone: string;
  emirate: string;
  area: string;
  building: string;
  flatNumber: string;
  notes: string;
}

type Errors = Partial<Record<keyof AddressForm, string>>;

// Mock: a delivery address already submitted once, missing the phone number and with an invalid flat number.
const initialForm: AddressForm = {
  fullName: 'Fatima Al Mazrouei',
  phone: '',
  emirate: 'dubai',
  area: 'Al Barsha 1',
  building: 'Sadaf Tower 3',
  flatNumber: '14/B',
  notes: 'Leave with the security desk if there is no answer. Please call before arriving.',
};

const PHONE_PATTERN = /^\+?[\d\s-]{7,15}$/;
const FLAT_PATTERN = /^[A-Za-z0-9-]{1,8}$/;

function validate(form: AddressForm): Errors {
  const errors: Errors = {};

  if (!form.fullName.trim()) {
    errors.fullName = 'Enter the recipient’s full name.';
  }

  if (!form.phone.trim()) {
    errors.phone = 'Enter a phone number.';
  } else if (!PHONE_PATTERN.test(form.phone.trim())) {
    errors.phone = 'Enter a valid phone number, e.g. +971 50 123 4567.';
  }

  if (!form.emirate) {
    errors.emirate = 'Choose an emirate.';
  }

  if (!form.area.trim()) {
    errors.area = 'Enter the area.';
  }

  if (form.flatNumber.trim() && !FLAT_PATTERN.test(form.flatNumber.trim())) {
    errors.flatNumber = 'Enter a valid flat number, e.g. 204 or 12B.';
  }

  return errors;
}

export default function Screen() {
  const [form, setForm] = useState<AddressForm>(initialForm);
  const [submitted, setSubmitted] = useState(true);
  const [errors, setErrors] = useState<Errors>(() => validate(initialForm));

  const hasErrors = Object.keys(errors).length > 0;

  function update<K extends keyof AddressForm>(key: K, value: AddressForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setErrors(validate(form));
  }

  return (
    <form className={styles.screen} onSubmit={handleSubmit} noValidate>
      <Card className={styles.card}>
        <CardHeader className={styles.header}>
          <IconTile size="lg">
            <IconMapPin />
          </IconTile>
          <div>
            <CardTitle level={1} className={styles.title}>
              Delivery address
            </CardTitle>
            <CardDescription>Tell us where to bring your order.</CardDescription>
          </div>
        </CardHeader>

        <CardContent className={styles.content}>
          {submitted && hasErrors && (
            <Alert tone="danger" title="Check the highlighted fields" className={styles.alert}>
              Some details are missing or don’t look right.
            </Alert>
          )}

          <div className={styles.grid}>
            <TextField
              label="Full name"
              isRequired
              value={form.fullName}
              onChange={(value) => update('fullName', value)}
              isInvalid={submitted && !!errors.fullName}
              errorMessage={errors.fullName}
              placeholder="e.g. Fatima Al Mazrouei"
              className={styles.spanFull}
            />

            <TextField
              label="Phone number"
              isRequired
              type="tel"
              value={form.phone}
              onChange={(value) => update('phone', value)}
              isInvalid={submitted && !!errors.phone}
              errorMessage={errors.phone}
              placeholder="+971 50 123 4567"
            />

            <Select
              label="Emirate"
              isRequired
              placeholder="Choose an emirate"
              selectedKey={form.emirate || null}
              onSelectionChange={(key) => update('emirate', key ? String(key) : '')}
              isInvalid={submitted && !!errors.emirate}
              errorMessage={errors.emirate}
            >
              {EMIRATES.map((emirate) => (
                <SelectItem key={emirate.id} id={emirate.id}>
                  {emirate.label}
                </SelectItem>
              ))}
            </Select>

            <TextField
              label="Area"
              isRequired
              value={form.area}
              onChange={(value) => update('area', value)}
              isInvalid={submitted && !!errors.area}
              errorMessage={errors.area}
              placeholder="e.g. Al Barsha 1"
            />

            <TextField
              label="Building / villa name or number"
              value={form.building}
              onChange={(value) => update('building', value)}
              placeholder="e.g. Sadaf Tower 3"
            />

            <TextField
              label="Flat number"
              description="Optional. Leave blank for a villa."
              value={form.flatNumber}
              onChange={(value) => update('flatNumber', value)}
              isInvalid={submitted && !!errors.flatNumber}
              errorMessage={errors.flatNumber}
              placeholder="e.g. 204 or 12B"
            />

            <TextArea
              label="Delivery notes"
              description="Optional. Gate codes, landmarks or instructions for the driver."
              value={form.notes}
              onChange={(value) => update('notes', value)}
              rows={3}
              className={styles.spanFull}
            />
          </div>
        </CardContent>

        <CardFooter divider className={styles.footer}>
          <Button type="submit" variant="primary">
            Save address
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
