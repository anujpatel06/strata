import { useState } from 'react';
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
  Kbd,
  Radio,
  RadioGroup,
  Separator,
  Switch,
} from '@strata/react';
import { IconCheck, IconCopy, IconDeviceMobile, IconKey, IconShieldLock } from '@strata/icons';
import styles from './Screen.module.css';

type TwoFactorMethod = 'app' | 'sms';

const mockUser = {
  phoneNumberLast4: '4821',
};

const mockBackupCodes = [
  '4F7K-9XQ2',
  'J2M8-KD41',
  'P9VC-3W7T',
  'R5HN-QZ82',
  'T8LB-6YF3',
  'X3QW-KP95',
  'M1VD-7RE4',
  'K6JT-2NB8',
  'W4XP-9LC1',
  'B7ZR-4TQ6',
];

export default function Screen() {
  const [enabled, setEnabled] = useState(true);
  const [method, setMethod] = useState<TwoFactorMethod>('app');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleSwitchChange(next: boolean) {
    if (next) {
      setEnabled(true);
    } else {
      setConfirmOpen(true);
    }
  }

  function handleCopyCodes() {
    navigator.clipboard?.writeText(mockBackupCodes.join('\n')).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Security settings</h1>
        <p className={styles.pageDescription}>Manage how you sign in and keep your account secure.</p>
      </header>

      <Card className={styles.card}>
        <CardHeader divider>
          <div className={styles.headerText}>
            <div className={styles.titleRow}>
              <CardTitle level={2} id="two-factor-heading">
                Two-factor authentication
              </CardTitle>
              <Badge tone={enabled ? 'success' : 'neutral'} variant="status">
                {enabled ? 'On' : 'Off'}
              </Badge>
            </div>
            <CardDescription>
              Require a code from your phone in addition to your password when you sign in.
            </CardDescription>
          </div>
          <CardAction>
            <Switch
              isSelected={enabled}
              onChange={handleSwitchChange}
              aria-labelledby="two-factor-heading"
            />
          </CardAction>
        </CardHeader>

        {enabled && (
          <CardContent className={styles.content}>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Verification method</h3>
              <p className={styles.sectionDescription}>Choose how you'd like to receive your codes.</p>
              <RadioGroup
                aria-label="Two-factor verification method"
                variant="card"
                value={method}
                onChange={(value) => setMethod(value as TwoFactorMethod)}
              >
                <Radio
                  value="app"
                  description="Get a code from an authenticator app, like Google Authenticator or 1Password."
                >
                  <span className={styles.radioLabel}>
                    <IconShieldLock />
                    Authenticator app
                  </span>
                </Radio>
                <Radio
                  value="sms"
                  description={`Get a code by text message to the number ending in ${mockUser.phoneNumberLast4}.`}
                >
                  <span className={styles.radioLabel}>
                    <IconDeviceMobile />
                    Text message
                  </span>
                </Radio>
              </RadioGroup>
            </section>

            <Separator />

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Backup codes</h3>
              <p className={styles.sectionDescription}>
                Use one of these codes to sign in if you lose access to your {method === 'app' ? 'authenticator app' : 'phone'}.
                Each code works once.
              </p>
              <div className={styles.codeGrid}>
                {mockBackupCodes.map((code) => (
                  <Kbd key={code} className={styles.code}>
                    {code}
                  </Kbd>
                ))}
              </div>
              <Button variant="outline" size="sm" onPress={handleCopyCodes} className={styles.copyButton}>
                {copied ? (
                  <>
                    <IconCheck />
                    Copied
                  </>
                ) : (
                  <>
                    <IconCopy />
                    Copy codes
                  </>
                )}
              </Button>
            </section>
          </CardContent>
        )}

        {!enabled && (
          <CardContent className={styles.content}>
            <p className={styles.disabledHint}>
              <IconKey />
              Turn on two-factor authentication to add an extra layer of security to your account.
            </p>
          </CardContent>
        )}
      </Card>

      <AlertDialog
        title="Turn off two-factor authentication?"
        actionLabel="Turn off"
        cancelLabel="Cancel"
        tone="danger"
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        onAction={() => setEnabled(false)}
      >
        Your account will be less secure without a second step at sign-in. Anyone who knows your password will
        be able to sign in.
      </AlertDialog>
    </div>
  );
}
