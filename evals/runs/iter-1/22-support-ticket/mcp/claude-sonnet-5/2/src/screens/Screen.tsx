'use client';

import { useId, useState, type FormEvent } from 'react';
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

// Mock data: no backend.
const TOPICS = [
  { id: 'billing', label: 'Billing and payments' },
  { id: 'technical', label: 'Technical issue' },
  { id: 'account', label: 'Account access' },
  { id: 'feature', label: 'Feature request' },
  { id: 'other', label: 'Something else' },
] as const;

const DESCRIPTION_LIMIT = 500;

function generateReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SR-${suffix}`;
}

export default function Screen() {
  const [topic, setTopic] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<File[]>([]);
  const [contactMethod, setContactMethod] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const formId = useId();

  const topicInvalid = attemptedSubmit && topic === null;
  const subjectInvalid = attemptedSubmit && subject.trim().length === 0;
  const descriptionInvalid = attemptedSubmit && description.trim().length === 0;
  const contactInvalid = attemptedSubmit && contactMethod === null;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAttemptedSubmit(true);

    const isValid =
      topic !== null && subject.trim().length > 0 && description.trim().length > 0 && contactMethod !== null;

    if (!isValid) {
      return;
    }

    setReference(generateReference());
  }

  function handleReset() {
    setTopic(null);
    setSubject('');
    setDescription('');
    setAttachment([]);
    setContactMethod(null);
    setAttemptedSubmit(false);
    setReference(null);
  }

  if (reference) {
    const topicLabel = TOPICS.find((t) => t.id === topic)?.label ?? '';
    return (
      <div className={styles.page}>
        <Card className={styles.card}>
          <CardHeader>
            <CardTitle>Request submitted</CardTitle>
            <CardDescription>We'll get back to you as soon as we can.</CardDescription>
          </CardHeader>
          <CardContent className={styles.content}>
            <Alert tone="success" title="Your reference number">
              <span className={styles.reference}>{reference}</span>
              <br />
              Keep this number if you'd like to follow up on your "{topicLabel}" request.
            </Alert>
          </CardContent>
          <CardFooter className={styles.footer}>
            <Button onPress={handleReset}>Submit another request</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <form id={formId} onSubmit={handleSubmit} className={styles.form}>
          <CardHeader>
            <CardTitle>Raise a support request</CardTitle>
            <CardDescription>Tell us what's going on and how you'd like us to reach you.</CardDescription>
          </CardHeader>
          <CardContent className={styles.content}>
            <Select
              label="Topic"
              placeholder="Choose a topic"
              selectedKey={topic}
              onSelectionChange={(key) => setTopic(key as string | null)}
              isRequired
              isInvalid={topicInvalid}
              errorMessage="Choose a topic."
            >
              {TOPICS.map((t) => (
                <SelectItem key={t.id} id={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </Select>

            <TextField
              label="Subject"
              value={subject}
              onChange={setSubject}
              isRequired
              isInvalid={subjectInvalid}
              errorMessage="Enter a subject."
              placeholder="Short summary of your request"
            />

            <TextArea
              label="Description"
              description="What happened, and what you expected instead."
              value={description}
              onChange={setDescription}
              maxLength={DESCRIPTION_LIMIT}
              rows={5}
              isRequired
              isInvalid={descriptionInvalid}
              errorMessage="Describe your request."
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
              value={contactMethod}
              onChange={setContactMethod}
              isRequired
              isInvalid={contactInvalid}
              errorMessage="Choose a contact method."
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
