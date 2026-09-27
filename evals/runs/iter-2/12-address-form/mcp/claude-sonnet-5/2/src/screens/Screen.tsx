'use client';

import { useState } from 'react';
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

const FLAT_NUMBER_PATTERN = /^[0-9]+[A-Za-z]?$/;

export default function Screen() {
  // Mock state: the person has already submitted once, with the phone left
  // blank and the flat number mistyped, so both errors show on load.
  const [submitted, setSubmitted] = useState(true);
  const [fullName, setFullName] = useState('Fatima Al Mazrouei');
  const [phone, setPhone] = useState('');
  const [emirate, setEmirate] = useState('dubai');
  const [area, setArea] = useState('Al Barsha 1');
  const [building, setBuilding] = useState('Marina Heights, Tower 2');
  const [flat, setFlat] = useState('12-B');
  const [notes, setNotes] = useState('Leave with the security desk if no answer.');

  const phoneMissing = submitted && phone.trim() === '';
  const flatInvalid = submitted && flat.trim() !== '' && !FLAT_NUMBER_PATTERN.test(flat.trim());

  return (
    <Card className={styles.card}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <CardHeader>
          <CardTitle>Delivery address</CardTitle>
          <CardDescription>Tell us where to deliver your order.</CardDescription>
        </CardHeader>
        <CardContent className={styles.grid}>
          <TextField
            className={styles.span2}
            label="Full name"
            name="fullName"
            autoComplete="name"
            isRequired
            value={fullName}
            onChange={setFullName}
          />
          <TextField
            label="Phone number"
            name="phone"
            type="tel"
            autoComplete="tel"
            isRequired
            value={phone}
            onChange={setPhone}
            isInvalid={phoneMissing}
            errorMessage="Enter a phone number."
          />
          <Select
            label="Emirate"
            name="emirate"
            placeholder="Choose an emirate"
            isRequired
            selectedKey={emirate}
            onSelectionChange={(key) => setEmirate(String(key))}
          >
            {EMIRATES.map((item) => (
              <SelectItem key={item.id} id={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </Select>
          <TextField
            className={styles.span2}
            label="Area"
            name="area"
            isRequired
            value={area}
            onChange={setArea}
          />
          <TextField
            label="Building / villa"
            name="building"
            value={building}
            onChange={setBuilding}
          />
          <TextField
            label="Flat number"
            name="flat"
            value={flat}
            onChange={setFlat}
            isInvalid={flatInvalid}
            errorMessage="Enter a valid flat number, e.g. 204 or 12B."
          />
          <TextArea
            className={styles.span2}
            label="Delivery notes"
            name="notes"
            description="Optional — gate codes, landmarks or handling instructions."
            rows={3}
            value={notes}
            onChange={setNotes}
          />
        </CardContent>
        <CardFooter className={styles.footer}>
          <Button type="submit">Save address</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
