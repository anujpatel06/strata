import { useState } from 'react';
import {
  Alert,
  AlertDialog,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  IconTile,
  Radio,
  RadioGroup,
  Separator,
  Switch,
} from '@strata/react';
import {
  IconCheck,
  IconCopy,
  IconDeviceMobile,
  IconEye,
  IconEyeOff,
  IconMessage,
  IconRefresh,
  IconShieldLock,
} from '@strata/icons';
import styles from './Screen.module.css';

type Method = 'app' | 'sms';

const BACKUP_CODES = [
  'RJ4K-7QWZ',
  'M2XP-9VDN',
  'T8LC-3HFR',
  'B5YQ-1KMS',
  'V7NW-4PJT',
  'D9GH-6ZXC',
  'L3RF-8QEB',
  'K6TM-2VNY',
  'W1CD-5JPH',
  'Q4XZ-7RLK',
];

const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateBackupCodes(): string[] {
  const block = () =>
    Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  return Array.from({ length: 10 }, () => `${block()}-${block()}`);
}

const PHONE_ON_FILE = '+1 •••-•••-4821';

export default function Screen() {
  const [enabled, setEnabled] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [method, setMethod] = useState<Method>('app');
  const [codesVisible, setCodesVisible] = useState(false);
  const [codes, setCodes] = useState(BACKUP_CODES);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  function handleToggle(isSelected: boolean) {
    if (isSelected) {
      setEnabled(true);
    } else {
      setConfirmOpen(true);
    }
  }

  function handleConfirmDisable() {
    setEnabled(false);
    setCodesVisible(false);
  }

  function handleRegenerate() {
    setCodes(generateBackupCodes());
    setCodesVisible(true);
  }

  function handleCopy(code: string) {
    void navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode((current) => (current === code ? null : current)), 1500);
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Security</h1>
        <p className={styles.subtitle}>Manage how you sign in and keep your account safe.</p>
      </div>

      <Card className={styles.card}>
        <CardHeader>
          <div className={styles.headerRow}>
            <IconTile>
              <IconShieldLock aria-hidden />
            </IconTile>
            <div className={styles.headerText}>
              <CardTitle>Two-factor authentication</CardTitle>
              <CardDescription>
                Require a second step, in addition to your password, when you sign in.
              </CardDescription>
            </div>
          </div>
          <CardAction>
            <Badge tone={enabled ? 'success' : 'neutral'}>{enabled ? 'On' : 'Off'}</Badge>
          </CardAction>
        </CardHeader>

        <CardContent className={styles.content}>
          <Switch
            isSelected={enabled}
            onChange={handleToggle}
            description="Get a one-time code when you sign in from a new device."
          >
            Two-factor authentication
          </Switch>

          {enabled ? (
            <>
              <Separator />

              <RadioGroup
                variant="card"
                label="How do you want to get your codes?"
                value={method}
                onChange={(value) => setMethod(value as Method)}
              >
                <Radio value="app" description="Codes from an app such as Google Authenticator or Authy.">
                  <span className={styles.radioLabel}>
                    <IconDeviceMobile aria-hidden />
                    Authenticator app
                  </span>
                </Radio>
                <Radio value="sms" description={`Codes sent by text message to ${PHONE_ON_FILE}.`}>
                  <span className={styles.radioLabel}>
                    <IconMessage aria-hidden />
                    Text message
                  </span>
                </Radio>
              </RadioGroup>

              <Separator />

              <div className={styles.backupSection}>
                <div className={styles.backupHeader}>
                  <div>
                    <p className={styles.backupTitle}>Backup codes</p>
                    <p className={styles.backupHint}>
                      Use one of these if you lose access to your{' '}
                      {method === 'app' ? 'authenticator app' : 'phone'}. Each code works once.
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onPress={() => setCodesVisible((visible) => !visible)}>
                    {codesVisible ? <IconEyeOff aria-hidden /> : <IconEye aria-hidden />}
                    {codesVisible ? 'Hide codes' : 'Show codes'}
                  </Button>
                </div>

                <ul className={styles.codesPanel}>
                  {codes.map((code, index) => (
                    <li className={styles.codeRow} key={code}>
                      <span className={styles.code}>{codesVisible ? code : '••••-••••'}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={copiedCode === code ? `Copied backup code ${index + 1}` : `Copy backup code ${index + 1}`}
                        onPress={() => handleCopy(code)}
                      >
                        {copiedCode === code ? <IconCheck aria-hidden /> : <IconCopy aria-hidden />}
                      </Button>
                    </li>
                  ))}
                </ul>

                <Button variant="outline" size="sm" className={styles.regenerateButton} onPress={handleRegenerate}>
                  <IconRefresh aria-hidden />
                  Regenerate codes
                </Button>
              </div>
            </>
          ) : (
            <Alert tone="warning" title="Two-factor authentication is off" live="polite">
              Your account only needs a password to sign in. Turn it on to add a second step.
            </Alert>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Turn off two-factor authentication?"
        tone="danger"
        actionLabel="Turn off"
        onAction={handleConfirmDisable}
      >
        Your account will only need a password to sign in. This lowers its security.
      </AlertDialog>
    </div>
  );
}
