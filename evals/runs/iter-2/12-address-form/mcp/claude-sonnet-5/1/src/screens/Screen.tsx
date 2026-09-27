'use client';

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

// Mock: the person already submitted once, with the phone missing and an invalid flat number.
const initialValues = {
  fullName: 'Sara Al Mazrouei',
  phone: '',
  emirate: 'dubai',
  area: 'Jumeirah',
  building: 'Marina Heights Tower',
  flatNumber: '12B-',
  deliveryNotes: 'Leave with the building concierge if I don’t answer.',
};

const initialTouched = {
  fullName: true,
  phone: true,
  emirate: true,
  area: true,
  flatNumber: true,
};

function validate(values: typeof initialValues) {
  const errors: Partial<Record<keyof typeof initialValues, string>> = {};
  if (!values.fullName.trim()) errors.fullName = 'Enter the recipient’s full name.';
  if (!values.phone.trim()) errors.phone = 'Enter a phone number so the courier can reach you.';
  if (!values.emirate) errors.emirate = 'Choose an emirate.';
  if (!values.area.trim()) errors.area = 'Enter the area.';
  if (values.flatNumber && !/^\d+[A-Za-z]?$/.test(values.flatNumber)) {
    errors.flatNumber = 'Enter a valid flat number, e.g. 204 or 12B.';
  }
  return errors;
}

export default function Screen() {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState<Record<string, boolean>>(initialTouched);

  const errors = validate(values);

  function update<K extends keyof typeof initialValues>(key: K, value: (typeof initialValues)[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setTouched((t) => ({ ...t, [key]: true }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({
      fullName: true,
      phone: true,
      emirate: true,
      area: true,
      building: true,
      flatNumber: true,
      deliveryNotes: true,
    });
  }

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <form onSubmit={handleSubmit} noValidate>
          <CardHeader>
            <CardTitle>Delivery address</CardTitle>
            <CardDescription>Where should we deliver your order?</CardDescription>
          </CardHeader>
          <CardContent className={styles.grid}>
            <TextField
              label="Full name"
              name="fullName"
              autoComplete="name"
              isRequired
              value={values.fullName}
              onChange={(value) => update('fullName', value)}
              isInvalid={touched.fullName && Boolean(errors.fullName)}
              errorMessage={errors.fullName}
            />
            <TextField
              label="Phone number"
              name="phone"
              type="tel"
              autoComplete="tel"
              description="We’ll call or text about the delivery."
              isRequired
              value={values.phone}
              onChange={(value) => update('phone', value)}
              isInvalid={touched.phone && Boolean(errors.phone)}
              errorMessage={errors.phone}
            />
            <Select
              label="Emirate"
              placeholder="Choose an emirate"
              isRequired
              selectedKey={values.emirate}
              onSelectionChange={(key) => update('emirate', String(key ?? ''))}
              isInvalid={touched.emirate && Boolean(errors.emirate)}
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
              name="area"
              isRequired
              value={values.area}
              onChange={(value) => update('area', value)}
              isInvalid={touched.area && Boolean(errors.area)}
              errorMessage={errors.area}
            />
            <div className={styles.row}>
              <TextField
                label="Building"
                name="building"
                value={values.building}
                onChange={(value) => update('building', value)}
              />
              <TextField
                label="Flat number"
                name="flatNumber"
                value={values.flatNumber}
                onChange={(value) => update('flatNumber', value)}
                isInvalid={touched.flatNumber && Boolean(errors.flatNumber)}
                errorMessage={errors.flatNumber}
              />
            </div>
            <TextArea
              label="Delivery notes"
              name="deliveryNotes"
              description="Landmarks, gate codes or other instructions for the courier."
              rows={3}
              value={values.deliveryNotes}
              onChange={(value) => update('deliveryNotes', value)}
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
