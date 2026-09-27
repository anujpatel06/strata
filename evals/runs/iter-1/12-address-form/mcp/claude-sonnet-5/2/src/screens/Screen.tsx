import { useState, type FormEvent } from 'react';
import {
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

const EMIRATES = [
  { id: 'abu-dhabi', label: 'Abu Dhabi' },
  { id: 'dubai', label: 'Dubai' },
  { id: 'sharjah', label: 'Sharjah' },
  { id: 'ajman', label: 'Ajman' },
  { id: 'umm-al-quwain', label: 'Umm Al Quwain' },
  { id: 'ras-al-khaimah', label: 'Ras Al Khaimah' },
  { id: 'fujairah', label: 'Fujairah' },
];

const FLAT_PATTERN = /^[0-9]+[A-Za-z]?$/;

interface AddressForm {
  fullName: string;
  phone: string;
  emirate: string | null;
  area: string;
  building: string;
  flat: string;
  notes: string;
}

// Mock state: submitted once already, with the phone missing and the flat number in an unrecognised format.
const initialValues: AddressForm = {
  fullName: 'Fatima Al Suwaidi',
  phone: '',
  emirate: 'dubai',
  area: 'Jumeirah 1',
  building: 'Marina Heights, Tower 2',
  flat: 'Flat 12B',
  notes: 'Leave with the security desk if I do not answer.',
};

function getErrors(values: AddressForm) {
  const errors: Partial<Record<keyof AddressForm, string>> = {};
  if (!values.fullName.trim()) errors.fullName = 'Enter the recipient’s full name.';
  if (!values.phone.trim()) errors.phone = 'Enter a phone number.';
  if (!values.emirate) errors.emirate = 'Choose an emirate.';
  if (!values.area.trim()) errors.area = 'Enter an area.';
  if (values.flat.trim() && !FLAT_PATTERN.test(values.flat.trim())) {
    errors.flat = 'Enter a valid flat number, like 12 or 12B.';
  }
  return errors;
}

export default function Screen() {
  const [values, setValues] = useState<AddressForm>(initialValues);
  const [submitted, setSubmitted] = useState(true);

  const errors = getErrors(values);

  function update<K extends keyof AddressForm>(key: K, value: AddressForm[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <CardHeader>
            <CardTitle>Delivery address</CardTitle>
            <CardDescription>Where should we deliver your order?</CardDescription>
          </CardHeader>
          <CardContent className={styles.fields}>
            <div className={styles.row}>
              <TextField
                label="Full name"
                autoComplete="name"
                isRequired
                value={values.fullName}
                onChange={(value) => update('fullName', value)}
                isInvalid={submitted && !!errors.fullName}
                errorMessage={errors.fullName}
              />
              <TextField
                label="Phone number"
                type="tel"
                autoComplete="tel"
                description="We’ll call before delivery."
                isRequired
                value={values.phone}
                onChange={(value) => update('phone', value)}
                isInvalid={submitted && !!errors.phone}
                errorMessage={errors.phone}
              />
            </div>
            <div className={styles.row}>
              <Select
                label="Emirate"
                placeholder="Choose an emirate"
                isRequired
                selectedKey={values.emirate}
                onSelectionChange={(key) => update('emirate', key as string | null)}
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
                autoComplete="address-level2"
                isRequired
                value={values.area}
                onChange={(value) => update('area', value)}
                isInvalid={submitted && !!errors.area}
                errorMessage={errors.area}
              />
            </div>
            <div className={styles.row}>
              <TextField
                label="Building"
                description="Name or number."
                value={values.building}
                onChange={(value) => update('building', value)}
              />
              <TextField
                label="Flat number"
                value={values.flat}
                onChange={(value) => update('flat', value)}
                isInvalid={submitted && !!errors.flat}
                errorMessage={errors.flat}
              />
            </div>
            <TextArea
              label="Delivery notes"
              description="Landmarks, gate codes or delivery instructions."
              rows={3}
              value={values.notes}
              onChange={(value) => update('notes', value)}
            />
          </CardContent>
          <CardFooter className={styles.footer}>
            <Button type="submit">Save address</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
