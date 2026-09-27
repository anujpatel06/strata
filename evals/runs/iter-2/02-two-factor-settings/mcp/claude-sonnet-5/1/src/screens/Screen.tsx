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
  Radio,
  RadioGroup,
  Separator,
  Switch,
} from '@strata/react';
import { IconCopy, IconEye, IconEyeOff, IconRefresh } from '@strata/icons';
import styles from './Screen.module.css';

type Method = 'app' | 'sms';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateBackupCodes(): string[] {
  const group = () =>
    Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  return Array.from({ length: 8 }, () => `${group()}-${group()}`);
}

const initialBackupCodes = [
  'H4KX-9RTN',
  'QP2M-VD7C',
  'B8WL-3XFZ',
  'T6NY-KH4Q',
  'RG9J-P2CW',
  'X3VD-8MNL',
  'ZK7H-Q4RT',
  'W5CB-N9XJ',
];

export default function Screen() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [method, setMethod] = useState<Method>('app');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [codesVisible, setCodesVisible] = useState(false);
  const [backupCodes, setBackupCodes] = useState(initialBackupCodes);
  const [copyLabel, setCopyLabel] = useState('Copy codes');

  const handleToggle = (selected: boolean) => {
    if (selected) {
      setIsEnabled(true);
    } else {
      setIsConfirmOpen(true);
    }
  };

  const handleConfirmDisable = () => {
    setIsEnabled(false);
    setCodesVisible(false);
  };

  const handleRegenerate = () => {
    setBackupCodes(generateBackupCodes());
    setCodesVisible(true);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopyLabel('Copied');
    setTimeout(() => setCopyLabel('Copy codes'), 2000);
  };

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>Require a second step, in addition to your password, when you sign in.</CardDescription>
          <CardAction>
            <Badge tone={isEnabled ? 'success' : 'neutral'}>{isEnabled ? 'On' : 'Off'}</Badge>
          </CardAction>
        </CardHeader>

        <CardContent className={styles.content}>
          <Switch
            isSelected={isEnabled}
            onChange={handleToggle}
            description="Adds a one-time code to your password when you sign in on a new device."
          >
            Two-factor authentication
          </Switch>

          {isEnabled && (
            <>
              <Separator />

              <RadioGroup
                variant="card"
                label="Verification method"
                value={method}
                onChange={(value) => setMethod(value as Method)}
              >
                <Radio value="app" description="Get a code from an authenticator app, such as Google Authenticator or 1Password.">
                  Authenticator app
                </Radio>
                <Radio value="sms" description="Get a code by text message to +1 •••• •••• 42.">
                  Text message
                </Radio>
              </RadioGroup>

              <Separator />

              <div className={styles.backupHeader}>
                <div>
                  <h3 className={styles.backupTitle}>Backup codes</h3>
                  <p className={styles.backupDescription}>
                    Use one of these codes to sign in if you lose access to your{' '}
                    {method === 'app' ? 'authenticator app' : 'phone'}. Each code works once.
                  </p>
                </div>
                <div className={styles.backupActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={codesVisible ? 'Hide backup codes' : 'Show backup codes'}
                    onPress={() => setCodesVisible((visible) => !visible)}
                  >
                    {codesVisible ? <IconEyeOff aria-hidden /> : <IconEye aria-hidden />}
                  </Button>
                  <Button variant="ghost" size="sm" onPress={handleCopy}>
                    <IconCopy aria-hidden />
                    {copyLabel}
                  </Button>
                  <Button variant="outline" size="sm" onPress={handleRegenerate}>
                    <IconRefresh aria-hidden />
                    Regenerate codes
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>

        {isEnabled && (
          <CardContent variant="inset">
            <ul className={styles.codesList}>
              {backupCodes.map((code) => (
                <li key={code} className={styles.code}>
                  {codesVisible ? code : '••••-••••'}
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>

      <AlertDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Turn off two-factor authentication?"
        tone="danger"
        actionLabel="Turn off"
        onAction={handleConfirmDisable}
      >
        Your account will only need a password to sign in. This makes it easier for someone else to get in if your
        password is ever exposed.
      </AlertDialog>
    </div>
  );
}
