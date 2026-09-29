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
  EmptyState,
  FileUpload,
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  TextArea,
  TextField,
  type Key,
} from '@syntara/react';
import { IconCircleCheck } from '@syntara/icons';
import styles from './Screen.module.css';

const TOPICS = [
  { id: 'billing', label: 'Billing & payments' },
  { id: 'technical', label: 'Technical issue' },
  { id: 'account', label: 'Account access' },
  { id: 'feature', label: 'Feature request' },
  { id: 'other', label: 'Something else' },
];

const DESCRIPTION_LIMIT = 500;

function createReference() {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `SR-${digits}`;
}

export default function Screen() {
  const [topic, setTopic] = useState<Key | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [contactPreference, setContactPreference] = useState('email');
  const [reference, setReference] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReference(createReference());
  }

  function handleStartOver() {
    setTopic(null);
    setSubject('');
    setDescription('');
    setAttachments([]);
    setContactPreference('email');
    setReference(null);
  }

  if (reference) {
    return (
      <div className={styles.page}>
        <Card style={{ inlineSize: '100%' }}>
          <CardContent>
            <EmptyState
              icon={<IconCircleCheck aria-hidden />}
              title="Request submitted"
              description={`We'll get back to you soon. Your reference number is ${reference}.`}
              action={<Button onPress={handleStartOver}>Raise another request</Button>}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Card style={{ inlineSize: '100%' }}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <CardHeader>
            <CardTitle>Raise a support request</CardTitle>
            <CardDescription>Tell us what's going on and we'll get back to you.</CardDescription>
          </CardHeader>
          <CardContent className={styles.fields}>
            <Select label="Topic" placeholder="Choose a topic" selectedKey={topic} onSelectionChange={setTopic} isRequired>
              {TOPICS.map((item) => (
                <SelectItem key={item.id} id={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </Select>
            <TextField label="Subject" value={subject} onChange={setSubject} isRequired />
            <TextArea
              label="Description"
              description="Include what happened and any steps to reproduce it."
              value={description}
              onChange={setDescription}
              maxLength={DESCRIPTION_LIMIT}
              rows={5}
              isRequired
            />
            <FileUpload
              label="Attachment"
              description="Optional. A screenshot or file that helps explain the issue."
              acceptedFileTypes={['image/png', 'image/jpeg', 'application/pdf']}
              maxSize={10 * 1024 * 1024}
              files={attachments}
              onChange={setAttachments}
            />
            <RadioGroup
              label="How should we contact you?"
              orientation="horizontal"
              value={contactPreference}
              onChange={setContactPreference}
              isRequired
            >
              <Radio value="email">Email</Radio>
              <Radio value="phone">Phone</Radio>
              <Radio value="none">No preference</Radio>
            </RadioGroup>
          </CardContent>
          <CardFooter className={styles.footer}>
            <Button type="submit">Submit request</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
