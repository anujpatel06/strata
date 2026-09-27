import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
  Eyebrow,
  FileUpload,
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  TextArea,
  TextField,
} from '@strata/react';
import { IconCircleCheck } from '@strata/icons';
import styles from './Screen.module.css';

const TOPICS = [
  { id: 'billing', label: 'Billing and payments' },
  { id: 'technical', label: 'Technical issue' },
  { id: 'account', label: 'Account access' },
  { id: 'feature', label: 'Feature request' },
  { id: 'other', label: 'Something else' },
];

const DESCRIPTION_LIMIT = 500;

function generateReference() {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `SR-${digits}`;
}

type ContactPreference = 'email' | 'phone' | 'none';

export default function Screen() {
  const [topic, setTopic] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<File[]>([]);
  const [contactPreference, setContactPreference] = useState<ContactPreference | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const isTopicInvalid = showErrors && !topic;
  const isSubjectInvalid = showErrors && subject.trim().length === 0;
  const isDescriptionInvalid = showErrors && description.trim().length === 0;
  const isContactInvalid = showErrors && !contactPreference;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!topic || subject.trim().length === 0 || description.trim().length === 0 || !contactPreference) {
      setShowErrors(true);
      return;
    }
    setReference(generateReference());
  }

  if (reference) {
    return (
      <Card className={styles.card}>
        <CardContent className={styles.confirmation}>
          <IconCircleCheck className={styles.confirmationIcon} aria-hidden />
          <CardTitle level={2}>Request submitted</CardTitle>
          <CardDescription>
            We've received your request and will get back to you using your preferred contact method.
          </CardDescription>
          <div className={styles.referenceBlock}>
            <Eyebrow>Reference number</Eyebrow>
            <p className={styles.referenceNumber}>{reference}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle level={1}>Raise a support request</CardTitle>
        <CardDescription>Tell us what's going on and we'll follow up with you.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className={styles.fields}>
          <Select
            label="Topic"
            placeholder="Choose a topic"
            selectedKey={topic}
            onSelectionChange={(key) => setTopic(key as string)}
            isRequired
            isInvalid={isTopicInvalid}
            errorMessage="Choose a topic for your request."
          >
            {TOPICS.map((item) => (
              <SelectItem key={item.id} id={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </Select>

          <TextField
            label="Subject"
            placeholder="Brief summary of your request"
            value={subject}
            onChange={setSubject}
            isRequired
            isInvalid={isSubjectInvalid}
            errorMessage="Enter a subject."
          />

          <TextArea
            label="Description"
            description="Include any details that will help us understand the issue."
            placeholder="What happened?"
            rows={5}
            maxLength={DESCRIPTION_LIMIT}
            value={description}
            onChange={setDescription}
            isRequired
            isInvalid={isDescriptionInvalid}
            errorMessage="Enter a description."
          />

          <FileUpload
            label="Attachment (optional)"
            description="Add a screenshot or file that helps explain the issue."
            acceptedFileTypes={['image/png', 'image/jpeg', 'application/pdf']}
            maxSize={10 * 1024 * 1024}
            files={attachment}
            onChange={setAttachment}
          />

          <RadioGroup
            label="How should we contact you?"
            orientation="horizontal"
            value={contactPreference}
            onChange={(value) => setContactPreference(value as ContactPreference)}
            isRequired
            isInvalid={isContactInvalid}
            errorMessage="Choose a contact preference."
          >
            <Radio value="email">Email</Radio>
            <Radio value="phone">Phone</Radio>
            <Radio value="none">No preference</Radio>
          </RadioGroup>
        </CardContent>
        <CardFooter>
          <Button type="submit">Submit request</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
