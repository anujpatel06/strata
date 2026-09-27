import { useState, type FormEvent, type Key } from 'react';
import {
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
import { IconCircleCheck, IconMail, IconPhone, IconHelpCircle } from '@strata/icons';
import styles from './Screen.module.css';

// Mock data: no backend, so topics live here.
const TOPICS = [
  { id: 'billing', label: 'Billing and payments' },
  { id: 'technical', label: 'Technical issue' },
  { id: 'account', label: 'Account and access' },
  { id: 'feature', label: 'Feature request' },
  { id: 'other', label: 'Something else' },
];

const DESCRIPTION_LIMIT = 500;

type ContactMethod = 'email' | 'phone' | 'none';

interface FormErrors {
  topic?: string;
  subject?: string;
  description?: string;
}

function createReferenceNumber() {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SR-${year}-${random}`;
}

export default function Screen() {
  const [topic, setTopic] = useState<Key | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [contactMethod, setContactMethod] = useState<ContactMethod>('email');
  const [errors, setErrors] = useState<FormErrors>({});
  const [reference, setReference] = useState<string | null>(null);

  const remaining = DESCRIPTION_LIMIT - description.length;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    if (!topic) nextErrors.topic = 'Choose a topic.';
    if (!subject.trim()) nextErrors.subject = 'Add a subject.';
    if (!description.trim()) nextErrors.description = 'Describe your request.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setReference(createReferenceNumber());
  }

  function handleReset() {
    setTopic(null);
    setSubject('');
    setDescription('');
    setFiles([]);
    setContactMethod('email');
    setErrors({});
    setReference(null);
  }

  if (reference) {
    const topicLabel = TOPICS.find((t) => t.id === topic)?.label;
    return (
      <div className={styles.page}>
        <Card className={styles.confirmationCard}>
          <CardContent className={styles.confirmationContent}>
            <span className={styles.confirmationIcon} aria-hidden="true">
              <IconCircleCheck />
            </span>
            <CardTitle level={1} className={styles.confirmationTitle}>
              Request submitted
            </CardTitle>
            <CardDescription>
              We&apos;ve received your request{topicLabel ? ` about "${topicLabel}"` : ''} and will get back to you
              using your preferred contact method.
            </CardDescription>
            <div className={styles.referenceBox}>
              <span className={styles.referenceLabel}>Reference number</span>
              <span className={styles.referenceValue}>{reference}</span>
            </div>
          </CardContent>
          <CardFooter divider className={styles.confirmationFooter}>
            <Button type="button" variant="primary" onPress={handleReset}>
              Raise another request
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Card className={styles.formCard}>
        <CardHeader divider>
          <CardTitle level={1}>Raise a support request</CardTitle>
          <CardDescription>Tell us what&apos;s going on and we&apos;ll route it to the right team.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} noValidate>
          <CardContent className={styles.formContent}>
            <Select
              label="Topic"
              placeholder="Choose a topic"
              selectedKey={topic}
              onSelectionChange={setTopic}
              isInvalid={!!errors.topic}
              errorMessage={errors.topic}
            >
              {TOPICS.map((t) => (
                <SelectItem key={t.id} id={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </Select>

            <TextField
              label="Subject"
              placeholder="Short summary of your request"
              value={subject}
              onChange={setSubject}
              isInvalid={!!errors.subject}
              errorMessage={errors.subject}
            />

            <TextArea
              label="Description"
              placeholder="Give us the details of your request…"
              value={description}
              onChange={setDescription}
              maxLength={DESCRIPTION_LIMIT}
              rows={5}
              description={`${remaining} character${remaining === 1 ? '' : 's'} left`}
              isInvalid={!!errors.description}
              errorMessage={errors.description}
            />

            <FileUpload
              label="Attachment (optional)"
              hint="Any file type, up to 10 MB"
              maxSize={10 * 1024 * 1024}
              files={files}
              onChange={setFiles}
            />

            <RadioGroup
              label="How should we contact you?"
              variant="card"
              orientation="horizontal"
              value={contactMethod}
              onChange={(value) => setContactMethod(value as ContactMethod)}
              className={styles.contactGroup}
            >
              <Radio value="email" description="We'll reply to the email on your account.">
                <span className={styles.radioLabel}>
                  <IconMail aria-hidden="true" />
                  Email
                </span>
              </Radio>
              <Radio value="phone" description="We'll call the phone number on your account.">
                <span className={styles.radioLabel}>
                  <IconPhone aria-hidden="true" />
                  Phone
                </span>
              </Radio>
              <Radio value="none" description="No preference — use whichever works.">
                <span className={styles.radioLabel}>
                  <IconHelpCircle aria-hidden="true" />
                  No preference
                </span>
              </Radio>
            </RadioGroup>
          </CardContent>
          <CardFooter divider className={styles.formFooter}>
            <Button type="submit" variant="primary">
              Submit request
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
