import { useId, useState } from 'react';
import {
  AlertDialog,
  Badge,
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
} from '@syntara/react';
import styles from './Screen.module.css';

type TwoFactorMethod = 'app' | 'sms';

interface TwoFactorData {
  enabled: boolean;
  method: TwoFactorMethod;
  phone: string;
  backupCodes: string[];
  codesRemaining: number;
}

const mockTwoFactor: TwoFactorData = {
  enabled: true,
  method: 'app',
  phone: '+91 98765 43210',
  backupCodes: ['7F4K-2QRT', 'H8LM-93VD', 'X2PB-6UYN', 'K5WZ-1CFE', 'Q9RT-4JXL', 'M3NB-8SGH', 'D6VC-2KPY', 'L1TA-7MQW'],
  codesRemaining: 8,
};

export default function Screen() {
  const uid = useId();
  const [enabled, setEnabled] = useState(mockTwoFactor.enabled);
  const [method, setMethod] = useState<TwoFactorMethod>(mockTwoFactor.method);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleToggle = (next: boolean) => {
    if (next) {
      setEnabled(true);
    } else {
      setConfirmOpen(true);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Security</h1>
        <p className={styles.description}>Manage how you sign in and keep your account secure.</p>
      </div>

      <Card>
        <CardHeader divider>
          <CardTitle id={`${uid}-title`} level={2}>
            Two-factor authentication
          </CardTitle>
          <CardDescription>Require a second step, in addition to your password, when you sign in.</CardDescription>
          <CardAction>
            <Badge tone={enabled ? 'success' : 'neutral'} variant="status">
              {enabled ? 'On' : 'Off'}
            </Badge>
          </CardAction>
        </CardHeader>

        <CardContent className={styles.stack}>
          <Switch
            isSelected={enabled}
            onChange={handleToggle}
            description={
              enabled
                ? 'Two-factor authentication is on. You will be asked for a code after your password.'
                : "Turning this on will ask you for a code, as well as your password, each time you sign in."
            }
          >
            Require a code at sign-in
          </Switch>

          {enabled && (
            <>
              <Separator />

              <RadioGroup
                variant="card"
                label="Verification method"
                description="Choose how you'd like to receive your codes."
                value={method}
                onChange={(value) => setMethod(value as TwoFactorMethod)}
              >
                <Radio value="app" description="Get codes from an authenticator app such as Google Authenticator or Authy.">
                  Authenticator app
                </Radio>
                <Radio value="sms" description={`Get codes by text message to ${mockTwoFactor.phone}.`}>
                  Text message
                </Radio>
              </RadioGroup>
            </>
          )}
        </CardContent>

        {enabled && (
          <>
            <CardContent className={styles.backupHeader}>
              <p className={styles.rowLabel}>Backup codes</p>
              <p className={styles.rowDescription}>
                Use one of these codes to sign in if you lose access to your device. Each code works once; you have{' '}
                {mockTwoFactor.codesRemaining} left.
              </p>
            </CardContent>
            <CardContent variant="inset">
              <ul className={styles.codeGrid}>
                {mockTwoFactor.backupCodes.map((code) => (
                  <li key={code} className={styles.code}>
                    {code}
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
        title="Turn off two-factor authentication?"
        actionLabel="Turn off"
        cancelLabel="Keep it on"
        onAction={() => setEnabled(false)}
      >
        Your account will only need a password to sign in. This makes it easier for someone else to get in.
      </AlertDialog>
    </div>
  );
}
