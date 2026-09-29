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
  type Key,
} from '@syntara/react';
import styles from './Screen.module.css';

const emirates = [
  { id: 'abu-dhabi', label: 'Abu Dhabi' },
  { id: 'ajman', label: 'Ajman' },
  { id: 'dubai', label: 'Dubai' },
  { id: 'fujairah', label: 'Fujairah' },
  { id: 'ras-al-khaimah', label: 'Ras Al Khaimah' },
  { id: 'sharjah', label: 'Sharjah' },
  { id: 'umm-al-quwain', label: 'Umm Al Quwain' },
];

// Mock: the person already submitted once, with the phone missing and the flat number malformed.
export default function Screen() {
  const [fullName, setFullName] = useState('Fatima Al Mazrouei');
  const [phone, setPhone] = useState('');
  const [emirate, setEmirate] = useState<Key | null>('dubai');
  const [area, setArea] = useState('Al Barsha 1');
  const [building, setBuilding] = useState('Marina Heights Tower');
  const [flatNumber, setFlatNumber] = useState('G12');
  const [notes, setNotes] = useState('Call on arrival, the entrance is around the back.');
  const [hasSubmitted, setHasSubmitted] = useState(true);

  const fullNameError = hasSubmitted && !fullName.trim() ? "Enter the recipient's full name." : undefined;
  const phoneError = hasSubmitted && !phone.trim() ? 'Enter a phone number so the courier can reach you.' : undefined;
  const emirateError = hasSubmitted && emirate === null ? 'Choose an emirate.' : undefined;
  const areaError = hasSubmitted && !area.trim() ? 'Enter the area or neighbourhood.' : undefined;
  const flatNumberError = flatNumber.trim() && !/^\d+$/.test(flatNumber.trim()) ? 'Flat number can only contain digits.' : undefined;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHasSubmitted(true);
  }

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Delivery address</CardTitle>
            <CardDescription>Where should we deliver your order?</CardDescription>
          </CardHeader>
          <CardContent className={styles.grid}>
            <TextField
              className={styles.full}
              label="Full name"
              name="fullName"
              autoComplete="name"
              value={fullName}
              onChange={setFullName}
              isRequired
              isInvalid={Boolean(fullNameError)}
              errorMessage={fullNameError}
            />
            <TextField
              label="Phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="05X XXX XXXX"
              description="We'll share this with the courier."
              value={phone}
              onChange={setPhone}
              isRequired
              isInvalid={Boolean(phoneError)}
              errorMessage={phoneError}
            />
            <Select
              label="Emirate"
              placeholder="Choose an emirate"
              selectedKey={emirate}
              onSelectionChange={setEmirate}
              isRequired
              isInvalid={Boolean(emirateError)}
              errorMessage={emirateError}
            >
              {emirates.map((item) => (
                <SelectItem key={item.id} id={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </Select>
            <TextField
              className={styles.full}
              label="Area"
              name="area"
              autoComplete="address-level2"
              value={area}
              onChange={setArea}
              isRequired
              isInvalid={Boolean(areaError)}
              errorMessage={areaError}
            />
            <TextField
              label="Building"
              name="building"
              autoComplete="address-line1"
              value={building}
              onChange={setBuilding}
            />
            <TextField
              label="Flat number"
              name="flatNumber"
              inputMode="numeric"
              description="Numbers only, e.g. 1204."
              value={flatNumber}
              onChange={setFlatNumber}
              isInvalid={Boolean(flatNumberError)}
              errorMessage={flatNumberError}
            />
            <TextArea
              className={styles.full}
              label="Delivery notes"
              name="notes"
              description="Anything the courier should know, such as a gate code."
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
    </div>
  );
}
