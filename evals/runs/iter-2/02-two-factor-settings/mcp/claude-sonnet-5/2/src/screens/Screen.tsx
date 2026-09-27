'use client';

import {
  AlertDialog,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Radio,
  RadioGroup,
  Separator,
  Switch,
} from '@strata/react';
import { IconDeviceMobile, IconDownload, IconMessage, IconRefresh } from '@strata/icons';
import { useState } from 'react';
import styles from './Screen.module.css';

type Method = 'app' | 'sms';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCodes(count: number): string[] {
  return Array.from({ length: count }, () => {
    const chunk = () =>
      Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
    return `${chunk()}-${chunk()}`;
  });
}

const content = {
  title: 'Security settings',
  description: 'Manage how you sign in and keep your account secure.',
  twoFactor: {
    title: 'Two-factor authentication',
    description: 'Add a second step when you sign in, using an authenticator app or a text message.',
    switchLabel: 'Require a second step when signing in',
    switchDescription: 'Adds a one-time code to your password each time you sign in from a new device.',
    method: {
      label: 'Verification method',
      app: {
        label: 'Authenticator app',
        description: 'Get codes from an app like Google Authenticator or 1Password, even offline.',
      },
      sms: {
        label: 'Text message',
        description: 'Get codes by text message to the phone number ending in 04.',
      },
    },
    backupCodes: {
      label: 'Backup codes',
      description: 'Use one of these codes to sign in if you lose access to your device. Each code works once.',
      regenerate: 'Regenerate codes',
      download: 'Download',
    },
    confirmOff: {
      title: 'Turn off two-factor authentication?',
      body: 'Your account will only need a password to sign in. Anyone who has your password could get in.',
      action: 'Turn off',
      cancel: 'Cancel',
    },
  },
};

export default function Screen() {
  const [enabled, setEnabled] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [method, setMethod] = useState<Method>('app');
  const [codes, setCodes] = useState<string[]>(() => generateCodes(10));

  const t = content.twoFactor;

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{content.title}</h1>
        <p className={styles.description}>{content.description}</p>
      </div>

      <Card>
        <CardHeader divider>
          <CardTitle level={2}>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
          <CardAction>
            <Badge variant="status" tone={enabled ? 'success' : 'neutral'}>
              {enabled ? 'On' : 'Off'}
            </Badge>
          </CardAction>
        </CardHeader>

        <CardContent className={styles.stack}>
          <Switch
            isSelected={enabled}
            onChange={(isSelected) => {
              if (isSelected) {
                setEnabled(true);
              } else {
                setConfirmOpen(true);
              }
            }}
            description={t.switchDescription}
          >
            {t.switchLabel}
          </Switch>

          {enabled && (
            <>
              <Separator />
              <RadioGroup variant="card" label={t.method.label} value={method} onChange={(value) => setMethod(value as Method)}>
                <Radio value="app" description={t.method.app.description}>
                  <span className={styles.radioLabel}>
                    <IconDeviceMobile aria-hidden />
                    {t.method.app.label}
                  </span>
                </Radio>
                <Radio value="sms" description={t.method.sms.description}>
                  <span className={styles.radioLabel}>
                    <IconMessage aria-hidden />
                    {t.method.sms.label}
                  </span>
                </Radio>
              </RadioGroup>
            </>
          )}
        </CardContent>

        {enabled && (
          <>
            <CardContent className={styles.backupHeader}>
              <div className={styles.rowText}>
                <p className={styles.rowLabel}>{t.backupCodes.label}</p>
                <p className={styles.rowDescription}>{t.backupCodes.description}</p>
              </div>
              <div className={styles.backupActions}>
                <Button variant="outline" size="sm" onPress={() => setCodes(generateCodes(10))}>
                  <IconRefresh aria-hidden />
                  {t.backupCodes.regenerate}
                </Button>
                <Button variant="outline" size="sm">
                  <IconDownload aria-hidden />
                  {t.backupCodes.download}
                </Button>
              </div>
            </CardContent>
            <CardContent variant="inset">
              <ul className={styles.codes}>
                {codes.map((code) => (
                  <li key={code} className={styles.code}>
                    <code>{code}</code>
                  </li>
                ))}
              </ul>
            </CardContent>
          </>
        )}
      </Card>

      <AlertDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        tone="danger"
        title={t.confirmOff.title}
        actionLabel={t.confirmOff.action}
        cancelLabel={t.confirmOff.cancel}
        onAction={() => setEnabled(false)}
      >
        {t.confirmOff.body}
      </AlertDialog>
    </main>
  );
}
