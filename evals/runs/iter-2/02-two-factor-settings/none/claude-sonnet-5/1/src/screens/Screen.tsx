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
  Radio,
  RadioGroup,
  Separator,
  Switch,
  Tag,
  ToastRegion,
  toast,
} from '@strata/react';
import { IconCopy, IconEye, IconEyeOff, IconKey, IconPhone, IconRefresh } from '@strata/icons';
import styles from './Screen.module.css';

type Method = 'app' | 'sms';

interface BackupCode {
  code: string;
  used: boolean;
}

const PHONE_NUMBER = '+91 98765 43210';
const AUTHENTICATOR_APP = 'Google Authenticator';

const INITIAL_BACKUP_CODES: BackupCode[] = [
  { code: '7K4M-QX2P', used: true },
  { code: 'D9VN-4F7T', used: true },
  { code: 'B2LR-88KZ', used: false },
  { code: 'X5QW-1N6D', used: false },
  { code: 'M3TY-72JC', used: false },
  { code: 'H8FZ-93RQ', used: false },
  { code: 'L6PN-05WX', used: false },
  { code: 'V1CK-64GD', used: false },
  { code: 'R7XB-38MT', used: false },
  { code: 'Q4HS-21YV', used: false },
];

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateBackupCodes(): BackupCode[] {
  return Array.from({ length: 10 }, () => {
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
      if (i === 3) code += '-';
    }
    return { code, used: false };
  });
}

export default function Screen() {
  const [enabled, setEnabled] = useState(true);
  const [method, setMethod] = useState<Method>('app');
  const [backupCodes, setBackupCodes] = useState(INITIAL_BACKUP_CODES);
  const [codesRevealed, setCodesRevealed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const unusedCount = backupCodes.filter((c) => !c.used).length;

  function handleSwitchChange(next: boolean) {
    if (next) {
      setEnabled(true);
      toast({ title: 'Two-factor authentication turned on', tone: 'success' });
    } else {
      setConfirmOpen(true);
    }
  }

  function handleConfirmDisable() {
    setEnabled(false);
    setCodesRevealed(false);
    toast({ title: 'Two-factor authentication turned off', tone: 'warning' });
  }

  function handleRegenerate() {
    setBackupCodes(generateBackupCodes());
    setCodesRevealed(true);
    toast({ title: 'New backup codes generated', description: 'Your old codes no longer work.', tone: 'success' });
  }

  async function handleCopyAll() {
    const text = backupCodes.map((c) => c.code).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Backup codes copied', tone: 'success' });
    } catch {
      toast({ title: 'Could not copy codes', tone: 'danger' });
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Security settings</h1>
        <p className={styles.pageSubtitle}>Manage how you sign in and keep your account secure.</p>
      </header>

      <Card variant="outline" className={styles.card}>
        <CardHeader divider>
          <CardTitle level={2} className={styles.titleRow}>
            <span>Two-factor authentication</span>
            <Badge tone={enabled ? 'success' : 'neutral'} variant={enabled ? 'soft' : 'outline'} size="sm" dot>
              {enabled ? 'On' : 'Off'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Add a second step when you sign in, using an authenticator app or a text message code.
          </CardDescription>
          <CardAction>
            <Switch
              aria-label="Turn two-factor authentication on or off"
              isSelected={enabled}
              onChange={handleSwitchChange}
            />
          </CardAction>
        </CardHeader>

        {!enabled && (
          <CardContent>
            <Alert tone="warning" title="Two-factor authentication is off">
              Turn it on to require a code from your phone, in addition to your password, when you sign in.
            </Alert>
          </CardContent>
        )}

        {enabled && (
          <CardContent className={styles.content}>
            <RadioGroup
              label="Verification method"
              description="Choose how you'd like to receive your sign-in codes."
              variant="card"
              value={method}
              onChange={(value) => setMethod(value as Method)}
            >
              <Radio
                value="app"
                description="Get a 6-digit code from an authenticator app. More secure than text messages."
              >
                <span className={styles.radioLabel}>
                  <IconKey size={18} />
                  Authenticator app
                </span>
              </Radio>
              <Radio value="sms" description={`We'll send a code by text message to ${PHONE_NUMBER}.`}>
                <span className={styles.radioLabel}>
                  <IconPhone size={18} />
                  Text message
                </span>
              </Radio>
            </RadioGroup>

            {method === 'app' && (
              <p className={styles.methodStatus}>Connected to {AUTHENTICATOR_APP}.</p>
            )}

            <Separator />

            <div className={styles.backupSection}>
              <div className={styles.backupHeader}>
                <div className={styles.backupHeadingGroup}>
                  <CardTitle level={3}>Backup codes</CardTitle>
                  <CardDescription>
                    Use one of these codes to sign in if you lose access to your device. Each code works once.
                  </CardDescription>
                </div>
                <Badge tone={unusedCount > 2 ? 'neutral' : 'warning'} variant="soft" size="sm">
                  {unusedCount} of {backupCodes.length} left
                </Badge>
              </div>

              <CardContent variant="inset">
                <ul className={styles.codesList}>
                  {backupCodes.map(({ code, used }) => (
                    <li key={code} className={used ? styles.codeRowUsed : styles.codeRow}>
                      <span className={used ? styles.codeTextUsed : styles.codeText}>
                        {codesRevealed ? code : '••••-••••'}
                      </span>
                      {used && (
                        <Tag size="sm" tone="neutral" variant="outline">
                          Used
                        </Tag>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <div className={styles.backupActions}>
                <Button variant="outline" size="sm" onPress={() => setCodesRevealed((v) => !v)}>
                  {codesRevealed ? <IconEyeOff /> : <IconEye />}
                  {codesRevealed ? 'Hide codes' : 'Reveal codes'}
                </Button>
                <Button variant="outline" size="sm" onPress={handleCopyAll}>
                  <IconCopy />
                  Copy all
                </Button>
                <Button variant="ghost" size="sm" onPress={handleRegenerate}>
                  <IconRefresh />
                  Regenerate codes
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <AlertDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Turn off two-factor authentication?"
        actionLabel="Turn off"
        cancelLabel="Cancel"
        tone="danger"
        onAction={handleConfirmDisable}
      >
        Your account will only need a password to sign in. This makes it easier for someone else to get in if your
        password is ever exposed.
      </AlertDialog>

      <ToastRegion />
    </div>
  );
}
