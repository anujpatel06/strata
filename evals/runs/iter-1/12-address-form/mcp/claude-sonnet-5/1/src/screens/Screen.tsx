'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Alert, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Select, SelectItem, TextArea, TextField } from '@strata/react';
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

interface FormState {
  fullName: string;
  phone: string;
  emirate: string;
  area: string;
  building: string;
  flatNumber: string;
  notes: string;
}

// Mock state: a prior submit attempt where the phone was left blank and the flat number has an invalid format.
const initialState: FormState = {
  fullName: 'Fatima Al Marri',
  phone: '',
  emirate: 'dubai',
  area: 'Al Barsha',
  building: 'Marina View, Building 12',
  flatNumber: '4B/2',
  notes: 'Leave with the security desk if no one answers.',
};

const FLAT_NUMBER_PATTERN = /^[A-Za-z0-9-]+$/;

function validate(fields: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (!fields.fullName.trim()) errors.fullName = 'Enter the recipient’s full name.';
  if (!fields.phone.trim()) errors.phone = 'Enter a phone number so the driver can reach you.';
  if (!fields.emirate) errors.emirate = 'Choose an emirate.';
  if (!fields.area.trim()) errors.area = 'Enter the area or neighbourhood.';
  if (fields.flatNumber.trim() && !FLAT_NUMBER_PATTERN.test(fields.flatNumber.trim())) {
    errors.flatNumber = 'Use only letters, numbers and hyphens, e.g. 12A or 4B-2.';
  }

  return errors;
}

export default function Screen() {
  const [fields, setFields] = useState<FormState>(initialState);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(true);

  const errors = useMemo(() => validate(fields), [fields]);
  const errorCount = Object.keys(errors).length;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasAttemptedSubmit(true);
  }

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <CardHeader>
            <CardTitle>Delivery address</CardTitle>
            <CardDescription>Tell us where to bring your order.</CardDescription>
          </CardHeader>
          <CardContent className={styles.content}>
            {hasAttemptedSubmit && errorCount > 0 && (
              <Alert tone="danger" title="Check the highlighted fields" live="polite">
                Fix {errorCount === 1 ? 'the field below' : `the ${errorCount} fields below`} before we can confirm delivery.
              </Alert>
            )}

            <TextField
              label="Full name"
              name="fullName"
              autoComplete="name"
              isRequired
              value={fields.fullName}
              onChange={(value) => update('fullName', value)}
              isInvalid={hasAttemptedSubmit && Boolean(errors.fullName)}
              errorMessage={errors.fullName}
            />

            <TextField
              label="Phone number"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="050 123 4567"
              isRequired
              value={fields.phone}
              onChange={(value) => update('phone', value)}
              isInvalid={hasAttemptedSubmit && Boolean(errors.phone)}
              errorMessage={errors.phone}
            />

            <Select
              label="Emirate"
              placeholder="Choose an emirate"
              isRequired
              selectedKey={fields.emirate || null}
              onSelectionChange={(key) => update('emirate', (key as string) ?? '')}
              isInvalid={hasAttemptedSubmit && Boolean(errors.emirate)}
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
              description="Neighbourhood or community, e.g. Al Barsha."
              isRequired
              value={fields.area}
              onChange={(value) => update('area', value)}
              isInvalid={hasAttemptedSubmit && Boolean(errors.area)}
              errorMessage={errors.area}
            />

            <div className={styles.row}>
              <TextField
                label="Building"
                name="building"
                description="Building name or number."
                value={fields.building}
                onChange={(value) => update('building', value)}
              />

              <TextField
                label="Flat number"
                name="flatNumber"
                value={fields.flatNumber}
                onChange={(value) => update('flatNumber', value)}
                isInvalid={hasAttemptedSubmit && Boolean(errors.flatNumber)}
                errorMessage={errors.flatNumber}
              />
            </div>

            <TextArea
              label="Delivery notes"
              name="notes"
              description="Landmarks, gate codes or handling instructions."
              rows={3}
              value={fields.notes}
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
