import {
  Amount,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  IconTile,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from '@strata/react';
import {
  IconCircleCheck,
  IconCircleX,
  IconDownload,
  IconFileText,
} from '@strata/icons';
import styles from './Screen.module.css';

const policy = {
  name: 'Family Health Shield',
  number: 'POL-8823-4471',
  status: { label: 'Active', tone: 'success' as const },
};

const cover = {
  included: [
    'Hospitalisation and daycare procedures',
    'Pre- and post-hospitalisation care, 60 days',
    'Ambulance charges, up to ₹5,000 per trip',
    'One annual health check-up for every member',
  ],
  excluded: [
    'Cosmetic or dental treatment',
    'Self-inflicted injury',
    'Pregnancy and childbirth',
    'Treatment received outside India',
  ],
};

const documents = [
  { name: 'Policy schedule', meta: 'PDF · 240 KB' },
  { name: 'Terms and conditions', meta: 'PDF · 1.1 MB' },
  { name: 'Premium receipt', meta: 'PDF · 96 KB' },
  { name: 'Claim form', meta: 'PDF · 180 KB' },
];

const nextPayment = {
  amount: 8400,
  currency: 'INR',
  dueDate: '14 Oct 2026',
};

const paymentHistory = [
  { date: '14 Jul 2026', amount: 8400, currency: 'INR' },
  { date: '14 Apr 2026', amount: 8400, currency: 'INR' },
  { date: '14 Jan 2026', amount: 8000, currency: 'INR' },
];

export default function Screen() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{policy.name}</h1>
          <p className={styles.meta}>Policy number {policy.number}</p>
        </div>
        <Badge variant="status" tone={policy.status.tone}>
          {policy.status.label}
        </Badge>
      </header>

      <Tabs defaultSelectedKey="cover">
        <TabList aria-label="Policy details">
          <Tab id="cover">Cover</Tab>
          <Tab id="documents" count={documents.length}>
            Documents
          </Tab>
          <Tab id="payments">Payments</Tab>
        </TabList>

        <TabPanel id="cover">
          <div className={styles.coverGrid}>
            <Card variant="outline">
              <CardHeader>
                <CardTitle level={2}>What's included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className={styles.coverList}>
                  {cover.included.map((item) => (
                    <li key={item} className={styles.coverItem}>
                      <IconCircleCheck aria-hidden className={styles.iconSuccess} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card variant="outline">
              <CardHeader>
                <CardTitle level={2}>What's not included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className={styles.coverList}>
                  {cover.excluded.map((item) => (
                    <li key={item} className={styles.coverItem}>
                      <IconCircleX aria-hidden className={styles.iconDanger} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabPanel>

        <TabPanel id="documents">
          <Card>
            <CardHeader>
              <CardTitle level={2}>Documents</CardTitle>
            </CardHeader>
            <CardContent variant="inset">
              <ul className={styles.documentsList}>
                {documents.map((doc) => (
                  <li key={doc.name} className={styles.documentRow}>
                    <IconTile>
                      <IconFileText aria-hidden />
                    </IconTile>
                    <div className={styles.documentInfo}>
                      <span className={styles.documentName}>{doc.name}</span>
                      <span className={styles.documentMeta}>{doc.meta}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Download ${doc.name}`}
                    >
                      <IconDownload aria-hidden />
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
                <div className={styles.nextPaymentRow}>
                  <Amount
                    value={nextPayment.amount}
                    currency={nextPayment.currency}
                    locale="en-IN"
                    size="lg"
                  />
                  <Badge variant="status" tone="info">
                    Due {nextPayment.dueDate}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle level={2}>Last 3 payments</CardTitle>
              </CardHeader>
              <CardContent variant="inset">
                <ul className={styles.historyList}>
                  {paymentHistory.map((payment) => (
                    <li key={payment.date} className={styles.historyRow}>
                      <span className={styles.historyDate}>{payment.date}</span>
                      <Amount
                        value={payment.amount}
                        currency={payment.currency}
                        locale="en-IN"
                        size="sm"
                      />
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
