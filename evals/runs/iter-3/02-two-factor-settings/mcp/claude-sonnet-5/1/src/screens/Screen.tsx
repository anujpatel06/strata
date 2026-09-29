'use client';

import { useState } from 'react';
import {
  AlertDialog,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Radio,
  RadioGroup,
  Separator,
  Switch,
} from '@syntara/react';
import { IconEye, IconEyeOff, IconRefresh, IconShieldLock } from '@syntara/icons';
import styles from './Screen.module.css';

type Method = 'app' | 'sms';

function makeBackupCodes(): string[] {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  return Array.from({ length: 8 }, () => {
    const part = () =>
      Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${part()}-${part()}`;
  });
}

const INITIAL_CODES = [
  'K3F9-7DMX',
  'Q2LR-84TN',
  'W7YB-2PKC',
  'H5XM-9RJ2',
  'T8NQ-3VBF',
  'C4GZ-6LWD',
  'R9PX-1KHY',
  'M6JT-5QCV',
];

export default function Screen() {
  const [enabled, setEnabled] = useState(true);
  const [method, setMethod] = useState<Method>('app');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [codesVisible, setCodesVisible] = useState(false);
  const [codes, setCodes] = useState<string[]>(INITIAL_CODES);

  const handleSwitchChange = (isSelected: boolean) => {
    if (isSelected) {
      setEnabled(true);
    } else {
      setConfirmOpen(true);
    }
  };

  const handleRegenerateCodes = () => {
    setCodes(makeBackupCodes());
    setCodesVisible(true);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Security settings</h1>
        <p className={styles.pageDescription}>Manage how you sign in and keep your account secure.</p>
      </header>

      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>
            <IconShieldLock aria-hidden className={styles.titleIcon} />
            Two-factor authentication
          </CardTitle>
          <CardDescription>Require a second step, on top of your password, when you sign in.</CardDescription>
        </CardHeader>
        <CardContent className={styles.content}>
          <div className={styles.statusRow}>
            <Switch isSelected={enabled} onChange={handleSwitchChange} description="Get a one-time code each time you sign in on a new device.">
              Two-factor authentication
            </Switch>
            <Badge variant="status" tone={enabled ? 'success' : 'neutral'}>
              {enabled ? 'On' : 'Off'}
            </Badge>
          </div>

          {enabled && (
            <>
              <Separator />

              <RadioGroup label="Verification method" description="How you'd like to receive your code." value={method} onChange={(value) => setMethod(value as Method)}>
                <Radio value="app" description="Get a code from an authenticator app, such as Google Authenticator or Authy.">
                  Authenticator app
                </Radio>
                <Radio value="sms" description="Get a code by text message to the number ending •••• 245.">
                  Text message
                </Radio>
              </RadioGroup>

              <Separator />

              <div className={styles.backupSection}>
                <div className={styles.backupHeader}>
                  <div>
                    <h3 className={styles.backupTitle}>Backup codes</h3>
                    <p className={styles.backupDescription}>
                      Use one of these codes to sign in if you lose access to your {method === 'app' ? 'authenticator app' : 'phone'}. Each code
                      works once.
                    </p>
                  </div>
                  <div className={styles.backupActions}>
                    <Button variant="ghost" size="sm" onPress={() => setCodesVisible((v) => !v)}>
                      {codesVisible ? <IconEyeOff aria-hidden /> : <IconEye aria-hidden />}
                      {codesVisible ? 'Hide codes' : 'Show codes'}
                    </Button>
                    <Button variant="outline" size="sm" onPress={handleRegenerateCodes}>
                      <IconRefresh aria-hidden />
                      Generate new codes
                    </Button>
                  </div>
                </div>

                <CardContent variant="inset" className={styles.codesInset}>
                  {codesVisible ? (
                    <ul className={styles.codesGrid}>
                      {codes.map((code) => (
                        <li key={code} className={styles.codeItem} dir="ltr">
                          <code>{code}</code>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.codesHidden}>Your 8 backup codes are hidden. Select "Show codes" to view them.</p>
                  )}
                </CardContent>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Turn off two-factor authentication?"
        tone="danger"
        actionLabel="Turn off"
        onAction={() => setEnabled(false)}
      >
        This lowers the security of your account. Anyone who has your password will be able to sign in without a second step.
      </AlertDialog>
    </div>
  );
}
