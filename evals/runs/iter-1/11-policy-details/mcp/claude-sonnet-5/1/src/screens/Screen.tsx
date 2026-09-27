import {
  Amount,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Eyebrow,
  IconTile,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tag,
} from '@strata/react';
import { IconCheck, IconDownload, IconFileText, IconX } from '@strata/icons';
import styles from './Screen.module.css';

const policy = {
  name: 'Family Health Shield',
  number: 'POL-4821-9903',
  category: 'Family floater',
  statusLabel: 'Active',
  statusTone: 'success' as const,
};

const included = [
  'Hospitalisation: room rent, ICU and surgery',
  'Pre- and post-hospitalisation, 60/90 days',
  'Daycare procedures that need less than 24 hours',
  'Ambulance cover, up to ₹15,000 per trip',
  'One annual health check-up for every member',
];

const excluded = [
  'Cosmetic or dental treatment',
  'Pregnancy and childbirth',
  'Injuries from adventure sports',
  'Treatment taken outside India',
];

const documents = [
  { name: 'Policy schedule', meta: 'PDF · 420 KB · updated 1 Apr 2025' },
  { name: 'Policy wording', meta: 'PDF · 1.1 MB · updated 1 Apr 2025' },
  { name: 'Premium receipt', meta: 'PDF · 96 KB · updated 14 Sep 2025' },
  { name: 'Health card', meta: 'PDF · 210 KB · updated 1 Apr 2025' },
];

const nextPayment = {
  amount: 8400,
  currency: 'INR',
  dueDate: '15 Oct 2025',
  method: 'Auto-debit · HDFC Bank ••4821',
};

const pastPayments = [
  { date: '15 Sep 2025', amount: 8400, status: 'Paid', tone: 'success' as const },
  { date: '15 Aug 2025', amount: 8400, status: 'Paid', tone: 'success' as const },
  { date: '15 Jul 2025', amount: 8400, status: 'Failed', tone: 'danger' as const },
];

export default function Screen() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <Eyebrow>Health insurance</Eyebrow>
          <h1 className={styles.title}>{policy.name}</h1>
          <div className={styles.subline}>
            <p className={styles.number}>Policy no. {policy.number}</p>
            <Tag size="sm">{policy.category}</Tag>
          </div>
        </div>
        <Badge variant="status" tone={policy.statusTone}>
          {policy.statusLabel}
        </Badge>
      </header>

      <Tabs defaultSelectedKey="cover">
        <TabList aria-label="Policy details">
          <Tab id="cover">Cover</Tab>
          <Tab id="documents">Documents</Tab>
          <Tab id="payments">Payments</Tab>
        </TabList>

        <TabPanel id="cover">
          <div className={styles.tabPanel}>
            <div className={styles.coverGrid}>
              <Card variant="outline">
                <CardHeader>
                  <CardTitle level={2}>What&apos;s included</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className={`${styles.list} ${styles.included}`}>
                    {included.map((item) => (
                      <li key={item} className={styles.listItem}>
                        <IconCheck className={styles.listIcon} aria-hidden />
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
                  <ul className={`${styles.list} ${styles.excluded}`}>
                    {excluded.map((item) => (
                      <li key={item} className={styles.listItem}>
                        <IconX className={styles.listIcon} aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabPanel>

        <TabPanel id="documents">
          <div className={styles.tabPanel}>
            <Card>
              <CardHeader>
                <CardTitle level={2}>Documents</CardTitle>
                <CardDescription>Download a copy for your records.</CardDescription>
              </CardHeader>
              <CardContent variant="inset">
                <ul className={styles.docList}>
                  {documents.map((doc) => (
                    <li key={doc.name} className={styles.docRow}>
                      <IconTile tint="brand" size="sm">
                        <IconFileText />
                      </IconTile>
                      <div className={styles.docInfo}>
                        <span className={styles.docName}>{doc.name}</span>
                        <span className={styles.docMeta}>{doc.meta}</span>
                      </div>
                      <Button variant="outline" size="sm">
                        <IconDownload aria-hidden />
                        Download
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabPanel>

        <TabPanel id="payments">
          <div className={styles.tabPanel}>
            <Card>
              <CardHeader divider>
                <CardTitle level={2}>Next payment</CardTitle>
                <CardDescription>{nextPayment.method}</CardDescription>
                <CardAction>
                  <Badge variant="status" tone="info">
                    Due {nextPayment.dueDate}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent className={styles.nextPayment}>
                <Amount value={nextPayment.amount} currency={nextPayment.currency} size="lg" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle level={2}>Last 3 payments</CardTitle>
              </CardHeader>
              <CardContent variant="inset">
                <ul className={styles.paymentList}>
                  {pastPayments.map((payment) => (
                    <li key={payment.date} className={styles.paymentRow}>
                      <span className={styles.paymentDate}>{payment.date}</span>
                      <span className={styles.paymentEnd}>
                        <Amount value={payment.amount} currency={nextPayment.currency} size="sm" />
                        <Badge variant="status" tone={payment.tone}>
                          {payment.status}
                        </Badge>
                      </span>
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
