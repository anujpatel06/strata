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
  Select,
  SelectItem,
  TextArea,
  TextField,
} from '@strata/react';
import styles from './Screen.module.css';

interface Emirate {
  id: string;
  label: string;
}

const emirates: Emirate[] = [
  { id: 'abu-dhabi', label: 'Abu Dhabi' },
  { id: 'dubai', label: 'Dubai' },
  { id: 'sharjah', label: 'Sharjah' },
  { id: 'ajman', label: 'Ajman' },
  { id: 'umm-al-quwain', label: 'Umm Al Quwain' },
  { id: 'ras-al-khaimah', label: 'Ras Al Khaimah' },
  { id: 'fujairah', label: 'Fujairah' },
];

interface AddressFormValues {
  fullName: string;
  phone: string;
  emirate: string;
  area: string;
  building: string;
  flatNumber: string;
  notes: string;
}

// Mock: the person already tried to submit, leaving the phone empty and the flat number malformed.
const initialValues: AddressFormValues = {
  fullName: 'Fatima Al Suwaidi',
  phone: '',
  emirate: 'dubai',
  area: 'Al Barsha 1',
  building: 'Marina Heights Tower',
  flatNumber: '12/A?',
  notes: 'Leave with the building concierge if I do not answer.',
};

const FLAT_NUMBER_PATTERN = /^[A-Za-z0-9-]{1,8}$/;

interface FormErrors {
  fullName?: string;
  phone?: string;
  emirate?: string;
  area?: string;
  flatNumber?: string;
}

function validate(values: AddressFormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.fullName.trim()) {
    errors.fullName = 'Enter the recipient’s full name.';
  }
  if (!values.phone.trim()) {
    errors.phone = 'Enter a phone number so the driver can reach you.';
  }
  if (!values.emirate) {
    errors.emirate = 'Choose an emirate.';
  }
  if (!values.area.trim()) {
    errors.area = 'Enter the area or neighbourhood.';
  }
  if (values.flatNumber.trim() && !FLAT_NUMBER_PATTERN.test(values.flatNumber.trim())) {
    errors.flatNumber = 'Enter a valid flat number, e.g. 1204 or G-04.';
  }
  return errors;
}

export default function Screen() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>(() => validate(initialValues));
  const [submitted, setSubmitted] = useState(true);

  function update<K extends keyof AddressFormValues>(key: K, value: AddressFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setErrors(validate(values));
  }

  const hasErrors = submitted && Object.keys(errors).length > 0;

  return (
    <form className={styles.screen} onSubmit={handleSubmit} noValidate>
      <Card className={styles.card}>
        <CardHeader divider>
          <CardTitle level={1}>Delivery address</CardTitle>
          <CardDescription>Tell us where to bring your order.</CardDescription>
        </CardHeader>
        <CardContent className={styles.content}>
          {hasErrors && (
            <Alert tone="danger" title="Some details need your attention" live="polite">
              Please fix the highlighted fields before saving this address.
            </Alert>
          )}
          <div className={styles.grid}>
            <TextField
              label="Full name"
              isRequired
              value={values.fullName}
              onChange={(value) => update('fullName', value)}
              isInvalid={!!errors.fullName}
              errorMessage={errors.fullName}
              className={styles.field}
            />
            <TextField
              label="Phone number"
              type="tel"
              isRequired
              placeholder="e.g. 050 123 4567"
              value={values.phone}
              onChange={(value) => update('phone', value)}
              isInvalid={!!errors.phone}
              errorMessage={errors.phone}
              className={styles.field}
            />
            <Select
              label="Emirate"
              isRequired
              placeholder="Choose an emirate"
              selectedKey={values.emirate || null}
              onSelectionChange={(key) => update('emirate', key ? String(key) : '')}
              isInvalid={!!errors.emirate}
              errorMessage={errors.emirate}
              items={emirates}
              className={styles.field}
            >
              {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
            </Select>
            <TextField
              label="Area"
              isRequired
              placeholder="e.g. Al Barsha 1"
              value={values.area}
              onChange={(value) => update('area', value)}
              isInvalid={!!errors.area}
              errorMessage={errors.area}
              className={styles.field}
            />
            <TextField
              label="Building"
              description="Building name or number"
              value={values.building}
              onChange={(value) => update('building', value)}
              className={styles.field}
            />
            <TextField
              label="Flat number"
              placeholder="e.g. 1204"
              value={values.flatNumber}
              onChange={(value) => update('flatNumber', value)}
              isInvalid={!!errors.flatNumber}
              errorMessage={errors.flatNumber}
              className={styles.field}
            />
            <TextArea
              label="Delivery notes"
              description="Optional — gate codes, landmarks or instructions for the driver."
              placeholder="e.g. Call on arrival, villa with a blue gate"
              value={values.notes}
              onChange={(value) => update('notes', value)}
              rows={3}
              className={styles.notes}
            />
          </div>
        </CardContent>
        <CardFooter divider className={styles.footer}>
          <Button type="submit" variant="primary" size="lg">
            Save address
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
