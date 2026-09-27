import {
  Amount,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Eyebrow,
  IconTile,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from '@strata/react';
import {
  IconCalendar,
  IconCheck,
  IconDownload,
  IconFileText,
  IconReceipt,
  IconShieldCheck,
  IconX,
} from '@strata/icons';
import styles from './Screen.module.css';

const policy = {
  name: 'Family Health Shield',
  number: 'POL-8842-1190',
  planType: 'Family floater · 4 members',
  status: 'active' as const,
};

const statusLabel: Record<string, string> = {
  active: 'Active',
  lapsed: 'Lapsed',
  pending: 'Pending renewal',
};

const statusTone: Record<string, 'success' | 'danger' | 'warning'> = {
  active: 'success',
  lapsed: 'danger',
  pending: 'warning',
};

const included = [
  'Hospitalisation for 24 hours or more',
  'Pre- and post-hospitalisation care (60 / 90 days)',
  'Daycare procedures that need no 24-hour stay',
  'Ambulance charges up to ₹5,000 per trip',
  'One annual health check-up for every member',
];

const excluded = [
  'Cosmetic or plastic surgery',
  'Self-inflicted injury',
  'Dental treatment, unless from an accident',
  'Pregnancy and childbirth in the first 9 months',
];

const documents = [
  { id: 'schedule', name: 'Policy schedule', meta: 'PDF · 412 KB · Updated 3 Jan 2026', icon: IconFileText },
  { id: 'wording', name: 'Policy wording', meta: 'PDF · 1.1 MB · Updated 3 Jan 2026', icon: IconFileText },
  { id: 'receipt', name: 'Premium receipt', meta: 'PDF · 88 KB · Updated 12 Sep 2026', icon: IconReceipt },
  { id: 'card', name: 'Health card', meta: 'PDF · 156 KB · Updated 3 Jan 2026', icon: IconShieldCheck },
];

const nextPayment = {
  amount: 18400,
  currency: 'INR',
  dueDate: '15 October 2026',
  method: 'Auto-debit · HDFC Bank •• 4821',
};

const paymentHistory = [
  { id: 'p1', date: '15 September 2026', amount: 18400 },
  { id: 'p2', date: '15 August 2026', amount: 18400 },
  { id: 'p3', date: '15 July 2026', amount: 17900 },
];

export default function Screen() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Eyebrow>Health insurance</Eyebrow>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>{policy.name}</h1>
          <Badge variant="status" tone={statusTone[policy.status]}>
            {statusLabel[policy.status]}
          </Badge>
        </div>
        <p className={styles.subtitle}>
          {policy.number} · {policy.planType}
        </p>
      </header>

      <Tabs defaultSelectedKey="cover">
        <TabList aria-label="Policy details">
          <Tab id="cover">Cover</Tab>
          <Tab id="documents">Documents</Tab>
          <Tab id="payments">Payments</Tab>
        </TabList>

        <TabPanel id="cover">
          <div className={styles.coverGrid}>
            <Card variant="outline">
              <CardHeader>
                <CardTitle level={2}>What&apos;s included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className={styles.list}>
                  {included.map((item) => (
                    <li key={item} className={styles.listItem}>
                      <IconCheck aria-hidden className={styles.iconSuccess} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card variant="outline">
              <CardHeader>
                <CardTitle level={2}>What&apos;s not included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className={styles.list}>
                  {excluded.map((item) => (
                    <li key={item} className={styles.listItem}>
                      <IconX aria-hidden className={styles.iconDanger} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabPanel>

        <TabPanel id="documents">
          <Card variant="outline">
            <CardContent variant="inset">
              <ul className={styles.docList}>
                {documents.map((doc) => (
                  <li key={doc.id} className={styles.docRow}>
                    <IconTile size="sm" tint="brand">
                      <doc.icon aria-hidden />
                    </IconTile>
                    <div className={styles.docInfo}>
                      <span className={styles.docName}>{doc.name}</span>
                      <span className={styles.docMeta}>{doc.meta}</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <IconDownload aria-hidden />
                      Download
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel id="payments">
          <div className={styles.paymentsStack}>
            <Card>
              <CardHeader>
                <CardTitle level={2}>Next payment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={styles.nextPayment}>
                  <div>
                    <Amount value={nextPayment.amount} currency={nextPayment.currency} size="lg" />
                    <p className={styles.dueDate}>
                      <IconCalendar aria-hidden className={styles.iconSubtle} />
                      Due {nextPayment.dueDate}
                    </p>
                    <p className={styles.method}>{nextPayment.method}</p>
                  </div>
                  <Badge variant="status" tone="info">
                    Upcoming
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card variant="outline">
              <CardHeader>
                <CardTitle level={2}>Last three payments</CardTitle>
              </CardHeader>
              <CardContent variant="inset">
                <ul className={styles.historyList}>
                  {paymentHistory.map((payment) => (
                    <li key={payment.id} className={styles.historyRow}>
                      <span className={styles.historyDate}>{payment.date}</span>
                      <Amount value={payment.amount} currency={nextPayment.currency} size="sm" />
                      <Badge variant="status" tone="success">
                        Paid
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
