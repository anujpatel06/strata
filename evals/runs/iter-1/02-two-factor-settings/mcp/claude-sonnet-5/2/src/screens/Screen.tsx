import { useId, useState, type ReactNode } from 'react';
import {
  AlertDialog,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Radio,
  RadioGroup,
  Switch,
} from '@strata/react';
import { IconCheck, IconEye, IconEyeOff, IconKey } from '@strata/icons';
import styles from './Screen.module.css';

type TwoFactorMethod = 'app' | 'sms';

interface SecurityContent {
  page: { title: string; description: string };
  twoFactor: {
    title: string;
    description: string;
    on: string;
    off: string;
    switchLabel: string;
    switchDescription: string;
    methodLabel: string;
    methodDescription: string;
    methods: Record<TwoFactorMethod, { label: string; description: string }>;
    backupCodes: {
      title: string;
      description: string;
      show: string;
      hide: string;
      getNew: string;
      used: string;
    };
    confirmOff: {
      title: string;
      body: string;
      action: string;
      cancel: string;
    };
  };
}

// Mock data. There is no backend.
const content: SecurityContent = {
  page: {
    title: 'Security',
    description: 'Manage how you sign in and keep your account safe.',
  },
  twoFactor: {
    title: 'Two-factor authentication',
    description: 'Add a second step when you sign in, on top of your password.',
    on: 'Turned on',
    off: 'Turned off',
    switchLabel: 'Require a second step at sign-in',
    switchDescription: 'You’ll be asked for a code from your chosen method after your password.',
    methodLabel: 'How you get your code',
    methodDescription: 'Choose one way to receive your sign-in codes.',
    methods: {
      app: { label: 'Authenticator app', description: 'Get a code from an app like Google Authenticator or Authy.' },
      sms: { label: 'Text message', description: 'Get a code by SMS to •••• ••• 512.' },
    },
    backupCodes: {
      title: 'Backup codes',
      description: 'Use one of these if you lose access to your device. Each code works once.',
      show: 'Show codes',
      hide: 'Hide codes',
      getNew: 'Get new codes',
      used: 'Used',
    },
    confirmOff: {
      title: 'Turn off two-factor authentication?',
      body: 'Your account will only need a password to sign in. This lowers the security of your account.',
      action: 'Turn off two-factor authentication',
      cancel: 'Keep it on',
    },
  },
};

const backupCodes: { code: string; used: boolean }[] = [
  { code: '4927-1830', used: false },
  { code: '7183-2094', used: false },
  { code: '0912-6647', used: true },
  { code: '5561-3820', used: false },
  { code: '2298-4471', used: false },
  { code: '8834-0192', used: true },
  { code: '3390-7728', used: false },
  { code: '6612-9954', used: false },
];

function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h1 id={id} className={styles.pageTitle}>
      {children}
    </h1>
  );
}

export default function Screen() {
  const uid = useId();
  const t = content.twoFactor;

  const [enabled, setEnabled] = useState(true);
  const [method, setMethod] = useState<TwoFactorMethod>('app');
  const [codesVisible, setCodesVisible] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSwitchChange = (next: boolean) => {
    if (next) {
      setEnabled(true);
    } else {
      setConfirmOpen(true);
    }
  };

  const titleId = `${uid}-title`;

  return (
    <div className={styles.page}>
      <SectionHeading id={`${uid}-page-title`}>{content.page.title}</SectionHeading>
      <p className={styles.pageDescription}>{content.page.description}</p>

      <Card aria-labelledby={titleId}>
        <CardHeader>
          <CardTitle level={2} id={titleId}>
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
          <CardAction>
            <Badge tone={enabled ? 'success' : 'neutral'} icon={enabled ? <IconCheck /> : undefined}>
              {enabled ? t.on : t.off}
            </Badge>
          </CardAction>
        </CardHeader>

        <CardContent className={styles.stack}>
          <Switch
            isSelected={enabled}
            onChange={handleSwitchChange}
            description={t.switchDescription}
            className={styles.switch}
          >
            {t.switchLabel}
          </Switch>
        </CardContent>

        {enabled && (
          <CardContent className={styles.stack}>
            <RadioGroup
              variant="card"
              label={t.methodLabel}
              description={t.methodDescription}
              value={method}
              onChange={(value) => setMethod(value as TwoFactorMethod)}
              className={styles.methods}
            >
              <Radio value="app" description={t.methods.app.description}>
                {t.methods.app.label}
              </Radio>
              <Radio value="sms" description={t.methods.sms.description}>
                {t.methods.sms.label}
              </Radio>
            </RadioGroup>
          </CardContent>
        )}

        {enabled && (
          <CardContent className={styles.backupCodesHeader}>
            <div>
              <p className={styles.rowLabel}>{t.backupCodes.title}</p>
              <p className={styles.rowDescription}>{t.backupCodes.description}</p>
            </div>
            <div className={styles.backupCodesActions}>
              <Button variant="outline" size="sm" onPress={() => setCodesVisible((v) => !v)}>
                {codesVisible ? <IconEyeOff aria-hidden /> : <IconEye aria-hidden />}
                {codesVisible ? t.backupCodes.hide : t.backupCodes.show}
              </Button>
              <Button variant="ghost" size="sm">
                {t.backupCodes.getNew}
              </Button>
            </div>
          </CardContent>
        )}

        {enabled && codesVisible && (
          <CardContent variant="inset">
            <ul className={styles.codesList}>
              {backupCodes.map(({ code, used }) => (
                <li key={code} className={styles.codeItem}>
                  <IconKey aria-hidden className={styles.codeIcon} />
                  <span className={used ? styles.codeUsed : styles.code}>{code}</span>
                  {used && (
                    <Badge tone="neutral" variant="outline" size="sm">
                      {t.backupCodes.used}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
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
    </div>
  );
}
