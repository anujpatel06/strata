'use client';

import { useState, type FormEvent, type Key } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  FileUpload,
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  TextArea,
  TextField,
} from '@strata/react';
import styles from './Screen.module.css';

interface Topic {
  id: string;
  label: string;
}

const TOPICS: Topic[] = [
  { id: 'billing', label: 'Billing and payments' },
  { id: 'technical', label: 'Technical issue' },
  { id: 'account', label: 'Account access' },
  { id: 'feature', label: 'Feature request' },
  { id: 'other', label: 'Something else' },
];

const CONTACT_LABELS: Record<string, string> = {
  email: 'Email',
  phone: 'Phone',
  none: 'No preference',
};

const DESCRIPTION_LIMIT = 500;

function generateReference(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `SR-${digits}`;
}

interface SubmittedRequest {
  reference: string;
  topicLabel: string;
  subject: string;
  contactLabel: string;
}

export default function Screen() {
  const [topic, setTopic] = useState<Key | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<File[]>([]);
  const [contact, setContact] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [submitted, setSubmitted] = useState<SubmittedRequest | null>(null);

  const topicMissing = attempted && !topic;
  const subjectMissing = attempted && subject.trim() === '';
  const descriptionMissing = attempted && description.trim() === '';
  const contactMissing = attempted && !contact;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);

    if (!topic || subject.trim() === '' || description.trim() === '' || !contact) {
      return;
    }

    const topicLabel = TOPICS.find((item) => item.id === topic)?.label ?? '';

    setSubmitted({
      reference: generateReference(),
      topicLabel,
      subject,
      contactLabel: CONTACT_LABELS[contact],
    });
  }

  function handleReset() {
    setTopic(null);
    setSubject('');
    setDescription('');
    setAttachment([]);
    setContact(null);
    setAttempted(false);
    setSubmitted(null);
  }

  if (submitted) {
    return (
      <div className={styles.page}>
        <Card className={styles.card}>
          <CardHeader>
            <CardTitle>Request submitted</CardTitle>
            <CardDescription>We'll get back to you as soon as we can.</CardDescription>
          </CardHeader>
          <CardContent className={styles.confirmationContent}>
            <Alert tone="success" title="Thanks — we've got your request">
              Your reference number is <strong>{submitted.reference}</strong>. Keep it handy if you need to
              follow up.
            </Alert>
            <dl className={styles.summary}>
              <div className={styles.summaryRow}>
                <dt className={styles.summaryLabel}>Topic</dt>
                <dd className={styles.summaryValue}>{submitted.topicLabel}</dd>
              </div>
              <div className={styles.summaryRow}>
                <dt className={styles.summaryLabel}>Subject</dt>
                <dd className={styles.summaryValue}>{submitted.subject}</dd>
              </div>
              <div className={styles.summaryRow}>
                <dt className={styles.summaryLabel}>Contact preference</dt>
                <dd className={styles.summaryValue}>{submitted.contactLabel}</dd>
              </div>
            </dl>
          </CardContent>
          <CardFooter className={styles.footer}>
            <Button onPress={handleReset}>Raise another request</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <CardHeader>
            <CardTitle>Raise a support request</CardTitle>
            <CardDescription>Tell us what's going on and we'll follow up.</CardDescription>
          </CardHeader>
          <CardContent className={styles.formContent}>
            <Select
              label="Topic"
              placeholder="Choose a topic"
              selectedKey={topic}
              onSelectionChange={setTopic}
              isRequired
              isInvalid={topicMissing}
              errorMessage="Choose a topic."
            >
              {TOPICS.map((item) => (
                <SelectItem key={item.id} id={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </Select>

            <TextField
              label="Subject"
              value={subject}
              onChange={setSubject}
              isRequired
              isInvalid={subjectMissing}
              errorMessage="Enter a subject."
              placeholder="Short summary of the issue"
            />

            <TextArea
              label="Description"
              value={description}
              onChange={setDescription}
              maxLength={DESCRIPTION_LIMIT}
              isRequired
              isInvalid={descriptionMissing}
              errorMessage="Enter a description."
              description="Include anything that will help us understand the issue."
              rows={5}
            />

            <FileUpload
              label="Attachment (optional)"
              description="A screenshot or document that helps explain the issue."
              acceptedFileTypes={['image/png', 'image/jpeg', 'application/pdf']}
              maxSize={10 * 1024 * 1024}
              files={attachment}
              onChange={setAttachment}
            />

            <RadioGroup
              label="How should we contact you?"
              orientation="horizontal"
              value={contact}
              onChange={setContact}
              isRequired
              isInvalid={contactMissing}
              errorMessage="Choose a contact preference."
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
