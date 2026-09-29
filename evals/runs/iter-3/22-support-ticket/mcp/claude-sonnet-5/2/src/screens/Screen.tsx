import { useState, type FormEvent } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  FileUpload,
  IconTile,
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
  { id: 'billing', name: 'Billing & payments' },
  { id: 'technical', name: 'Technical issue' },
  { id: 'account', name: 'Account access' },
  { id: 'feature', name: 'Feature request' },
  { id: 'other', name: 'Something else' },
];

const DESCRIPTION_LIMIT = 500;

function generateReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SR-${code}`;
}

export default function Screen() {
  const [topic, setTopic] = useState<Key | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [contact, setContact] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const topicName = TOPICS.find((item) => item.id === topic)?.name ?? '';

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (!topic || !subject.trim() || !description.trim() || !contact) {
      return;
    }
    setReference(generateReference());
  }

  function handleReset() {
    setTopic(null);
    setSubject('');
    setDescription('');
    setFiles([]);
    setContact(null);
    setAttempted(false);
    setReference(null);
  }

  if (reference) {
    return (
      <div className={styles.page}>
        <Card className={styles.card}>
          <CardContent className={styles.confirmation}>
            <IconTile tint="success" size="lg">
              <IconCircleCheck />
            </IconTile>
            <CardTitle level={2}>Request submitted</CardTitle>
            <CardDescription>
              We've received your {topicName.toLowerCase()} request and will get back to you using your preferred
              contact method.
            </CardDescription>
            <div className={styles.referenceRow}>
              <span className={styles.referenceLabel}>Reference number</span>
              <Badge tone="brand" size="md">
                {reference}
              </Badge>
            </div>
          </CardContent>
          <CardFooter divider className={styles.footerEnd}>
            <Button variant="secondary" onPress={handleReset}>
              Raise another request
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <CardHeader>
            <CardTitle level={1}>Raise a support request</CardTitle>
            <CardDescription>Tell us what's going on and we'll follow up.</CardDescription>
          </CardHeader>
          <CardContent className={styles.grid}>
            <Select
              label="Topic"
              placeholder="Choose a topic"
              items={TOPICS}
              selectedKey={topic}
              onSelectionChange={setTopic}
              isRequired
              isInvalid={attempted && !topic}
              errorMessage="Choose a topic"
            >
              {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
            </Select>
            <TextField
              label="Subject"
              placeholder="Short summary of the issue"
              value={subject}
              onChange={setSubject}
              isRequired
              isInvalid={attempted && !subject.trim()}
              errorMessage="Enter a subject"
            />
            <div className={styles.fullWidth}>
              <TextArea
                label="Description"
                description="What happened, when, and anything you've already tried."
                placeholder="Describe your issue"
                value={description}
                onChange={setDescription}
                maxLength={DESCRIPTION_LIMIT}
                rows={5}
                isRequired
                isInvalid={attempted && !description.trim()}
                errorMessage="Describe your issue"
                style={{ inlineSize: '100%' }}
              />
            </div>
            <div className={styles.fullWidth}>
              <FileUpload
                label="Attachment (optional)"
                description="A screenshot or file that helps explain the issue."
                acceptedFileTypes={['image/png', 'image/jpeg', 'application/pdf']}
                maxSize={10 * 1024 * 1024}
                files={files}
                onChange={setFiles}
                style={{ inlineSize: '100%' }}
              />
            </div>
            <div className={styles.fullWidth}>
              <RadioGroup
                label="Preferred contact method"
                orientation="horizontal"
                value={contact}
                onChange={setContact}
                isRequired
                isInvalid={attempted && !contact}
                errorMessage="Choose how we should contact you"
              >
                <Radio value="email">Email</Radio>
                <Radio value="phone">Phone</Radio>
                <Radio value="none">No preference</Radio>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter divider className={styles.footerEnd}>
            <Button type="submit">Submit request</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
