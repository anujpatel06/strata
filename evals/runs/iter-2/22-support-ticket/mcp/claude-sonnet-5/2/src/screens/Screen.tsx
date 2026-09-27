'use client';

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
  type FileUploadEntry,
} from '@strata/react';
import { IconCircleCheck } from '@strata/icons';
import { useState, type FormEvent } from 'react';
import styles from './Screen.module.css';

const TOPICS = [
  { id: 'billing', label: 'Billing and payments' },
  { id: 'account', label: 'Account access' },
  { id: 'technical', label: 'Technical issue' },
  { id: 'feature', label: 'Feature request' },
  { id: 'other', label: 'Something else' },
];

const DESCRIPTION_LIMIT = 500;

type ContactPreference = 'email' | 'phone' | 'none';

interface FormValues {
  topic: string | null;
  subject: string;
  description: string;
  files: FileUploadEntry[];
  contactPreference: ContactPreference;
}

const EMPTY_VALUES: FormValues = {
  topic: null,
  subject: '',
  description: '',
  files: [],
  contactPreference: 'none',
};

type FieldKey = 'topic' | 'subject' | 'description' | 'contactPreference';
type Errors = Partial<Record<FieldKey, string>>;

function checkField(key: FieldKey, values: FormValues): string | undefined {
  switch (key) {
    case 'topic':
      return values.topic ? undefined : 'Choose a topic.';
    case 'subject':
      return values.subject.trim() ? undefined : 'Enter a subject.';
    case 'description':
      return values.description.trim() ? undefined : 'Describe your request.';
    case 'contactPreference':
      return values.contactPreference ? undefined : 'Choose how we should contact you.';
  }
}

function makeReference(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `SR-${digits}`;
}

export default function Screen() {
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Errors>({});
  const [reference, setReference] = useState<string | null>(null);

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (key in errors && errors[key as FieldKey]) {
      setErrors((e) => ({ ...e, [key]: checkField(key as FieldKey, next) }));
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fields: FieldKey[] = ['topic', 'subject', 'description', 'contactPreference'];
    const found: Errors = {};
    for (const key of fields) {
      const message = checkField(key, values);
      if (message) found[key] = message;
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setReference(makeReference());
  };

  const startOver = () => {
    setValues(EMPTY_VALUES);
    setErrors({});
    setReference(null);
  };

  if (reference) {
    return (
      <div className={styles.root}>
        <Card className={styles.confirmationCard}>
          <EmptyState
            icon={<IconCircleCheck aria-hidden className={styles.successIcon} />}
            title="Request submitted"
            description={
              <>
                We've received your request. Your reference number is{' '}
                <strong className={styles.reference}>{reference}</strong>. Keep it handy if you contact us again about this
                request.
              </>
            }
            action={
              <Button variant="outline" onPress={startOver}>
                Raise another request
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Card className={styles.formCard}>
        <form noValidate onSubmit={onSubmit} className={styles.form}>
          <CardHeader>
            <CardTitle>Raise a support request</CardTitle>
            <CardDescription>Tell us what's going on and we'll get back to you.</CardDescription>
          </CardHeader>

          <CardContent className={styles.fields}>
            <Select
              label="Topic"
              placeholder="Choose a topic"
              selectedKey={values.topic}
              onSelectionChange={(key) => update('topic', key as string | null)}
              isRequired
              validationBehavior="aria"
              isInvalid={!!errors.topic}
              errorMessage={errors.topic}
            >
              {TOPICS.map((topic) => (
                <SelectItem key={topic.id} id={topic.id}>
                  {topic.label}
                </SelectItem>
              ))}
            </Select>

            <TextField
              label="Subject"
              placeholder="Short summary of your request"
              value={values.subject}
              onChange={(v) => update('subject', v)}
              isRequired
              validationBehavior="aria"
              isInvalid={!!errors.subject}
              errorMessage={errors.subject}
            />

            <TextArea
              label="Description"
              description="Include anything that will help us understand the issue."
              placeholder="What happened?"
              rows={5}
              maxLength={DESCRIPTION_LIMIT}
              value={values.description}
              onChange={(v) => update('description', v)}
              isRequired
              validationBehavior="aria"
              isInvalid={!!errors.description}
              errorMessage={errors.description}
            />

            <FileUpload
              label="Attachment"
              description="Optional. A screenshot or document that helps explain the issue."
              acceptedFileTypes={['image/*', '.pdf', '.doc', '.docx']}
              maxSize={10 * 1024 * 1024}
              files={values.files}
              onChange={(files) => update('files', files.map((file) => ({ file })))}
            />

            <RadioGroup
              label="How should we contact you?"
              orientation="horizontal"
              value={values.contactPreference}
              onChange={(v) => update('contactPreference', v as ContactPreference)}
              isRequired
              validationBehavior="aria"
              isInvalid={!!errors.contactPreference}
              errorMessage={errors.contactPreference}
            >
              <Radio value="email">Email</Radio>
              <Radio value="phone">Phone</Radio>
              <Radio value="none">No preference</Radio>
            </RadioGroup>
          </CardContent>

          <CardFooter divider className={styles.actions}>
            <Button type="submit" variant="primary">
              Submit request
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
