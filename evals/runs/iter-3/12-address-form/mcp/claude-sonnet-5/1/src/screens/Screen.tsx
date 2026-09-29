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
  { id: 'dubai', label: 'Dubai' },
  { id: 'sharjah', label: 'Sharjah' },
  { id: 'ajman', label: 'Ajman' },
  { id: 'umm-al-quwain', label: 'Umm Al Quwain' },
  { id: 'ras-al-khaimah', label: 'Ras Al Khaimah' },
  { id: 'fujairah', label: 'Fujairah' },
];

const flatNumberPattern = /^[0-9]+[A-Za-z]?$/;

// Mock state: the person has already submitted once, with the phone missing
// and an invalid flat number, so those two errors show on load.
export default function Screen() {
  const [fullName, setFullName] = useState('Fatima Al Marzooqi');
  const [phone, setPhone] = useState('');
  const [emirate, setEmirate] = useState<Key | null>('dubai');
  const [area, setArea] = useState('Al Barsha 1');
  const [building, setBuilding] = useState('Marina Heights, Tower B');
  const [flatNumber, setFlatNumber] = useState('12-B');
  const [notes, setNotes] = useState('Leave with security if no one answers.');
  const [hasSubmitted, setHasSubmitted] = useState(true);

  const nameError = fullName.trim() === '' ? "Enter the recipient's full name." : null;
  const phoneError = phone.trim() === '' ? 'Enter a phone number.' : null;
  const emirateError = emirate === null ? 'Choose an emirate.' : null;
  const areaError = area.trim() === '' ? 'Enter the area.' : null;
  const flatNumberError =
    flatNumber.trim() !== '' && !flatNumberPattern.test(flatNumber.trim())
      ? 'Enter a valid flat number, e.g. 204 or 12A.'
      : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSubmitted(true);
  }

  return (
    <Card className={styles.card}>
      <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
        <CardHeader>
          <CardTitle>Delivery address</CardTitle>
          <CardDescription>Tell us where to bring your order.</CardDescription>
        </CardHeader>
        <CardContent className={styles.content}>
          <div className={styles.row}>
            <TextField
              label="Full name"
              autoComplete="name"
              isRequired
              value={fullName}
              onChange={setFullName}
              isInvalid={hasSubmitted && !!nameError}
              errorMessage={nameError ?? undefined}
            />
            <TextField
              label="Phone number"
              type="tel"
              autoComplete="tel"
              isRequired
              value={phone}
              onChange={setPhone}
              isInvalid={hasSubmitted && !!phoneError}
              errorMessage={phoneError ?? undefined}
            />
          </div>
          <div className={styles.row}>
            <Select
              label="Emirate"
              placeholder="Choose an emirate"
              isRequired
              selectedKey={emirate}
              onSelectionChange={setEmirate}
              isInvalid={hasSubmitted && !!emirateError}
              errorMessage={emirateError ?? undefined}
            >
              {emirates.map((item) => (
                <SelectItem key={item.id} id={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </Select>
            <TextField
              label="Area"
              isRequired
              value={area}
              onChange={setArea}
              isInvalid={hasSubmitted && !!areaError}
              errorMessage={areaError ?? undefined}
            />
          </div>
          <div className={styles.row}>
            <TextField label="Building" description="Building or villa name." value={building} onChange={setBuilding} />
            <TextField
              label="Flat number"
              value={flatNumber}
              onChange={setFlatNumber}
              isInvalid={hasSubmitted && !!flatNumberError}
              errorMessage={flatNumberError ?? undefined}
            />
          </div>
          <TextArea
            label="Delivery notes"
            description="Landmarks, gate codes or instructions for the driver."
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
