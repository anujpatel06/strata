import { useMemo, useState, type FormEvent } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
  EmptyState,
  FileUpload,
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  TextArea,
  TextField,
} from '@strata/react';
import { IconCircleCheck, IconFile, IconMail, IconPhone } from '@strata/icons';
import styles from './Screen.module.css';

interface Topic {
  id: string;
  label: string;
  description: string;
}

const TOPICS: Topic[] = [
  { id: 'billing', label: 'Billing & payments', description: 'Charges, invoices and refunds' },
  { id: 'account', label: 'Account access', description: 'Login, passwords and security' },
  { id: 'technical', label: 'Technical issue', description: 'Errors, bugs and performance' },
  { id: 'feature', label: 'Feature request', description: 'Ideas for something new' },
  { id: 'other', label: 'Something else', description: "Doesn't fit the other topics" },
];

const DESCRIPTION_LIMIT = 500;

type ContactMethod = 'email' | 'phone' | 'none';

function generateReference(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  return `SR-${stamp}`;
}

export default function Screen() {
  const [topic, setTopic] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<File[]>([]);
  const [contactMethod, setContactMethod] = useState<ContactMethod>('email');
  const [reference, setReference] = useState<string | null>(null);

  const remaining = DESCRIPTION_LIMIT - description.length;

  const isValid = useMemo(
    () => Boolean(topic) && subject.trim().length > 0 && description.trim().length > 0,
    [topic, subject, description],
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;
    setReference(generateReference());
  }

  function handleStartOver() {
    setTopic(null);
    setSubject('');
    setDescription('');
    setAttachment([]);
    setContactMethod('email');
    setReference(null);
  }

  if (reference) {
    return (
      <div className={styles.page}>
        <Card className={styles.confirmationCard}>
          <CardContent>
            <EmptyState
              icon={<IconCircleCheck />}
              title="Request submitted"
              description="We've received your support request and will get back to you using your preferred contact method."
              action={
                <Button variant="outline" onPress={handleStartOver}>
                  Raise another request
                </Button>
              }
            >
              <div className={styles.referenceBlock}>
                <span className={styles.referenceLabel}>Reference number</span>
                <span className={styles.referenceValue}>{reference}</span>
              </div>
            </EmptyState>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <Card>
          <CardHeader divider>
            <CardTitle level={1}>Raise a support request</CardTitle>
            <CardDescription>
              Tell us what's going on and we'll get back to you as soon as we can.
            </CardDescription>
          </CardHeader>
          <CardContent className={styles.fields}>
            <Select
              label="Topic"
              placeholder="Choose a topic"
              selectedKey={topic}
              onSelectionChange={(key) => setTopic(key as string)}
              isRequired
            >
              {TOPICS.map((item) => (
                <SelectItem key={item.id} id={item.id} description={item.description}>
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
            />

            <TextArea
              label="Description"
              placeholder="Give us as much detail as you can"
              value={description}
              onChange={(value) => setDescription(value.slice(0, DESCRIPTION_LIMIT))}
              rows={5}
              description={`${remaining} character${remaining === 1 ? '' : 's'} left`}
              isRequired
            />

            <FileUpload
              label="Attachment"
              description="Optional. Add a screenshot or file that helps explain the issue."
              acceptedFileTypes={['image/*', '.pdf', '.doc', '.docx']}
              maxSize={10 * 1024 * 1024}
              files={attachment}
              onChange={setAttachment}
              dropLabel="Drag a file here or"
            />

            <RadioGroup
              label="Preferred contact method"
              value={contactMethod}
              onChange={(value) => setContactMethod(value as ContactMethod)}
              orientation="horizontal"
            >
              <Radio value="email">
                <span className={styles.radioLabel}>
                  <IconMail /> Email
                </span>
              </Radio>
              <Radio value="phone">
                <span className={styles.radioLabel}>
                  <IconPhone /> Phone
                </span>
              </Radio>
              <Radio value="none">No preference</Radio>
            </RadioGroup>
          </CardContent>
          <CardFooter divider className={styles.footer}>
            <span className={styles.attachmentHint}>
              {attachment.length > 0 ? (
                <>
                  <IconFile /> {attachment[0].name}
                </>
              ) : null}
            </span>
            <Button type="submit" variant="primary" isDisabled={!isValid}>
              Submit request
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
